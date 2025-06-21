import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertOfferSchema, insertTradeSchema, insertMessageSchema, insertTransactionSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
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
          const newBalance = parseFloat(user.nairaBalance) + amount;
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
      
      if (parseFloat(user.nairaBalance) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const transactionData = insertTransactionSchema.parse({
        userId: req.user!.id,
        type: "withdrawal",
        amount: amount.toString(),
      });
      
      const transaction = await storage.createTransaction(transactionData);
      
      // Deduct from user balance immediately
      const newBalance = parseFloat(user.nairaBalance) - amount;
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

  const httpServer = createServer(app);
  return httpServer;
}
