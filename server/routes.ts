Analysis: The goal is to integrate KYC verification, wallet generation upon user registration, and additional API routes related to offers, trades, and payments into the existing Express application. These changes involve modifying the user registration process, adding a KYC verification endpoint, and mounting new routers for offers, trades, and payments.
```
```replit_final_file
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertOfferSchema, insertTradeSchema, insertMessageSchema, insertTransactionSchema, insertRatingSchema } from "@shared/schema";
import { youVerifyService } from "./services/youverify";
import { paystackService } from "./services/paystack";
import { tronService } from "./services/tron";
import { emailService, smsService } from "./services/notifications";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

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
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.post("/api/offers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const offerData = insertOfferSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const offer = await storage.createOffer(offerData);
      res.status(201).json(offer);
    } catch (error) {
      res.status(400).json({ message: "Invalid offer data" });
    }
  });

  // Trade routes
  app.get("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  app.post("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { offerId, amount } = req.body;
      const offer = await storage.getOffer(offerId);

      if (!offer || offer.status !== "active") {
        return res.status(404).json({ message: "Offer not found or inactive" });
      }

      if (offer.userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot trade with your own offer" });
      }

      const tradeData = insertTradeSchema.parse({
        offerId: offer.id,
        buyerId: offer.type === "sell" ? req.user!.id : offer.userId,
        sellerId: offer.type === "sell" ? offer.userId : req.user!.id,
        amount,
        rate: offer.rate,
      });

      const trade = await storage.createTrade(tradeData);
      res.status(201).json(trade);
    } catch (error) {
      res.status(400).json({ message: "Failed to create trade" });
    }
  });

  app.patch("/api/trades/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storage.getTrade(tradeId);

      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      // Check if user is part of the trade or admin
      if (trade.buyerId !== req.user!.id && trade.sellerId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedTrade = await storage.updateTrade(tradeId, req.body);
      res.json(updatedTrade);
    } catch (error) {
      res.status(400).json({ message: "Failed to update trade" });
    }
  });

  // Message routes
  app.get("/api/trades/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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

  app.post("/api/trades/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const transactions = await storage.getUserTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions/deposit", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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

  app.post("/api/transactions/withdraw", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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
  app.get("/api/admin/trades", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

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

  app.patch("/api/admin/trades/:id/resolve", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

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
  app.post("/api/kyc/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { bvn, firstName, lastName } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await youVerifyService.verifyBVN(bvn, firstName, lastName);

      if (result.success) {
        await storage.updateUser(userId, { 
          kycVerified: true,
          bvn: bvn 
        });

        const user = await storage.getUser(userId);
        if (user?.email) {
          await emailService.sendKYCNotification(user.email, 'approved');
        }

        res.json({ success: true, message: "KYC verification successful" });
      } else {
        res.status(400).json({ error: result.message || "KYC verification failed" });
      }
    } catch (error) {
      console.error("KYC verification error:", error);
      res.status(500).json({ error: "KYC verification failed" });
    }
  });

  // Paystack payment initialization
  app.post("/api/payments/initialize", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { amount } = req.body;
      const user = req.user;

      if (!user?.email) {
        return res.status(401).json({ error: "User email required" });
      }

      const reference = `digipay_${Date.now()}_${user.id}`;
      const result = await paystackService.initializePayment(user.email, amount, reference);

      if (result.success) {
        await storage.createTransaction({
          userId: user.id,
          type: "deposit",
          amount: amount.toString(),
          paystackRef: reference,
        });

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
  app.post("/api/payments/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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
  app.get("/api/tron/balance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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
  app.post("/api/tron/send", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

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

  return httpServer;
}
import { Router } from "express";
import { z } from "zod";
import { db, users, transactions } from "./db";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcrypt";
import { requireAuth } from "./auth";
import { kycService } from "./services/kyc";
import { walletService } from "./services/wallet";
import offersRouter from "./routes/offers";
import tradesRouter from "./routes/trades";
import paymentsRouter from "./routes/payments";

export const router = Router();
// Register route
router.post("/register", async (req, res) => {
  try {
    const { email, password, bvn, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Generate TRON wallet
    const wallet = walletService.generateWallet();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        bvn: bvn || null,
        phone: phone || null,
        tronAddress: wallet.address,
      })
      .returning();

    res.status(201).json({
      message: "User created successfully",
      user: { 
        id: newUser[0].id, 
        email: newUser[0].email,
        tronAddress: newUser[0].tronAddress
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});
// Get current user
router.get("/user", requireAuth, async (req, res) => {
  try {
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        bvn: users.bvn,
        tronAddress: users.tronAddress,
        phone: users.phone,
        kycVerified: users.kycVerified,
        nairaBalance: users.nairaBalance,
        usdtBalance: users.usdtBalance,
        averageRating: users.averageRating,
        ratingCount: users.ratingCount,
      })
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// KYC verification
router.post("/verify-kyc", requireAuth, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const userId = req.user!.id;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user[0].bvn) {
      return res.status(400).json({ error: "BVN is required for verification" });
    }

    if (user[0].kycVerified) {
      return res.status(400).json({ error: "User already verified" });
    }

    const verification = await kycService.verifyBVN(
      user[0].bvn,
      firstName,
      lastName
    );

    if (verification.verified) {
      await db
        .update(users)
        .set({ kycVerified: true })
        .where(eq(users.id, userId));

      res.json({ message: "KYC verification successful" });
    } else {
      res.status(400).json({ error: "KYC verification failed" });
    }
  } catch (error) {
    console.error("KYC verification error:", error);
    res.status(500).json({ error: "Failed to verify KYC" });
  }
});

// Mount sub-routers
router.use("/offers", offersRouter);
router.use("/trades", tradesRouter);
router.use("/payments", paymentsRouter);