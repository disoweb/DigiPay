import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupJWTAuth, authenticateToken, requireKYC, requireAdmin } from "./auth-jwt";
import { storage } from "./storage";
import { insertOfferSchema, insertTradeSchema, insertMessageSchema, insertTransactionSchema, insertRatingSchema } from "@shared/schema";
import { youVerifyService } from "./services/youverify";
import { paystackService } from "./services/paystack";
import { tronService } from "./services/tron";
import { emailService, smsService } from "./services/notifications";

export async function registerRoutes(app: Express): Promise<Server> {
  setupJWTAuth(app);

  // User routes - MUST be first to avoid frontend route conflict
  app.get("/api/user", authenticateToken, async (req, res) => {
    try {
      const { password: _, ...userWithoutPassword } = req.user!;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Add logout endpoint
  app.post("/api/logout", authenticateToken, async (req, res) => {
    try {
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Withdrawal endpoint - now requires admin approval
  app.post("/api/withdraw", authenticateToken, async (req, res) => {
    try {
      const { amount, bankName, accountNumber, accountName } = req.body;
      const userId = req.user!.id;
      
      if (!amount || !bankName || !accountNumber || !accountName) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const withdrawAmount = parseFloat(amount);
      if (withdrawAmount < 100) {
        return res.status(400).json({ error: "Minimum withdrawal amount is ₦100" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const availableBalance = parseFloat(user.nairaBalance || "0");
      if (withdrawAmount > availableBalance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Create withdrawal request (pending admin approval)
      await storage.createTransaction({
        userId,
        amount: withdrawAmount.toString(),
        type: "withdrawal",
        status: "pending",
        description: `Withdrawal request to ${bankName}`,
        bankName,
        accountNumber,
        accountName
      });

      res.json({ 
        success: true, 
        message: "Withdrawal request submitted. Awaiting admin approval.",
        amount: withdrawAmount.toFixed(2)
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ error: "Withdrawal failed" });
    }
  });

  // Offer routes
  app.get("/api/offers", async (req, res) => {
    try {
      const offers = await storage.getOffers();

      // Enrich offers with user data
      const enrichedOffers = await Promise.all(
        offers.map(async (offer) => {
          const user = await storage.getUser(offer.userId);
          return {
            ...offer,
            user: user ? {
              id: user.id,
              email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
              averageRating: user.averageRating,
              ratingCount: user.ratingCount,
            } : null,
          };
        })
      );

      res.json(enrichedOffers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.post("/api/offers", authenticateToken, async (req, res) => {
    try {
      console.log("Creating offer with data:", req.body);
      console.log("User ID:", req.user!.id);

      const user = req.user!;
      const { type, amount, rate, paymentMethod, terms, minAmount, maxAmount, timeLimit } = req.body;

      // Validate required fields
      if (!type || !amount || !rate) {
        return res.status(400).json({ error: "Missing required fields: type, amount, rate" });
      }

      // Default payment method if not provided
      const finalPaymentMethod = paymentMethod || "bank_transfer";

      // For sell offers, check USDT balance
      if (type === "sell") {
        const userBalance = parseFloat(user.usdtBalance || "0");
        const offerAmount = parseFloat(amount);
        
        if (userBalance < offerAmount) {
          return res.status(400).json({ error: "Insufficient USDT balance" });
        }
      }

      const offerData = {
        userId: user.id,
        type,
        amount: parseFloat(amount).toFixed(8),
        rate: parseFloat(rate).toFixed(2),
        paymentMethod: finalPaymentMethod,
        terms: terms || "",
        minAmount: minAmount ? parseFloat(minAmount).toFixed(8) : parseFloat(amount).toFixed(8),
        maxAmount: maxAmount ? parseFloat(maxAmount).toFixed(8) : parseFloat(amount).toFixed(8),
        status: "active"
      };

      console.log("Parsed offer data:", offerData);

      const offer = await storage.createOffer(offerData);
      console.log("Created offer:", offer);
      
      res.status(201).json({ success: true, offer });
    } catch (error) {
      console.error("Offer creation error:", error);
      res.status(400).json({ error: "Invalid offer data", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Trade routes
  app.get("/api/trades", authenticateToken, async (req, res) => {
    try {
      const trades = await storage.getUserTrades(req.user!.id);

      // Enrich trades with offer and user data
      const enrichedTrades = await Promise.all(
        trades.map(async (trade) => {
          const offer = await storage.getOffer(trade.offerId);
          const buyer = await storage.getUser(trade.buyerId);
          const seller = await storage.getUser(trade.sellerId);

          return {
            ...trade,
            offer,
            buyer: buyer ? { id: buyer.id, email: buyer.email } : null,
            seller: seller ? { id: seller.id, email: seller.email } : null,
          };
        })
      );

      res.json(enrichedTrades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  app.post("/api/trades", authenticateToken, async (req, res) => {
    try {
      const { offerId, amount } = req.body;
      const offer = await storage.getOffer(offerId);
      const user = req.user!;

      if (!offer || offer.status !== "active") {
        return res.status(404).json({ error: "Offer not found or inactive" });
      }

      if (offer.userId === user.id) {
        return res.status(400).json({ error: "Cannot trade with your own offer" });
      }

      const tradeAmount = parseFloat(amount);
      const offerAmount = parseFloat(offer.amount);
      
      if (tradeAmount <= 0 || tradeAmount > offerAmount) {
        return res.status(400).json({ error: "Invalid trade amount" });
      }

      // Check user balances for real trades
      if (offer.type === "sell") {
        // User is buying USDT, needs Naira
        const requiredNaira = tradeAmount * parseFloat(offer.rate);
        const userNairaBalance = parseFloat(user.nairaBalance || "0");
        
        if (userNairaBalance < requiredNaira) {
          return res.status(400).json({ error: "Insufficient Naira balance" });
        }
      } else {
        // User is selling USDT, needs USDT
        const userUsdtBalance = parseFloat(user.usdtBalance || "0");
        
        if (userUsdtBalance < tradeAmount) {
          return res.status(400).json({ error: "Insufficient USDT balance" });
        }
      }

      const fiatAmount = (tradeAmount * parseFloat(offer.rate)).toString();
      
      const tradeData = insertTradeSchema.parse({
        offerId: offer.id,
        buyerId: offer.type === "sell" ? user.id : offer.userId,
        sellerId: offer.type === "sell" ? offer.userId : user.id,
        amount: tradeAmount.toString(),
        rate: offer.rate,
        fiatAmount: fiatAmount,
      });

      const trade = await storage.createTrade(tradeData);

      // Lock USDT in escrow for sell offers (seller has USDT, buyer needs to pay)
      if (offer.type === "sell") {
        const seller = await storage.getUser(offer.userId);
        if (seller) {
          // Lock seller's USDT in escrow
          await storage.updateUser(seller.id, {
            usdtBalance: (parseFloat(seller.usdtBalance || "0") - tradeAmount).toString()
          });
        }
      }

      // Set payment deadline (15 minutes from now)
      const paymentDeadline = new Date(Date.now() + 15 * 60 * 1000);
      
      await storage.updateTrade(trade.id, { 
        status: "payment_pending",
        paymentDeadline: paymentDeadline
      });

      // Update offer amount
      const remainingAmount = offerAmount - tradeAmount;
      if (remainingAmount <= 0) {
        await storage.updateOffer(offer.id, { 
          status: "completed",
          amount: "0"
        });
      } else {
        await storage.updateOffer(offer.id, { 
          amount: remainingAmount.toString()
        });
      }

      res.json({ 
        success: true, 
        trade: {
          ...trade,
          paymentDeadline: paymentDeadline
        },
        message: "Trade initiated! Payment must be made within 15 minutes.",
        paymentDeadline: paymentDeadline
      });
    } catch (error) {
      console.error("Trade creation error:", error);
      res.status(400).json({ error: "Trade creation failed", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Payment confirmation endpoints
  app.post("/api/trades/:id/payment-made", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.buyerId !== req.user!.id) {
        return res.status(403).json({ error: "Only the buyer can mark payment as made" });
      }

      if (trade.status !== "payment_pending") {
        return res.status(400).json({ error: "Trade is not in payment pending status" });
      }

      // Check if payment deadline has passed
      if (trade.paymentDeadline && new Date() > new Date(trade.paymentDeadline)) {
        await storage.updateTrade(tradeId, { status: "expired" });
        return res.status(400).json({ error: "Payment deadline has passed" });
      }

      await storage.updateTrade(tradeId, {
        status: "payment_made",
        paymentMadeAt: new Date()
      });

      res.json({ success: true, message: "Payment marked as made. Waiting for seller confirmation." });
    } catch (error) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  app.post("/api/trades/:id/confirm-payment", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "Only the seller can confirm payment received" });
      }

      if (trade.status !== "payment_made") {
        return res.status(400).json({ error: "Payment must be marked as made first" });
      }

      const offer = await storage.getOffer(trade.offerId);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      const tradeAmount = parseFloat(trade.amount);
      const buyer = await storage.getUser(trade.buyerId);
      const seller = await storage.getUser(trade.sellerId);

      if (!buyer || !seller) {
        return res.status(404).json({ error: "User not found" });
      }

      // Complete the trade - release escrow and update balances
      if (offer.type === "sell") {
        // Release USDT to buyer
        await storage.updateUser(buyer.id, {
          usdtBalance: (parseFloat(buyer.usdtBalance || "0") + tradeAmount).toString()
        });
        
        // Give Naira to seller
        const nairaAmount = tradeAmount * parseFloat(trade.rate);
        await storage.updateUser(seller.id, {
          nairaBalance: (parseFloat(seller.nairaBalance || "0") + nairaAmount).toString()
        });
      }

      await storage.updateTrade(tradeId, {
        status: "completed",
        sellerConfirmedAt: new Date()
      });

      // Create transaction records
      await storage.createTransaction({
        userId: buyer.id,
        amount: (tradeAmount * parseFloat(trade.rate)).toString(),
        type: "purchase",
        status: "completed",
        description: `Bought ${tradeAmount} USDT at ₦${trade.rate}/USDT`
      });

      await storage.createTransaction({
        userId: seller.id,
        amount: (tradeAmount * parseFloat(trade.rate)).toString(),
        type: "sale",
        status: "completed",
        description: `Sold ${tradeAmount} USDT at ₦${trade.rate}/USDT`
      });

      res.json({ success: true, message: "Trade completed successfully!" });
    } catch (error) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Offer CRUD Operations
  app.get("/api/users/:userId/offers", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (req.user!.id !== userId && !req.user!.isAdmin) {
        return res.status(403).json({ error: "Can only view your own offers" });
      }

      const offers = await storage.getUserOffers(userId);
      
      // Enrich with user data for consistency
      const enrichedOffers = offers.map(offer => ({
        ...offer,
        user: {
          id: req.user!.id,
          email: req.user!.email,
          averageRating: req.user!.averageRating || "0",
          ratingCount: req.user!.ratingCount || 0
        }
      }));

      res.json(enrichedOffers);
    } catch (error) {
      console.error("Get user offers error:", error);
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.put("/api/offers/:id", authenticateToken, async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const { amount, rate, status } = req.body;
      
      const offer = await storage.getOffer(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      if (offer.userId !== req.user!.id) {
        return res.status(403).json({ error: "Can only edit your own offers" });
      }

      const updates: any = {};
      if (amount !== undefined) updates.amount = amount;
      if (rate !== undefined) updates.rate = rate;
      if (status !== undefined) updates.status = status;

      const updatedOffer = await storage.updateOffer(offerId, updates);
      res.json(updatedOffer);
    } catch (error) {
      console.error("Update offer error:", error);
      res.status(500).json({ error: "Failed to update offer" });
    }
  });

  app.delete("/api/offers/:id", authenticateToken, async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      
      const offer = await storage.getOffer(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      if (offer.userId !== req.user!.id) {
        return res.status(403).json({ error: "Can only delete your own offers" });
      }

      // Check if there are active trades for this offer
      const activeTrades = await storage.getTrades();
      const hasActiveTrades = activeTrades.some(trade => 
        trade.offerId === offerId && 
        !["completed", "cancelled"].includes(trade.status || "")
      );

      if (hasActiveTrades) {
        return res.status(400).json({ error: "Cannot delete offer with active trades" });
      }

      await storage.updateOffer(offerId, { status: "deleted" });
      res.json({ success: true, message: "Offer deleted successfully" });
    } catch (error) {
      console.error("Delete offer error:", error);
      res.status(500).json({ error: "Failed to delete offer" });
    }
  });

  // Enhanced P2P Trading Flow Endpoints
  
  // Mark payment as made (buyer action)
  app.post("/api/trades/:id/mark-paid", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.buyerId !== req.user!.id) {
        return res.status(403).json({ error: "Only the buyer can mark payment as made" });
      }

      if (trade.status !== "payment_pending") {
        return res.status(400).json({ error: "Trade is not in payment pending status" });
      }

      // Check if payment deadline has passed
      if (trade.paymentDeadline && new Date() > new Date(trade.paymentDeadline)) {
        await storage.updateTrade(tradeId, { status: "expired" });
        return res.status(400).json({ error: "Payment deadline has passed" });
      }

      await storage.updateTrade(tradeId, { 
        status: "payment_made",
        paymentMadeAt: new Date()
      });

      // Notify seller
      const seller = await storage.getUser(trade.sellerId);
      if (seller?.email) {
        await emailService.sendTradeNotification(
          seller.email,
          tradeId,
          "Payment has been made by the buyer. Please confirm receipt to complete the trade."
        );
      }

      res.json({ success: true, message: "Payment marked as made" });
    } catch (error) {
      console.error("Mark payment error:", error);
      res.status(500).json({ error: "Failed to mark payment" });
    }
  });

  // Submit payment proof
  app.post("/api/trades/:id/payment-proof", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const { paymentReference, paymentNotes } = req.body;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.buyerId !== req.user!.id) {
        return res.status(403).json({ error: "Only the buyer can submit payment proof" });
      }

      if (!["payment_pending", "payment_made"].includes(trade.status)) {
        return res.status(400).json({ error: "Invalid trade status for payment proof" });
      }

      await storage.updateTrade(tradeId, { 
        paymentReference,
        paymentProof: paymentNotes,
        status: "payment_made",
        paymentMadeAt: new Date()
      });

      // Notify seller
      const seller = await storage.getUser(trade.sellerId);
      if (seller?.email) {
        await emailService.sendTradeNotification(
          seller.email,
          tradeId,
          `Payment proof submitted. Reference: ${paymentReference}`
        );
      }

      res.json({ success: true, message: "Payment proof submitted" });
    } catch (error) {
      console.error("Payment proof error:", error);
      res.status(500).json({ error: "Failed to submit payment proof" });
    }
  });

  // Raise dispute
  app.post("/api/trades/:id/dispute", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const { reason, raisedBy } = req.body;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.buyerId !== req.user!.id && trade.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "Only trade participants can raise disputes" });
      }

      if (["completed", "cancelled", "disputed"].includes(trade.status)) {
        return res.status(400).json({ error: "Cannot dispute this trade" });
      }

      await storage.updateTrade(tradeId, { 
        status: "disputed",
        disputeReason: reason
      });

      // Notify admins
      const adminUsers = await storage.getUserByEmail("admin@digipay.com");
      if (adminUsers?.email) {
        await emailService.sendTradeNotification(
          adminUsers.email,
          tradeId,
          `Dispute raised by ${raisedBy}. Reason: ${reason}`
        );
      }

      res.json({ success: true, message: "Dispute raised successfully" });
    } catch (error) {
      console.error("Dispute error:", error);
      res.status(500).json({ error: "Failed to raise dispute" });
    }
  });

  // Cancel trade (before payment)
  app.post("/api/trades/:id/cancel", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const { reason } = req.body;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.buyerId !== req.user!.id && trade.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "Only trade participants can cancel trades" });
      }

      if (!["pending", "payment_pending"].includes(trade.status)) {
        return res.status(400).json({ error: "Cannot cancel this trade" });
      }

      // Refund any locked amounts
      const offer = await storage.getOffer(trade.offerId);
      if (offer && offer.type === "sell") {
        const seller = await storage.getUser(trade.sellerId);
        if (seller) {
          const tradeAmount = parseFloat(trade.amount);
          await storage.updateUser(seller.id, {
            usdtBalance: (parseFloat(seller.usdtBalance || "0") + tradeAmount).toString()
          });
        }
      }

      await storage.updateTrade(tradeId, { 
        status: "cancelled",
        cancelReason: reason
      });

      // Restore offer amount
      if (offer) {
        const currentAmount = parseFloat(offer.amount || "0");
        const tradeAmount = parseFloat(trade.amount);
        await storage.updateOffer(offer.id, {
          amount: (currentAmount + tradeAmount).toString(),
          status: "active"
        });
      }

      res.json({ success: true, message: "Trade cancelled successfully" });
    } catch (error) {
      console.error("Cancel trade error:", error);
      res.status(500).json({ error: "Failed to cancel trade" });
    }
  });

  // Admin endpoints for transaction approval
  app.get("/api/admin/transactions", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      
      // Enrich with user data
      const enrichedTransactions = await Promise.all(
        allTransactions.map(async (transaction) => {
          const user = await storage.getUser(transaction.userId);
          return {
            ...transaction,
            user: user ? { id: user.id, email: user.email } : null,
          };
        })
      );

      res.json(enrichedTransactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/admin/transactions/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = req.user!.id;

      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ error: "Transaction is not pending" });
      }

      // For withdrawals, deduct from user balance
      if (transaction.type === "withdrawal") {
        const user = await storage.getUser(transaction.userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const availableBalance = parseFloat(user.nairaBalance || "0");
        const withdrawAmount = parseFloat(transaction.amount);

        if (availableBalance < withdrawAmount) {
          return res.status(400).json({ error: "Insufficient user balance" });
        }

        await storage.updateUser(transaction.userId, {
          nairaBalance: (availableBalance - withdrawAmount).toString()
        });
      }

      // For deposits, add to user balance
      if (transaction.type === "deposit") {
        const user = await storage.getUser(transaction.userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const currentBalance = parseFloat(user.nairaBalance || "0");
        const depositAmount = parseFloat(transaction.amount);

        await storage.updateUser(transaction.userId, {
          nairaBalance: (currentBalance + depositAmount).toString()
        });
      }

      await storage.updateTransaction(transactionId, {
        status: "approved",
        adminNotes: notes,
        approvedBy: adminId,
        approvedAt: new Date()
      });

      res.json({ success: true, message: "Transaction approved successfully" });
    } catch (error) {
      console.error("Transaction approval error:", error);
      res.status(500).json({ error: "Failed to approve transaction" });
    }
  });

  app.post("/api/admin/transactions/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = req.user!.id;

      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ error: "Transaction is not pending" });
      }

      await storage.updateTransaction(transactionId, {
        status: "rejected",
        adminNotes: notes,
        approvedBy: adminId,
        approvedAt: new Date()
      });

      res.json({ success: true, message: "Transaction rejected successfully" });
    } catch (error) {
      console.error("Transaction rejection error:", error);
      res.status(500).json({ error: "Failed to reject transaction" });
    }
  });

  // Profile setup endpoint
  app.post("/api/user/profile-setup", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { fullName, location, bio, preferredPaymentMethods, tradingHours } = req.body;

      console.log("Profile setup request:", { fullName, location, bio, preferredPaymentMethods, tradingHours });

      const updates: any = {};
      if (fullName) updates.fullName = fullName;
      if (location) updates.location = location;
      if (bio) updates.bio = bio;
      if (preferredPaymentMethods && Array.isArray(preferredPaymentMethods)) {
        updates.preferredPaymentMethods = JSON.stringify(preferredPaymentMethods);
      }
      if (tradingHours) {
        updates.tradingHours = JSON.stringify(tradingHours);
      }

      const updatedUser = await storage.updateUser(userId, updates);
      console.log("Profile updated successfully:", updatedUser?.id);

      res.json({ success: true, message: "Profile setup completed successfully" });
    } catch (error) {
      console.error("Profile setup error:", error);
      res.status(500).json({ error: "Failed to setup profile" });
    }
  });

  // Enhanced offer creation endpoint
  app.post("/api/offers", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { 
        type, 
        amount, 
        rate, 
        minAmount, 
        maxAmount, 
        paymentMethod, 
        terms, 
        priceMargin, 
        requiresVerification, 
        timeLimit, 
        autoReply, 
        location 
      } = req.body;

      if (!type || !amount || !rate || !paymentMethod) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // For sell offers, check if user has enough USDT balance
      if (type === "sell") {
        const userBalance = parseFloat(user.usdtBalance || "0");
        const offerAmount = parseFloat(amount);
        
        if (userBalance < offerAmount) {
          return res.status(400).json({ error: "Insufficient USDT balance" });
        }
      }

      const offer = await storage.createOffer({
        userId,
        type,
        amount,
        rate,
        paymentMethod,
        terms,
        minAmount: minAmount || amount,
        maxAmount: maxAmount || amount,
        priceMargin: priceMargin || "0",
        requiresVerification: requiresVerification || false,
        timeLimit: parseInt(timeLimit) || 15,
        autoReply,
        location
      });

      res.json({ success: true, offer });
    } catch (error) {
      console.error("Offer creation error:", error);
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  // User profile endpoints
  app.get("/api/users/:id/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUserProfile(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove sensitive information
      const { password, ...publicProfile } = user;
      res.json(publicProfile);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/users/:id/trades", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const trades = await storage.getUserTrades(userId);
      
      // Only return basic trade info for privacy
      const publicTrades = trades.map(trade => ({
        id: trade.id,
        amount: trade.amount,
        rate: trade.rate,
        status: trade.status,
        type: trade.buyerId === userId ? "buy" : "sell",
        createdAt: trade.createdAt,
      }));
      
      res.json(publicTrades);
    } catch (error) {
      console.error("User trades fetch error:", error);
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  app.get("/api/users/:id/ratings", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const ratings = await storage.getUserPublicRatings(userId);
      res.json(ratings);
    } catch (error) {
      console.error("User ratings fetch error:", error);
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });

  // Get specific trade
  app.get("/api/trades/:id", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storage.getTrade(tradeId);

      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      // Check if user is part of this trade
      if (trade.buyerId !== req.user!.id && trade.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Enrich with offer and user data
      const offer = await storage.getOffer(trade.offerId);
      const buyer = await storage.getUser(trade.buyerId);
      const seller = await storage.getUser(trade.sellerId);

      const enrichedTrade = {
        ...trade,
        offer,
        buyer: buyer ? { id: buyer.id, email: buyer.email } : null,
        seller: seller ? { id: seller.id, email: seller.email } : null,
      };

      res.json(enrichedTrade);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trade" });
    }
  });

  // Complete trade
  app.post("/api/trades/:id/complete", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storage.getTrade(tradeId);

      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.status !== "pending") {
        return res.status(400).json({ error: "Trade is not in pending status" });
      }

      // Check if user is part of this trade
      if (trade.buyerId !== req.user!.id && trade.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Update trade status
      const updatedTrade = await storage.updateTrade(tradeId, { status: "completed" });

      // If escrow exists, release funds
      if (trade.escrowAddress) {
        try {
          const buyer = await storage.getUser(trade.buyerId);
          if (buyer?.tronAddress) {
            await tronService.releaseFromEscrow(tradeId);
          }
        } catch (escrowError) {
          console.error("Escrow release failed:", escrowError);
        }
      }

      // Send completion notifications
      const buyer = await storage.getUser(trade.buyerId);
      const seller = await storage.getUser(trade.sellerId);

      if (buyer?.email) {
        await emailService.sendTradeNotification(
          buyer.email,
          trade.id,
          `Trade completed successfully! You received ${trade.amount} USDT.`
        );
      }

      if (seller?.email) {
        await emailService.sendTradeNotification(
          seller.email,
          trade.id,
          `Trade completed successfully! You sold ${trade.amount} USDT.`
        );
      }

      res.json(updatedTrade);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete trade" });
    }
  });

  // Cancel trade
  app.post("/api/trades/:id/cancel", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storage.getTrade(tradeId);

      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.status !== "pending") {
        return res.status(400).json({ error: "Trade is not in pending status" });
      }

      // Check if user is part of this trade
      if (trade.buyerId !== req.user!.id && trade.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Update trade status
      const updatedTrade = await storage.updateTrade(tradeId, { status: "cancelled" });

      // If escrow exists, refund to seller
      if (trade.escrowAddress) {
        try {
          const seller = await storage.getUser(trade.sellerId);
          if (seller?.tronAddress) {
            await tronService.refundFromEscrow(tradeId);
          }
        } catch (escrowError) {
          console.error("Escrow refund failed:", escrowError);
        }
      }

      res.json(updatedTrade);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel trade" });
    }
  });

  app.patch("/api/trades/:id", authenticateToken, async (req, res) => {

    try {
      const tradeId = parseInt(req.params.id);
      const { status } = req.body;
      const trade = await storage.getTrade(tradeId);
      const user = req.user!;

      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      // Check if user is part of the trade or admin
      if (trade.buyerId !== user.id && trade.sellerId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Handle trade completion
      if (status === "completed") {
        // Only seller can mark as completed
        if (trade.sellerId !== user.id && !user.isAdmin) {
          return res.status(403).json({ message: "Only seller can complete trade" });
        }

        // Release funds from escrow for sell trades
        if (trade.escrowAddress) {
          try {
            await tronService.releaseFromEscrow(trade.id);
          } catch (escrowError) {
            console.error("Escrow release failed:", escrowError);
          }
        }

        // Update user balances
        const buyer = await storage.getUser(trade.buyerId);
        const seller = await storage.getUser(trade.sellerId);

        if (buyer && seller) {
          const tradeAmount = parseFloat(trade.amount);
          const totalNaira = tradeAmount * parseFloat(trade.rate);

          // For buy offers, buyer gets USDT, seller gets Naira
          // For sell offers, seller gets Naira, buyer gets USDT
          await storage.updateUser(buyer.id, {
            usdtBalance: (parseFloat(buyer.usdtBalance || "0") + tradeAmount).toString()
          });

          await storage.updateUser(seller.id, {
            nairaBalance: (parseFloat(seller.nairaBalance || "0") + totalNaira).toString()
          });

          // Send completion notifications
          await emailService.sendTradeNotification(
            buyer.email,
            trade.id,
            `Trade completed successfully! You received ${tradeAmount} USDT.`
          );

          await emailService.sendTradeNotification(
            seller.email,
            trade.id,
            `Trade completed successfully! You received ₦${totalNaira.toLocaleString()}.`
          );
        }
      }

      // Handle trade cancellation/refund
      if (status === "cancelled") {
        // Refund escrow if exists
        if (trade.escrowAddress) {
          try {
            await tronService.refundFromEscrow(trade.id);
          } catch (escrowError) {
            console.error("Escrow refund failed:", escrowError);
          }
        }

        const buyer = await storage.getUser(trade.buyerId);
        const seller = await storage.getUser(trade.sellerId);

        if (buyer?.email) {
          await emailService.sendTradeNotification(
            buyer.email,
            trade.id,
            "Trade has been cancelled and funds have been refunded."
          );
        }

        if (seller?.email) {
          await emailService.sendTradeNotification(
            seller.email,
            trade.id,
            "Trade has been cancelled and funds have been refunded."
          );
        }
      }

      const updatedTrade = await storage.updateTrade(tradeId, { status });
      res.json(updatedTrade);
    } catch (error) {
      console.error("Trade update error:", error);
      res.status(400).json({ message: "Failed to update trade" });
    }
  });

  // Message routes
  app.get("/api/trades/:id/messages", authenticateToken, async (req, res) => {

    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storage.getTrade(tradeId);

      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      // Check if user is part of the trade
      if (trade.buyerId !== req.user!.id && trade.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const messages = await storage.getTradeMessages(tradeId);

      // Enrich messages with sender info
      const enrichedMessages = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            sender: sender ? { id: sender.id, email: sender.email } : null,
          };
        })
      );

      res.json(enrichedMessages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/trades/:id/messages", authenticateToken, async (req, res) => {

    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storage.getTrade(tradeId);

      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      // Check if user is part of the trade
      if (trade.buyerId !== req.user!.id && trade.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const messageData = insertMessageSchema.parse({
        tradeId,
        senderId: req.user!.id,
        message: req.body.message,
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", authenticateToken, async (req, res) => {

    try {
      const transactions = await storage.getUserTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions/deposit", authenticateToken, async (req, res) => {

    try {
      const { amount } = req.body;

      if (!amount || amount < 1000) {
        return res.status(400).json({ message: "Minimum deposit is ₦1,000" });
      }

      const transactionData = insertTransactionSchema.parse({
        userId: req.user!.id,
        type: "deposit",
        amount: amount.toString(),
      });

      const transaction = await storage.createTransaction(transactionData);

      // Mock Paystack integration - simulate success after 2 seconds
      setTimeout(async () => {
        await storage.updateTransaction(transaction.id, { status: "completed" });
        const user = await storage.getUser(req.user!.id);
        if (user) {
          const newBalance = parseFloat(user.nairaBalance || "0") + amount;
          await storage.updateUser(req.user!.id, { nairaBalance: newBalance.toString() });
        }
      }, 2000);

      res.status(201).json({ 
        message: "Deposit initiated successfully",
        transaction,
        paystackUrl: `https://checkout.paystack.com/mock-${transaction.id}` // Mock URL
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to initiate deposit" });
    }
  });

  app.post("/api/transactions/withdraw", authenticateToken, async (req, res) => {

    try {
      const { amount, bank, accountNumber } = req.body;
      const user = await storage.getUser(req.user!.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!amount || amount < 1000) {
        return res.status(400).json({ message: "Minimum withdrawal is ₦1,000" });
      }

      if (parseFloat(user.nairaBalance || "0") < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const transactionData = insertTransactionSchema.parse({
        userId: req.user!.id,
        type: "withdrawal",
        amount: amount.toString(),
      });

      const transaction = await storage.createTransaction(transactionData);

      // Deduct from user balance immediately
      const newBalance = parseFloat(user.nairaBalance || "0") - amount;
      await storage.updateUser(req.user!.id, { nairaBalance: newBalance.toString() });

      // Mock withdrawal processing - complete after 5 seconds
      setTimeout(async () => {
        await storage.updateTransaction(transaction.id, { status: "completed" });
      }, 5000);

      res.status(201).json({ 
        message: "Withdrawal request submitted successfully",
        transaction
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to process withdrawal" });
    }
  });

  // Admin routes
  app.get("/api/admin/trades", authenticateToken, requireAdmin, async (req, res) => {

    try {
      const trades = await storage.getTrades();

      // Enrich trades with user data
      const enrichedTrades = await Promise.all(
        trades.map(async (trade) => {
          const buyer = await storage.getUser(trade.buyerId);
          const seller = await storage.getUser(trade.sellerId);
          const offer = await storage.getOffer(trade.offerId);

          return {
            ...trade,
            buyer: buyer ? { id: buyer.id, email: buyer.email } : null,
            seller: seller ? { id: seller.id, email: seller.email } : null,
            offer,
          };
        })
      );

      res.json(enrichedTrades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin trades" });
    }
  });

  app.patch("/api/admin/trades/:id/resolve", authenticateToken, requireAdmin, async (req, res) => {

    try {
      const tradeId = parseInt(req.params.id);
      const { action } = req.body; // 'release' or 'refund'

      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      const newStatus = action === "release" ? "completed" : "cancelled";
      const updatedTrade = await storage.updateTrade(tradeId, { status: newStatus });

      res.json({ 
        message: `Trade ${action}d successfully`,
        trade: updatedTrade
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to resolve trade" });
    }
  });

  // KYC verification endpoint
  app.post("/api/kyc/verify", authenticateToken, async (req, res) => {

    try {
      const { bvn, firstName, lastName, phone } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate required fields
      if (!bvn || !firstName || !lastName) {
        return res.status(400).json({ error: "BVN, first name, and last name are required" });
      }

      const result = await youVerifyService.verifyBVN(bvn, firstName, lastName);

      if (result.success) {
        // Generate TRON wallet if not exists
        let tronAddress = req.user?.tronAddress;
        if (!tronAddress) {
          const wallet = tronService.generateWallet();
          tronAddress = wallet.address;
        }

        await storage.updateUser(userId, { 
          kycVerified: true,
          bvn: bvn,
          phone: phone || req.user?.phone,
          tronAddress: tronAddress
        });

        const user = await storage.getUser(userId);
        if (user?.email) {
          await emailService.sendKYCNotification(user.email, 'approved');

          // Send SMS notification if phone is available
          if (phone) {
            await smsService.sendSMS(phone, `Your KYC verification has been approved. You can now start trading on DigiPay.`);
          }
        }

        res.json({ 
          success: true, 
          message: "KYC verification successful",
          tronAddress: tronAddress
        });
      } else {
        // Send rejection notification
        const user = await storage.getUser(userId);
        if (user?.email) {
          await emailService.sendKYCNotification(user.email, 'rejected');
        }

        res.status(400).json({ error: result.message || "KYC verification failed" });
      }
    } catch (error) {
      console.error("KYC verification error:", error);
      res.status(500).json({ error: "KYC verification failed" });
    }
  });

  // Paystack payment initialization
  app.post("/api/payments/initialize", authenticateToken, async (req, res) => {

    try {
      const { amount } = req.body;
      const user = req.user;

      if (!user?.email) {
        return res.status(401).json({ error: "User email required" });
      }

      // Allow deposits without KYC verification

      const reference = `digipay_${Date.now()}_${user.id}`;
      const result = await paystackService.initializePayment(user.email, amount, reference);

      if (result.success) {
        await storage.createTransaction({
          userId: user.id,
          type: "deposit",
          amount: amount.toString(),
          paystackRef: reference,
        });

        // Send email notification
        await emailService.sendEmail(
          user.email,
          "Deposit Initiated - DigiPay",
          `Your deposit of ₦${amount.toLocaleString()} has been initiated. Reference: ${reference}`
        );

        res.json(result);
      } else {
        res.status(400).json({ error: result.message || "Payment initialization failed" });
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      res.status(500).json({ error: "Payment initialization failed" });
    }
  });

  // Paystack payment verification
  app.post("/api/payments/verify", authenticateToken, async (req, res) => {

    try {
      const { reference } = req.body;
      const result = await paystackService.verifyPayment(reference);

      if (result.success && result.data) {
        const transactions = await storage.getUserTransactions(req.user!.id);
        const pendingTx = transactions.find(tx => tx.paystackRef === reference);

        if (pendingTx) {
          await storage.updateTransaction(pendingTx.id, { status: "completed" });

          const user = await storage.getUser(req.user!.id);
          if (user) {
            const newBalance = parseFloat(user.nairaBalance || "0") + (result.data.amount / 100);
            await storage.updateUser(user.id, { 
              nairaBalance: newBalance.toString() 
            });
          }
        }

        res.json(result);
      } else {
        res.status(400).json({ error: result.message || "Payment verification failed" });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ error: "Payment verification failed" });
    }
  });

  // TRON wallet operations
  app.get("/api/tron/balance", authenticateToken, async (req, res) => {

    try {
      const user = req.user;
      if (!user?.tronAddress) {
        return res.status(400).json({ error: "No TRON address found" });
      }

      const balance = await tronService.getUSDTBalance(user.tronAddress);
      res.json(balance);
    } catch (error) {
      console.error("TRON balance error:", error);
      res.status(500).json({ error: "Failed to get TRON balance" });
    }
  });

  // TRON send USDT
  app.post("/api/tron/send", authenticateToken, async (req, res) => {

    try {
      const { amount, to } = req.body;
      const user = req.user;

      if (!user?.tronAddress) {
        return res.status(400).json({ error: "No TRON address found" });
      }

      // For demo purposes, simulate successful transfer
      const txHash = await tronService.transferUSDT(
        user.tronAddress, // Using address as private key for demo
        to,
        parseFloat(amount)
      );

      if (txHash) {
        res.json({ success: true, txHash });
      } else {
        res.status(400).json({ error: "Transfer failed" });
      }
    } catch (error) {
      console.error("TRON send error:", error);
      res.status(500).json({ error: "Failed to send USDT" });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket for real-time features
  const { setupWebSocket } = await import('./middleware/websocket');
  setupWebSocket(httpServer);

  // Rating routes
  app.get("/api/ratings", async (req, res) => {
    try {
      const ratings = await storage.getAllRatings();

      // Enrich with user data
      const enrichedRatings = await Promise.all(
        ratings.map(async (rating) => {
          const rater = await storage.getUser(rating.raterId);
          const ratedUser = await storage.getUser(rating.ratedUserId);
          const trade = await storage.getTrade(rating.tradeId);

          return {
            ...rating,
            rater: rater ? { id: rater.id, email: rater.email } : null,
            ratedUser: ratedUser ? { id: ratedUser.id, email: ratedUser.email } : null,
            trade,
          };
        })
      );

      res.json(enrichedRatings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });
  app.post("/api/ratings", authenticateToken, async (req, res) => {
    try {
      const { tradeId, rating, comment } = req.body;
      const user = req.user!;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      // Check if trade exists and user is part of it
      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      if (trade.buyerId !== user.id && trade.sellerId !== user.id) {
        return res.status(403).json({ message: "You can only rate users from your own trades" });
      }

      // Check if trade is completed
      if (trade.status !== "completed") {
        return res.status(400).json({ message: "Can only rate completed trades" });
      }

      // Determine who is being rated
      const ratedUserId = trade.buyerId === user.id ? trade.sellerId : trade.buyerId;

      // Check if rating already exists
      const existingRating = await storage.getTradeRating(tradeId, user.id);
      if (existingRating) {
        return res.status(400).json({ message: "You have already rated this trade" });
      }

      const ratingData = insertRatingSchema.parse({
        tradeId,
        raterId: user.id,
        ratedUserId,
        rating,
        comment: comment || null,
      });

      const newRating = await storage.createRating(ratingData);

      // Update user's average rating
      const userRatings = await storage.getUserRatings(ratedUserId);
      const totalRatings = userRatings.length;
      const averageRating = userRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

      await storage.updateUser(ratedUserId, {
        averageRating: averageRating.toFixed(2),
        ratingCount: totalRatings,
      });

      // Send notification to rated user
      const ratedUser = await storage.getUser(ratedUserId);
      if (ratedUser?.email) {
        await emailService.sendEmail(
          ratedUser.email,
          "New Rating Received - DigiPay",
          `You received a ${rating}-star rating for your recent trade. ${comment ? `Comment: "${comment}"` : ''}`
        );
      }

      res.status(201).json(newRating);
    } catch (error) {
      console.error("Rating creation error:", error);
      res.status(400).json({ message: "Failed to create rating" });
    }
  });

  // Get user ratings
  app.get("/api/users/:id/ratings", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const ratings = await storage.getUserRatings(userId);

      // Enrich ratings with rater info
      const enrichedRatings = await Promise.all(
        ratings.map(async (rating) => {
          const rater = await storage.getUser(rating.raterId);
          return {
            ...rating,
            rater: rater ? { 
              id: rater.id, 
              email: rater.email.replace(/(.{2}).*(@.*)/, '$1***$2') // Mask email
            } : null,
          };
        })
      );

      res.json(enrichedRatings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Withdrawal requests with bank details
  app.post("/api/payments/withdraw", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { amount, bankCode, accountNumber, accountName } = req.body;
      const user = req.user!;

      if (!user.kycVerified) {
        return res.status(400).json({ 
          message: "KYC verification required for withdrawals",
          requiresKyc: true
        });
      }

      if (!amount || amount < 1000) {
        return res.status(400).json({ message: "Minimum withdrawal is ₦1,000" });
      }

      if (parseFloat(user.nairaBalance || "0") < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      if (!bankCode || !accountNumber || !accountName) {
        return res.status(400).json({ message: "Bank details are required" });
      }

      // Create withdrawal transaction
      const transactionData = insertTransactionSchema.parse({
        userId: user.id,
        type: "withdrawal",
        amount: amount.toString(),
      });

      const transaction = await storage.createTransaction(transactionData);

      // Deduct from user balance immediately
      const newBalance = parseFloat(user.nairaBalance || "0") - amount;
      await storage.updateUser(user.id, { nairaBalance: newBalance.toString() });

      // Initiate Paystack transfer
      try {
        const transferResult = await paystackService.initiateTransfer(
          amount,
          accountNumber,
          bankCode,
          accountName,
          `Withdrawal for ${user.email}`
        );

        if (transferResult.success) {
          await storage.updateTransaction(transaction.id, { 
            status: "completed",
            paystackRef: transferResult.data?.transfer_code
          });

          // Send success notification
          await emailService.sendEmail(
            user.email,
            "Withdrawal Successful - DigiPay",
            `Your withdrawal of ₦${amount.toLocaleString()} has been processed successfully.`
          );

          if (user.phone) {
            await smsService.sendSMS(
              user.phone,
              `DigiPay: Your withdrawal of ₦${amount.toLocaleString()} has been processed.`
            );
          }
        } else {
          // Refund user balance if transfer fails
          await storage.updateUser(user.id, { 
            nairaBalance: (parseFloat(user.nairaBalance || "0") + amount).toString() 
          });
          await storage.updateTransaction(transaction.id, { status: "failed" });

          return res.status(400).json({ error: transferResult.message || "Withdrawal failed" });
        }
      } catch (transferError) {
        console.error("Transfer error:", transferError);
        // Refund user balance
        await storage.updateUser(user.id, { 
          nairaBalance: (parseFloat(user.nairaBalance || "0") + amount).toString() 
        });
        await storage.updateTransaction(transaction.id, { status: "failed" });

        return res.status(500).json({ error: "Withdrawal processing failed" });
      }

      res.status(201).json({ 
        message: "Withdrawal processed successfully",
        transaction
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      res.status(400).json({ message: "Failed to process withdrawal" });
    }
  });

  // Admin stats endpoint
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const [trades, users, transactions] = await Promise.all([
        storage.getTrades(),
        storage.getUser(1), // Get first user for demo
        storage.getUserTransactions(req.user!.id)
      ]);

      const stats = {
        totalTrades: trades.length,
        completedTrades: trades.filter(t => t.status === "completed").length,
        pendingTrades: trades.filter(t => t.status === "pending").length,
        disputedTrades: trades.filter(t => t.status === "disputed").length,
        totalVolume: trades
          .filter(t => t.status === "completed")
          .reduce((sum, t) => sum + (parseFloat(t.amount) * parseFloat(t.rate)), 0),
        totalUsers: 1, // Demo value
        kycVerifiedUsers: 1, // Demo value
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  return httpServer;
}