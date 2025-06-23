import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { setupJWTAuth, authenticateToken, requireKYC, requireAdmin } from "./auth-jwt";
import { storage } from "./storage";
import { insertOfferSchema, insertTradeSchema, insertMessageSchema, insertTransactionSchema, insertRatingSchema } from "@shared/schema";
import { youVerifyService } from "./services/youverify";
import { enhancedPaystackService } from "./services/enhanced-paystack.js";
import { tronService } from "./services/tron";
import { emailService, smsService } from "./services/notifications";
import { kycRoutes } from "./routes/kyc.js";
import { registerPaymentRoutes } from "./routes/payments.js";
import { registerTestPaymentRoutes } from "./routes/test-payments.js";
import * as crypto from "crypto";
import { db, pool } from "./db";
import { eq, desc, or, and, asc, gte } from "drizzle-orm";
import { 
  users, offers, trades, messages, transactions, ratings,
  type User, type InsertUser, type Offer, type InsertOffer,
  type Trade, type InsertTrade, type Message, type InsertMessage,
  type Transaction, type InsertTransaction, type Rating, type InsertRating
} from "@shared/schema";
import { messages as messagesTable } from "@shared/schema";

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

    // Get specific user by ID
  app.get("/api/users/:userId", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }



      // Calculate completed trades
      const trades = await storage.getTrades();
      const userTrades = trades.filter(t => 
        (t.buyerId === userId || t.sellerId === userId) && t.status === 'completed'
      );

      // Return public profile info including wallet balances for admin view
      const publicProfile = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        location: user.location,
        kycVerified: user.kycVerified,
        averageRating: user.averageRating,
        ratingCount: user.ratingCount,
        completedTrades: userTrades.length,
        isOnline: user.isOnline || false,
        lastSeen: user.lastSeen || user.createdAt,
        createdAt: user.createdAt,
        nairaBalance: user.nairaBalance || "0",
        usdtBalance: user.usdtBalance || "0"
      };

      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
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

      // Check if user's funds are frozen
      if (user.fundsFrozen) {
        return res.status(403).json({ 
          error: "Your funds have been frozen. Withdrawals are not allowed.",
          reason: user.freezeReason || "Account under review"
        });
      }

      // Check if user is banned
      if (user.isBanned) {
        return res.status(403).json({ 
          error: "Your account has been suspended. Please contact support.",
          reason: user.banReason || "Account suspended"
        });
      }

      const availableBalance = parseFloat(user.nairaBalance || "0");
      if (withdrawAmount > availableBalance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Deduct from user balance immediately
      const newBalance = availableBalance - withdrawAmount;
      await storage.updateUser(userId, {
        nairaBalance: newBalance.toString()
      });

      // Create withdrawal request (pending admin approval)
      await storage.createTransaction({
        userId,
        amount: withdrawAmount.toString(),
        type: "withdrawal",
        status: "pending",
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

  // Paystack webhook for automatic transaction processing
  app.post("/api/paystack/webhook", express.raw({type: 'application/json'}), async (req, res) => {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      
      if (!signature) {
        console.warn('Webhook received without signature');
        return res.status(400).send('Missing signature');
      }

      // Parse the raw body
      const payload = JSON.parse(req.body.toString());
      
      await enhancedPaystackService.handleWebhook(payload, signature);
      
      console.log('Webhook processed successfully:', payload.event);
      res.status(200).send('OK');
      
    } catch (error: any) {
      console.error('Webhook processing error:', error.message);
      res.status(400).send(error.message || 'Webhook processing failed');
    }
  });

  // Check username availability
  app.get("/api/user/check-username/:username", authenticateToken, async (req: any, res: Response) => {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.id;

      if (!username || username.length < 3) {
        return res.json({ available: false, message: "Username must be at least 3 characters long" });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.json({ available: false, message: "Username can only contain letters, numbers, and underscores" });
      }

      const existingUser = await storage.getUserByUsername(username);

      if (existingUser && existingUser.id !== currentUserId) {
        // Generate suggestions
        const suggestions = [];
        for (let i = 1; i <= 3; i++) {
          const suggestion = `${username}${i}`;
          const suggestionExists = await storage.getUserByUsername(suggestion);
          if (!suggestionExists) {
            suggestions.push(suggestion);
          }
        }

        // Try with random numbers
        if (suggestions.length < 3) {
          for (let i = 0; i < 5; i++) {
            const randomNum = Math.floor(Math.random() * 999) + 1;
            const suggestion = `${username}${randomNum}`;
            const suggestionExists = await storage.getUserByUsername(suggestion);
            if (!suggestionExists && !suggestions.includes(suggestion)) {
              suggestions.push(suggestion);
              if (suggestions.length >= 3) break;
            }
          }
        }

        return res.json({ 
          available: false, 
          message: "Username is already taken",
          suggestions: suggestions.slice(0, 3)
        });
      }

      res.json({ available: true, message: "Username is available" });
    } catch (error) {
      console.error("Check username error:", error);
      res.status(500).json({ error: "Failed to check username availability" });
    }
  });

  // KYC verification routes
  app.get("/api/kyc", authenticateToken, kycRoutes.getKYCData);
  app.post("/api/kyc/submit", authenticateToken, kycRoutes.submitKYC);
  app.post("/api/kyc/upload", authenticateToken, ...kycRoutes.uploadDocuments);
  app.get("/api/admin/kyc/pending", authenticateToken, kycRoutes.getPendingVerifications);
  app.post("/api/admin/kyc/:userId/review", authenticateToken, kycRoutes.reviewKYC);

  // Featured offers endpoint
  app.get("/api/offers/featured", async (req, res) => {
    try {
      const featuredOffers = await storage.getFeaturedOffers();

      // Enrich offers with user data
      const enrichFeaturedOffers = async (offers: any[]) => {
        return await Promise.all(
          offers.map(async (offer) => {
            const user = await storage.getUser(offer.userId);
            return {
              ...offer,
              user: user ? {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                averageRating: user.averageRating || "0.00",
                ratingCount: user.ratingCount || 0,
                kycVerified: user.kycVerified || false,
                isOnline: user.isOnline || false,
                lastSeen: user.lastSeen || user.createdAt
              } : null,
            };
          })
        );
      };

      const enrichedBuyOffers = await enrichFeaturedOffers(featuredOffers.buyOffers);
      const enrichedSellOffers = await enrichFeaturedOffers(featuredOffers.sellOffers);

      res.json({
        buyOffers: enrichedBuyOffers,
        sellOffers: enrichedSellOffers
      });
    } catch (error) {
      console.error("Featured offers fetch error:", error);
      res.status(500).json({ error: "Failed to fetch featured offers" });
    }
  });

  // Market stats endpoint
  app.get("/api/market/stats", async (req, res) => {
    try {
      const offers = await storage.getOffers();
      const trades = await storage.getTrades();

      const activeOffers = offers.filter(o => o.status === 'active');
      const buyOffers = activeOffers.filter(o => o.type === 'buy');
      const sellOffers = activeOffers.filter(o => o.type === 'sell');

      const completedTrades = trades.filter(t => t.status === 'completed');
      const totalVolume = completedTrades.reduce((sum, trade) => {
        return sum + (parseFloat(trade.amount) * parseFloat(trade.rate));
      }, 0);

      const last24hTrades = completedTrades.filter(trade => {
        const tradeDate = new Date(trade.createdAt);
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return tradeDate > yesterday;
      });

      // For buy rate: users want to buy USDT, so look at sell offers (lowest rate is best for buyers)
      // For sell rate: users want to sell USDT, so look at buy offers (highest rate is best for sellers)
      const sellOfferRates = sellOffers.map(o => parseFloat(o.rate)).filter(rate => !isNaN(rate) && rate > 0);
      const buyOfferRates = buyOffers.map(o => parseFloat(o.rate)).filter(rate => !isNaN(rate) && rate > 0);

      const stats = {
        totalOffers: activeOffers.length,
        buyOffers: sellOffers.length, // Count of sell offers available for buying
        sellOffers: buyOffers.length, // Count of buy offers available for selling
        bestBuyRate: sellOfferRates.length ? Math.min(...sellOfferRates) : null,
        bestSellRate: buyOfferRates.length ? Math.max(...buyOfferRates) : null,
        totalVolume: totalVolume,
        last24hVolume: last24hTrades.reduce((sum, trade) => {
          return sum + (parseFloat(trade.amount) * parseFloat(trade.rate));
        }, 0),
        activeTraders: new Set(activeOffers.map(o => o.userId)).size,
        completedTrades: completedTrades.length,
        last24hTrades: last24hTrades.length
      };

      res.json(stats);
    } catch (error) {
      console.error("Market stats error:", error);
      res.status(500).json({ error: "Failed to fetch market stats" });
    }
  });

  // Admin dashboard stats endpoint
  app.get("/api/admin/stats", authenticateToken, async (req, res) => {
    try {
      // Get all users count
      const allUsers = await db.select().from(users);
      const totalUsers = allUsers.length;

      // Get active trades
      const allTrades = await storage.getTrades();
      const activeTrades = allTrades.filter(trade => trade.status === 'pending');
      const disputedTrades = allTrades.filter(trade => trade.status === 'disputed');

      // Calculate total escrow volume (sum of active trades)
      const escrowVolume = activeTrades.reduce((sum, trade) => {
        return sum + parseFloat(trade.amount || "0");
      }, 0);

      const stats = {
        totalUsers,
        activeTrades: activeTrades.length,
        disputedTrades: disputedTrades.length,
        escrowVolume: escrowVolume.toFixed(2)
      };

      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Featured users endpoint - Smart selection with fallback criteria
  app.get("/api/admin/featured-users", authenticateToken, async (req, res) => {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // First, check for manually featured users (admin-selected)
      const manuallyFeatured = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          averageRating: users.averageRating,
          ratingCount: users.ratingCount,
          kycVerified: users.kycVerified,
          nairaBalance: users.nairaBalance,
          usdtBalance: users.usdtBalance,
          featuredPriority: users.featuredPriority
        })
        .from(users)
        .where(eq(users.isFeatured, true))
        .orderBy(desc(users.featuredPriority || 0));

      // Get weekly trading volume for all users
      const weeklyTrades = await db
        .select({
          sellerId: trades.sellerId,
          amount: trades.amount,
          sellerEmail: users.email,
          sellerFirstName: users.firstName,
          sellerLastName: users.lastName,
          sellerUsername: users.username,
          sellerAverageRating: users.averageRating,
          sellerRatingCount: users.ratingCount,
          sellerKycVerified: users.kycVerified,
          sellerNairaBalance: users.nairaBalance,
          sellerUsdtBalance: users.usdtBalance
        })
        .from(trades)
        .innerJoin(users, eq(trades.sellerId, users.id))
        .where(
          and(
            eq(trades.status, 'completed'),
            gte(trades.createdAt, oneWeekAgo)
          )
        );

      // Group traders by volume
      const sellerVolumes = new Map<number, {
        sellerId: number;
        totalVolume: number;
        tradeCount: number;
        user: {
          email: string;
          firstName?: string;
          lastName?: string;
          username?: string;
          averageRating: string;
          ratingCount: number;
          kycVerified: boolean;
          nairaBalance: string;
          usdtBalance: string;
        };
      }>();

      weeklyTrades.forEach(trade => {
        const sellerId = trade.sellerId;
        const amount = parseFloat(trade.amount || "0");
        
        if (sellerVolumes.has(sellerId)) {
          const existing = sellerVolumes.get(sellerId)!;
          existing.totalVolume += amount;
          existing.tradeCount += 1;
        } else {
          sellerVolumes.set(sellerId, {
            sellerId,
            totalVolume: amount,
            tradeCount: 1,
            user: {
              email: trade.sellerEmail,
              firstName: trade.sellerFirstName || undefined,
              lastName: trade.sellerLastName || undefined,
              username: trade.sellerUsername || undefined,
              averageRating: trade.sellerAverageRating || "0.00",
              ratingCount: trade.sellerRatingCount || 0,
              kycVerified: trade.sellerKycVerified || false,
              nairaBalance: trade.sellerNairaBalance || "0",
              usdtBalance: trade.sellerUsdtBalance || "0"
            }
          });
        }
      });

      // Convert manually featured users to expected format
      const manuallyFeaturedUsers = manuallyFeatured.map(user => ({
        sellerId: user.id,
        totalVolume: 0, // Will be marked as admin-selected
        tradeCount: 0,
        isManuallyFeatured: true,
        featuredPriority: user.featuredPriority || 0,
        user: {
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          username: user.username || undefined,
          averageRating: user.averageRating || "0.00",
          ratingCount: user.ratingCount || 0,
          kycVerified: user.kycVerified || false,
          nairaBalance: user.nairaBalance || "0",
          usdtBalance: user.usdtBalance || "0"
        }
      }));

      // Get top traders by volume (excluding manually featured ones)
      const manuallyFeaturedIds = new Set(manuallyFeatured.map(u => u.id));
      const topTraders = Array.from(sellerVolumes.values())
        .filter(seller => !manuallyFeaturedIds.has(seller.sellerId))
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .map(seller => ({
          ...seller,
          totalVolume: parseFloat(seller.totalVolume.toFixed(2)),
          isManuallyFeatured: false,
          featuredPriority: 0
        }));

      // If we don't have enough traders with volume, get users with highest portfolio value
      let needMoreUsers = 6 - manuallyFeaturedUsers.length - topTraders.length;
      let portfolioUsers: any[] = [];

      if (needMoreUsers > 0) {
        const excludeIds = new Set([
          ...manuallyFeaturedIds,
          ...topTraders.map(t => t.sellerId)
        ]);

        const usersWithPortfolio = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username,
            averageRating: users.averageRating,
            ratingCount: users.ratingCount,
            kycVerified: users.kycVerified,
            nairaBalance: users.nairaBalance,
            usdtBalance: users.usdtBalance
          })
          .from(users)
          .where(eq(users.isBanned, false));

        portfolioUsers = usersWithPortfolio
          .filter(user => !excludeIds.has(user.id))
          .map(user => {
            const nairaValue = parseFloat(user.nairaBalance || "0");
            const usdtValue = parseFloat(user.usdtBalance || "0") * 1600; // Approximate NGN rate
            const totalPortfolioValue = nairaValue + usdtValue;
            
            return {
              sellerId: user.id,
              totalVolume: 0,
              tradeCount: 0,
              portfolioValue: totalPortfolioValue,
              isManuallyFeatured: false,
              isPortfolioBased: true,
              featuredPriority: 0,
              user: {
                email: user.email,
                firstName: user.firstName || undefined,
                lastName: user.lastName || undefined,
                username: user.username || undefined,
                averageRating: user.averageRating || "0.00",
                ratingCount: user.ratingCount || 0,
                kycVerified: user.kycVerified || false,
                nairaBalance: user.nairaBalance || "0",
                usdtBalance: user.usdtBalance || "0"
              }
            };
          })
          .sort((a, b) => b.portfolioValue - a.portfolioValue)
          .slice(0, needMoreUsers);
      }

      // Combine all featured users with priority order
      const allFeaturedUsers = [
        ...manuallyFeaturedUsers.sort((a, b) => b.featuredPriority - a.featuredPriority),
        ...topTraders,
        ...portfolioUsers
      ].slice(0, 6);

      res.json(allFeaturedUsers);
    } catch (error) {
      console.error("Featured users error:", error);
      res.status(500).json({ error: "Failed to fetch featured users" });
    }
  });

  // Admin endpoint to manually feature/unfeature users
  app.post("/api/admin/users/:userId/feature", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { featured, priority = 0 } = req.body;

      await db
        .update(users)
        .set({ 
          isFeatured: featured,
          featuredPriority: featured ? priority : null 
        })
        .where(eq(users.id, userId));

      res.json({ success: true, message: `User ${featured ? 'featured' : 'unfeatured'} successfully` });
    } catch (error) {
      console.error("Feature user error:", error);
      res.status(500).json({ error: "Failed to update user feature status" });
    }
  });

  // Get individual offer by ID
  app.get("/api/offers/:id", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const offer = await storage.getOffer(offerId);

      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Enrich with user data
      const user = await storage.getUser(offer.userId);
      const enrichedOffer = {
        ...offer,
        user: user ? {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          averageRating: user.averageRating || "0.00",
          ratingCount: user.ratingCount || 0,
          kycVerified: user.kycVerified || false,
          isOnline: user.isOnline || false,
          lastSeen: user.lastSeen || user.createdAt
        } : null,
      };

      res.json(enrichedOffer);
    } catch (error) {
      console.error("Get offer error:", error);
      res.status(500).json({ error: "Failed to fetch offer" });
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

          // Determine online status consistently
          const isOnline = user?.isOnline || false;
          const lastSeen = user?.lastSeen || user?.createdAt;

          return {
            ...offer,
            user: user ? {
              id: user.id,
              email: user.email,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              averageRating: user.averageRating || "0.00",
              ratingCount: user.ratingCount || 0,
              kycVerified: user.kycVerified || false,
              completedTrades: user.completedTrades || 0,
              isOnline: isOnline,
              lastSeen: lastSeen
            } : null,
          };
        })
      );

      res.json(enrichedOffers);
    } catch (error) {
      console.error("Offers fetch error:", error);
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  // Get individual offer by ID
  app.get("/api/offers/:id", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const offer = await storage.getOffer(offerId);

      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Enrich offer with user data
      const user = await storage.getUser(offer.userId);
      const enrichedOffer = {
        ...offer,
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          averageRating: user.averageRating || "0.00",
          ratingCount: user.ratingCount || 0,
          kycVerified: user.kycVerified || false,
          completedTrades: user.completedTrades || 0,
          isOnline: user.isOnline || false,
          lastSeen: user.lastSeen || user.createdAt
        } : null,
      };

      res.json(enrichedOffer);
    } catch (error) {
      console.error("Offer fetch error:", error);
      res.status(500).json({ error: "Failed to fetch offer" });
    }
  });

  app.post("/api/offers", authenticateToken, async (req, res) => {
    try {
      console.log("Creating offer with data:", req.body);
      console.log("User ID:", req.user!.id);

      const user = req.user!;
      const { type, amount, rate, paymentMethod, terms, minAmount, maxAmount, timeLimit } = req.body;

      // Check if user's funds are frozen
      if (user.fundsFrozen) {
        return res.status(403).json({ 
          error: "Your funds have been frozen. You cannot create offers.",
          reason: user.freezeReason || "Account under review"
        });
      }

      // Check if user is banned
      if (user.isBanned) {
        return res.status(403).json({ 
          error: "Your account has been suspended. Please contact support.",
          reason: user.banReason || "Account suspended"
        });
      }

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
  app.get("/api/trades/:id", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const user = req.user!;

      const trade = await storage.getTradeById(tradeId);

      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      // Check if user is part of this trade
      if (trade.buyerId !== user.id && trade.sellerId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get trade with full details
      const tradeWithDetails = await storage.getTradeWithDetails(tradeId);

      res.json(tradeWithDetails);
    } catch (error) {
      console.error("Error fetching trade:", error);
      res.status(500).json({ error: "Failed to fetch trade" });
    }
  });

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

      console.log("Trade creation request:", { offerId, amount, userId: req.user!.id });

      const offer = await storage.getOffer(offerId);
      const user = req.user!;

      // Check if user's funds are frozen
      if (user.fundsFrozen) {
        return res.status(403).json({ 
          error: "Your funds have been frozen. You cannot initiate trades.",
          reason: user.freezeReason || "Account under review"
        });
      }

      // Check if user is banned
      if (user.isBanned) {
        return res.status(403).json({ 
          error: "Your account has been suspended. Please contact support.",
          reason: user.banReason || "Account suspended"
        });
      }

      if (!offer || offer.status !== "active") {
        console.log("Offer not found or inactive:", { offerId, offer });
        return res.status(404).json({ error: "Offer not found or inactive" });
      }

      if (offer.userId === user.id) {
        return res.status(400).json({ error: "Cannot trade with your own offer" });
      }

      const tradeAmount = parseFloat(amount);

      if (isNaN(tradeAmount) || tradeAmount <= 0) {
        return res.status(400).json({ error: "Invalid trade amount" });
      }

      const offerAmount = parseFloat(offer.amount);
      const minAmount = parseFloat(offer.minAmount || offer.amount);
      const maxAmount = parseFloat(offer.maxAmount || offer.amount);

      if (isNaN(offerAmount) || isNaN(minAmount) || isNaN(maxAmount)) {
        return res.status(400).json({ message: "Invalid offer amounts" });
      }

      if (tradeAmount < minAmount || tradeAmount > maxAmount) {
        return res.status(400).json({ 
          error: `Trade amount must be between ${minAmount} and ${maxAmount} USDT` 
        });
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

      const fiatAmount = tradeAmount * parseFloat(offer.rate);

      const newTrade = await storage.createTrade({
        offerId,
        buyerId: offer.type === "sell" ? user.id : offer.userId,
        sellerId: offer.type === "sell" ? offer.userId : user.id,
        amount: tradeAmount.toString(),
        rate: offer.rate,
        fiatAmount: fiatAmount.toFixed(2),
        status: "payment_pending", // Start directly with payment pending
        paymentDeadline: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        bankName: "First Bank", // Demo bank details
        accountNumber: "1234567890",
        accountName: "John Doe Seller",
      });

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

      await storage.updateTrade(newTrade.id, { 
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
          ...newTrade,
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
        await storage.updateTradeStatus(tradeId, "expired");
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

  // Confirm payment received (seller action)
  app.post("/api/trades/:id/confirm-payment", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const userId = req.user!.id;

      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.sellerId !== userId) {
        return res.status(403).json({ error: "Only seller can confirm payment" });
      }

      if (trade.status !== "payment_made") {
        return res.status(400).json({ error: "Payment has not been marked as made" });
      }

      // Complete the trade
      const updatedTrade = await storage.updateTrade(tradeId, {
        status: "completed",
        sellerConfirmedAt: new Date()
      });

      // Release funds and update balances
      const buyer = await storage.getUser(trade.buyerId);
      const seller = await storage.getUser(trade.sellerId);

      if (buyer && seller) {
        const tradeAmount = parseFloat(trade.amount);
        const fiatAmount = parseFloat(trade.fiatAmount);

        // Buyer gets USDT, Seller gets Naira
        await storage.updateUser(buyer.id, {
          usdtBalance: (parseFloat(buyer.usdtBalance || "0") + tradeAmount).toString()
        });

        await storage.updateUser(seller.id, {
          nairaBalance: (parseFloat(seller.nairaBalance || "0") + fiatAmount).toString()
        });

        // Send completion notifications
        await emailService.sendTradeNotification(
          buyer.email,
          trade.id,
          `Trade completed! You received ${tradeAmount} USDT.`
        );

        await emailService.sendTradeNotification(
          seller.email,
          trade.id,
          `Trade completed! You received ₦${fiatAmount.toLocaleString()}.`
        );
      }

      res.json(updatedTrade);
    } catch (error) {
      console.error("Confirm payment error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });



  // Raise dispute
  app.post("/api/trades/:id/dispute", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const { reason } = req.body;
      const userId = req.user!.id;

      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.buyerId !== userId && trade.sellerId !== userId) {
        return res.status(403).json({ error: "Only trade participants can raise disputes" });
      }

      const updatedTrade = await storage.updateTrade(tradeId, {
        status: "disputed",
        disputeReason: reason
      });

      res.json(updatedTrade);
    } catch (error) {
      console.error("Dispute error:", error);
      res.status(500).json({ error: "Failed to raise dispute" });
    }
  });

  // Cancel trade
  app.post("/api/trades/:id/cancel", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const { reason } = req.body;
      const userId = req.user!.id;

      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.buyerId !== userId && trade.sellerId !== userId) {
        return res.status(403).json({ error: "Only trade participants can cancel trades" });
      }

      if (trade.status !== "payment_pending") {
        return res.status(400).json({ error: "Cannot cancel trade in current status" });
      }

      const updatedTrade = await storage.updateTrade(tradeId, {
        status: "cancelled",
        disputeReason: reason
      });

      res.json(updatedTrade);
    } catch (error) {
      console.error("Cancel trade error:", error);
      res.status(500).json({ error: "Failed to cancel trade" });
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
      const { amount, rate, status, minAmount, maxAmount, terms } = req.body;

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
      if (minAmount !== undefined) updates.minAmount = minAmount;
      if (maxAmount !== undefined) updates.maxAmount = maxAmount;
      if (terms !== undefined) updates.terms = terms;

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

      await storage.deleteOffer(offerId);
      res.json({ message: "Offer deleted successfully" });
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
        await storage.updateTradeStatus(tradeId, "expired");
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

  // Enhanced dispute system
  app.post("/api/trades/:id/dispute", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const { reason, category, raisedBy } = req.body;
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

      // Handle evidence files if uploaded
      let evidenceFiles = [];
      if (req.files) {
        // Store evidence files (in production, use cloud storage)
        evidenceFiles = Array.isArray(req.files) ? req.files.map(f => f.filename) : [req.files.filename];
      }

      await storage.updateTrade(tradeId, { 
        status: "disputed",
        disputeReason: reason,
        disputeCategory: category,
        disputeRaisedBy: raisedBy,
        disputeEvidence: evidenceFiles.length > 0 ? JSON.stringify(evidenceFiles) : null,
        disputeCreatedAt: new Date()
      });

      // Create dispute notification
      await storage.createTransaction({
        userId: req.user!.id,
        type: "dispute",
        amount: trade.amount,
        status: "pending",
        adminNotes: `Dispute raised: ${category} - ${reason}`,
        rate: trade.rate
      });

      // Notify admins
      const adminUsers = await storage.getUserByEmail("admin@digipay.com");
      if (adminUsers?.email) {
        await emailService.sendTradeNotification(
          adminUsers.email,
          tradeId,
          `URGENT: Dispute raised by ${raisedBy}. Category: ${category}. Trade ID: ${tradeId}`
        );
      }

      res.json({ 
        success: true, 
        message: "Dispute submitted successfully. An admin will review within 24 hours.",
        disputeId: `${tradeId}-DISPUTE`
      });
    } catch (error) {
      console.error("Dispute error:", error);
      res.status(500).json({ error: "Failed to raise dispute" });
    }
  });

  // Admin dispute resolution
  app.post("/api/admin/disputes/:id/resolve", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const { action, adminNotes } = req.body;
      const adminId = req.user!.id;

      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.status !== "disputed") {
        return res.status(400).json({ error: "Trade is not under dispute" });
      }

      const buyer = await storage.getUser(trade.buyerId);
      const seller = await storage.getUser(trade.sellerId);

      if (!buyer || !seller) {
        return res.status(404).json({ error: "Trade participants not found" });
      }

      let newStatus = "completed";
      let resolutionMessage = "";

      switch (action) {
        case 'approve_buyer':
          // Buyer wins - gets USDT, seller gets nothing back
          const tradeAmount = parseFloat(trade.amount);
          await storage.updateUser(buyer.id, {
            usdtBalance: (parseFloat(buyer.usdtBalance || "0") + tradeAmount).toString()
          });
          resolutionMessage = "Dispute resolved in favor of buyer";
          break;

        case 'approve_seller':
          // Seller wins - gets USDT back and fiat amount
          const usdtAmount = parseFloat(trade.amount);
          const fiatAmount = parseFloat(trade.fiatAmount);

          await storage.updateUser(seller.id, {
            usdtBalance: (parseFloat(seller.usdtBalance || "0") + usdtAmount).toString(),
            nairaBalance: (parseFloat(seller.nairaBalance || "0") + fiatAmount).toString()
          });
          resolutionMessage = "Dispute resolved in favor of seller";
          break;

        case 'require_more_info':
          // Don't change trade status, just add admin notes
          await storage.updateTrade(tradeId, {
            adminNotes: adminNotes,
            lastAdminUpdate: new Date()
          });

          // Notify both parties
          await emailService.sendTradeNotification(
            buyer.email,
            tradeId,
            `Admin requires more information: ${adminNotes}`
          );
          await emailService.sendTradeNotification(
            seller.email,
            tradeId,
            `Admin requires more information: ${adminNotes}`
          );

          return res.json({ 
            success: true, 
            message: "Additional information requested from parties" 
          });

        default:
          return res.status(400).json({ error: "Invalid resolution action" });
      }

      // Update trade with resolution
      await storage.updateTrade(tradeId, {
        status: newStatus,
        adminNotes: adminNotes,
        resolvedBy: adminId,
        resolvedAt: new Date()
      });

      // Notify both parties of resolution
      await emailService.sendTradeNotification(
        buyer.email,
        tradeId,
        `Dispute resolved: ${resolutionMessage}. ${adminNotes}`
      );
      await emailService.sendTradeNotification(
        seller.email,
        tradeId,
        `Dispute resolved: ${resolutionMessage}. ${adminNotes}`
      );

      res.json({ 
        success: true, 
        message: "Dispute resolved successfully",
        resolution: resolutionMessage
      });
    } catch (error) {
      console.error("Dispute resolution error:", error);
      res.status(500).json({ error: "Failed to resolve dispute" });
    }
  });

  // Get all disputes for admin
  app.get("/api/admin/disputes", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const disputedTrades = await storage.getDisputedTrades();

      // Enrich with user and offer data
      const enrichedDisputes = await Promise.all(
        disputedTrades.map(async (trade) => {
          const buyer = await storage.getUser(trade.buyerId);
          const seller = await storage.getUser(trade.sellerId);
          const offer = await storage.getOffer(trade.offerId);

          return {
            ...trade,
            buyer: buyer ? { id: buyer.id, email: buyer.email } : null,
            seller: seller ? { id: seller.id, email: seller.email } : null,
            offer
          };
        })
      );

      res.json(enrichedDisputes);
    } catch (error) {
      console.error("Get disputes error:", error);
      res.status(500).json({ error: "Failed to fetch disputes" });
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
  app.get("/api/admin/transactions", authenticateToken, async (req, res) => {
    try {
      // Check admin status from database (in case JWT is outdated)
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const allTransactions = await storage.getAllTransactions();

      // Enrich with user data and map field names properly
      const enrichedTransactions = await Promise.all(
        allTransactions.map(async (transaction) => {
          const user = await storage.getUser(transaction.userId);
          return {
            ...transaction,
            created_at: transaction.createdAt, // Ensure proper field mapping
            bank_name: transaction.bankName,
            account_number: transaction.accountNumber,
            account_name: transaction.accountName,
            paystack_ref: transaction.paystackRef,
            admin_notes: transaction.adminNotes,
            user: user ? { 
              id: user.id, 
              email: user.email, 
              first_name: user.firstName,
              last_name: user.lastName
            } : null,
          };
        })
      );

      res.json(enrichedTransactions);
    } catch (error) {
      console.error("Admin transactions error:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/admin/transactions/:id/approve", authenticateToken, async (req, res) => {
    try {
      // Check admin status from database
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

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

      // For withdrawals, balance was already deducted when request was created
      // Just mark as approved - no additional balance changes needed

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

  app.post("/api/admin/transactions/:id/reject", authenticateToken, async (req, res) => {
    try {
      // Check admin status from database
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

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

      // For rejected withdrawals, refund the user's balance
      if (transaction.type === "withdrawal") {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const currentBalance = parseFloat(user.nairaBalance || "0");
          const withdrawAmount = parseFloat(transaction.amount);
          
          await storage.updateUser(transaction.userId, {
            nairaBalance: (currentBalance + withdrawAmount).toString()
          });
        }
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

      // Profile setup is now simplified - just mark as completed
      const updates: any = {};

      // For now, we'll just update a simple flag to indicate profile completion
      // The actual profile fields would need to be added to the schema
      console.log("Profile setup completed for user:", userId);

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

    // Get direct messages with a specific user
  app.get("/api/messages/user/:userId", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUserId = req.user!.id;

      console.log("API: /api/messages/user/:userId called with:", {
        userId,
        currentUserId,
        rawUserId: req.params.userId
      });

      if (isNaN(userId)) {
        console.log("Invalid userId:", req.params.userId);
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Get messages between current user and specified user using direct SQL
      const result = await pool.query(
        `SELECT id, sender_id, recipient_id, message, trade_id, is_read, created_at
         FROM messages 
         WHERE (sender_id = $1 AND recipient_id = $2) 
            OR (sender_id = $2 AND recipient_id = $1)
         ORDER BY created_at ASC`,
        [currentUserId, userId]
      );

      const messages = result.rows.map(row => ({
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.recipient_id,
        content: row.message,
        tradeId: row.trade_id,
        isRead: row.is_read,
        createdAt: row.created_at
      }));

      console.log("Found", messages.length, "messages between users", currentUserId, "and", userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching user messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

    // Send direct message to a user
  app.post("/api/messages/direct", authenticateToken, async (req, res) => {
    try {
      const { receiverId, content } = req.body;
      const senderId = req.user!.id;

      if (!receiverId || !content || !content.trim()) {
        return res.status(400).json({ error: "Receiver ID and content are required" });
      }

      if (senderId === parseInt(receiverId)) {
        return res.status(400).json({ error: "Cannot send message to yourself" });
      }

      // Verify receiver exists
      const receiver = await storage.getUser(parseInt(receiverId));
      if (!receiver) {
        return res.status(404).json({ error: "Receiver not found" });
      }

      const messageData = await storage.createDirectMessage({
        senderId,
        receiverId: parseInt(receiverId),
        content: content.trim(),
        tradeId: null
      });

      res.json(messageData);
    } catch (error) {
      console.error("Error sending direct message:", error);
      res.status(500).json({ error: "Failed to send message" });
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

  // Messages endpoints
  app.get("/api/messages", authenticateToken, async (req, res) => {
    try {
      const messages = await storage.getUserMessages(req.user!.id);
      res.json(messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.json([]);
    }
  });

  app.post("/api/messages", authenticateToken, async (req, res) => {
    try {
      const { recipientId, messageText, message, offerId, tradeId } = req.body;

      // Use messageText or message, whichever is provided
      const messageContent = messageText || message || "";

      if (!messageContent.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const messageData = {
        senderId: req.user!.id,
        recipientId,
        messageText: messageContent,
        offerId,
        tradeId: tradeId || null // Default to null if no tradeId provided
      };

      const newMessage = await storage.createDirectMessage(messageData);
      res.json(newMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.patch("/api/messages/:id/read", authenticateToken, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const success = await storage.markMessageAsRead(messageId, req.user!.id);
      res.json({ success });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
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
  // Admin users endpoint
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log("Admin users endpoint called");
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
        first_name: users.firstName,
        last_name: users.lastName,
        phone: users.phone,
        kyc_verified: users.kycVerified,
        kyc_status: users.kycStatus,
        naira_balance: users.nairaBalance,
        usdt_balance: users.usdtBalance,
        average_rating: users.averageRating,
        rating_count: users.ratingCount,
        is_admin: users.isAdmin,
        is_online: users.isOnline,
        is_banned: users.isBanned,
        funds_frozen: users.fundsFrozen,
        created_at: users.createdAt,
        total_trades: users.ratingCount, // Using rating count as proxy for total trades
        completed_trades: users.ratingCount // Using rating count as proxy for completed trades
      }).from(users);

      console.log(`Found ${allUsers.length} users`);
      res.json(allUsers);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin routes for approvals
  app.get("/api/admin/transactions", authenticateToken, requireAdmin, async (req, res) => {

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

  // Enhanced Paystack payment initialization with mobile optimization
  app.post("/api/payments/initialize", authenticateToken, async (req, res) => {
    try {
      const { amount, metadata } = req.body;
      const user = req.user!;

      console.log(`Payment initialization for user ${user.id}, amount: ₦${amount}`);

      const result = await enhancedPaystackService.initializePayment(
        user.id,
        user.email,
        parseFloat(amount),
        metadata
      );

      console.log("Payment initialization result:", result.success ? "success" : "failed");
      res.json(result);

    } catch (error: any) {
      console.error("Payment initialization error:", error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Enhanced Paystack webhook for automatic processing
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      
      if (!signature) {
        return res.status(400).send('Missing signature');
      }

      await enhancedPaystackService.handleWebhook(req.body, signature);
      
      res.status(200).send('Webhook processed successfully');
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(400).send(error.message || 'Webhook processing failed');
    }
  });

  // Enhanced Paystack payment verification with automatic balance crediting
  app.post("/api/payments/verify", authenticateToken, async (req, res) => {
    try {
      const { reference } = req.body;
      const userId = req.user!.id;

      console.log(`Verifying payment for user ${userId}, reference: ${reference}`);

      const result = await enhancedPaystackService.verifyPayment(reference, userId);
      
      console.log("Payment verification result:", result.success ? "success" : "failed");
      
      // If verification succeeded but balance wasn't updated, try manual crediting
      if (result.success && !result.balanceUpdated && result.data?.status === 'success') {
        console.log("Attempting manual balance credit for unmatched transaction");
        try {
          const amount = result.data.amount / 100;
          const user = await storage.getUser(userId);
          if (user) {
            const currentBalance = parseFloat(user.nairaBalance || '0');
            const newBalance = currentBalance + amount;
            
            await storage.updateUserBalance(userId, { 
              nairaBalance: newBalance.toString() 
            });
            
            // Create a transaction record
            await storage.createTransaction({
              userId,
              type: 'deposit',
              amount: amount.toString(),
              status: 'completed',
              paystackRef: reference,
              paymentMethod: 'paystack',
              adminNotes: `Manual credit for verified payment - ₦${amount.toLocaleString()}`
            });
            
            result.balanceUpdated = true;
            console.log(`Manually credited ₦${amount.toLocaleString()} to user ${userId}`);
            
            // Emit real-time balance update via WebSocket
            setTimeout(() => {
              const wsServerGlobal = (global as any).wsServer;
              if (wsServerGlobal && wsServerGlobal.clients) {
                console.log(`Broadcasting manual balance update to ${wsServerGlobal.clients.size} connected clients`);
                wsServerGlobal.clients.forEach((client: any) => {
                  if (client.readyState === 1) { // WebSocket.OPEN
                    const updateMessage = {
                      type: 'balance_updated',
                      userId: userId,
                      nairaBalance: newBalance.toString(),
                      usdtBalance: user.usdtBalance,
                      lastTransaction: {
                        type: 'deposit',
                        amount: amount.toString(),
                        status: 'completed'
                      }
                    };
                    console.log('Sending manual balance update:', updateMessage);
                    client.send(JSON.stringify(updateMessage));
                  }
                });
              }
            }, 100); // Small delay to ensure WebSocket is ready
          }
        } catch (manualError) {
          console.error("Manual crediting failed:", manualError);
        }
      }
      
      // Include balance update status in response
      res.json({
        ...result,
        balanceUpdated: result.balanceUpdated || false
      });

    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Payment routes
  registerPaymentRoutes(app);
  
  // Test payment routes (for demo/testing)
  registerTestPaymentRoutes(app);

  // Get user transactions
  app.get("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Enhanced admin endpoints
  app.patch("/api/admin/users/:userId/ban", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { banned, reason } = req.body;

      await pool.query(
        "UPDATE users SET is_banned = $1, ban_reason = $2, banned_at = $3 WHERE id = $4",
        [banned, reason || null, banned ? new Date() : null, userId]
      );

      res.json({ message: `User ${banned ? 'banned' : 'unbanned'} successfully` });
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  app.patch("/api/admin/users/:userId/freeze", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { frozen, reason } = req.body;

      await pool.query(
        "UPDATE users SET funds_frozen = $1, freeze_reason = $2, frozen_at = $3 WHERE id = $4",
        [frozen, reason || null, frozen ? new Date() : null, userId]
      );

      res.json({ message: `User funds ${frozen ? 'frozen' : 'unfrozen'} successfully` });
    } catch (error) {
      console.error("Freeze funds error:", error);
      res.status(500).json({ error: "Failed to update user funds status" });
    }
  });

  app.get("/api/admin/disputes", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          t.id, t.amount, t.rate, t.status, t.dispute_reason, t.dispute_category,
          t.dispute_raised_by, t.dispute_evidence, t.dispute_created_at,
          buyer.email as buyer_email, seller.email as seller_email,
          o.payment_method
        FROM trades t
        LEFT JOIN users buyer ON t.buyer_id = buyer.id
        LEFT JOIN users seller ON t.seller_id = seller.id
        LEFT JOIN offers o ON t.offer_id = o.id
        WHERE t.status = 'disputed'
        ORDER BY t.dispute_created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Admin disputes error:", error);
      res.status(500).json({ error: "Failed to fetch disputes" });
    }
  });

  app.patch("/api/admin/disputes/:tradeId/resolve", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.tradeId);
      const { resolution, winner, notes } = req.body;

      const newStatus = resolution === 'release' ? 'completed' : 'cancelled';

      await pool.query(`
        UPDATE trades 
        SET status = $1, dispute_resolution = $2, dispute_winner = $3, 
            admin_notes = $4, last_admin_update = NOW()
        WHERE id = $5
      `, [newStatus, resolution, winner, notes, tradeId]);

      res.json({ message: "Dispute resolved successfully" });
    } catch (error) {
      console.error("Resolve dispute error:", error);
      res.status(500).json({ error: "Failed to resolve dispute" });
    }
  });

  app.patch("/api/admin/transactions/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes } = req.body;

      await pool.query(
        "UPDATE transactions SET status = 'approved', admin_notes = $1 WHERE id = $2",
        [notes || null, transactionId]
      );

      res.json({ message: "Transaction approved successfully" });
    } catch (error) {
      console.error("Approve transaction error:", error);
      res.status(500).json({ error: "Failed to approve transaction" });
    }
  });

  app.patch("/api/admin/transactions/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { notes } = req.body;

      await pool.query(
        "UPDATE transactions SET status = 'rejected', admin_notes = $1 WHERE id = $2",
        [notes || null, transactionId]
      );

      res.json({ message: "Transaction rejected successfully" });
    } catch (error) {
      console.error("Reject transaction error:", error);
      res.status(500).json({ error: "Failed to reject transaction" });
    }
  });

  // Admin wallet management - credit/debit user accounts
  app.post("/api/admin/wallet/credit", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { userId, amount, currency, description } = req.body;
      const adminId = req.user!.id;

      if (!userId || !amount || !currency || !description) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be positive" });
      }

      if (!["NGN", "USDT"].includes(currency)) {
        return res.status(400).json({ error: "Currency must be NGN or USDT" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user balance
      const currentBalance = parseFloat(currency === "NGN" ? user.nairaBalance || "0" : user.usdtBalance || "0");
      const newBalance = currentBalance + parseFloat(amount);

      const updates: any = {};
      if (currency === "NGN") {
        updates.nairaBalance = newBalance.toString();
      } else {
        updates.usdtBalance = newBalance.toString();
      }

      await storage.updateUser(userId, updates);

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "credit",
        amount: amount.toString(),
        status: "completed",
        adminNotes: `Admin credit: ${description}`,
        paymentMethod: `admin_credit_${currency.toLowerCase()}`
      });

      res.json({ 
        success: true, 
        message: `Successfully credited ${amount} ${currency} to user account`,
        newBalance: newBalance.toString()
      });
    } catch (error) {
      console.error("Admin credit error:", error);
      res.status(500).json({ error: "Failed to credit account" });
    }
  });

  app.post("/api/admin/wallet/debit", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { userId, amount, currency, description } = req.body;
      const adminId = req.user!.id;

      if (!userId || !amount || !currency || !description) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be positive" });
      }

      if (!["NGN", "USDT"].includes(currency)) {
        return res.status(400).json({ error: "Currency must be NGN or USDT" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check current balance
      const currentBalance = parseFloat(currency === "NGN" ? user.nairaBalance || "0" : user.usdtBalance || "0");
      const debitAmount = parseFloat(amount);

      if (currentBalance < debitAmount) {
        return res.status(400).json({ error: `Insufficient ${currency} balance. Current: ${currentBalance}` });
      }

      // Update user balance
      const newBalance = currentBalance - debitAmount;

      const updates: any = {};
      if (currency === "NGN") {
        updates.nairaBalance = newBalance.toString();
      } else {
        updates.usdtBalance = newBalance.toString();
      }

      await storage.updateUser(userId, updates);

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "debit",
        amount: amount.toString(),
        status: "completed",
        adminNotes: `Admin debit: ${description}`,
        paymentMethod: `admin_debit_${currency.toLowerCase()}`
      });

      res.json({ 
        success: true, 
        message: `Successfully debited ${amount} ${currency} from user account`,
        newBalance: newBalance.toString()
      });
    } catch (error) {
      console.error("Admin debit error:", error);
      res.status(500).json({ error: "Failed to debit account" });
    }
  });

  // Admin transaction CRUD operations
  app.get("/api/admin/transactions/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Enrich with user data
      const user = await storage.getUser(transaction.userId);
      res.json({
        ...transaction,
        user: user ? {
          id: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName
        } : null
      });
    } catch (error) {
      console.error("Get transaction error:", error);
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.put("/api/admin/transactions/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { amount, status, adminNotes, type, bankName, accountNumber, accountName } = req.body;

      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Validate status transitions
      const validStatuses = ["pending", "completed", "failed", "rejected", "approved"];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      // Handle balance adjustments for amount changes
      if (amount && parseFloat(amount) !== parseFloat(transaction.amount)) {
        const user = await storage.getUser(transaction.userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const oldAmount = parseFloat(transaction.amount);
        const newAmount = parseFloat(amount);
        const difference = newAmount - oldAmount;

        // Adjust user balance based on transaction type
        if (transaction.type === "credit" || transaction.type === "deposit") {
          const currentBalance = parseFloat(user.nairaBalance || "0");
          await storage.updateUser(transaction.userId, {
            nairaBalance: (currentBalance + difference).toString()
          });
        } else if (transaction.type === "debit" || transaction.type === "withdrawal") {
          const currentBalance = parseFloat(user.nairaBalance || "0");
          const newBalance = currentBalance - difference;
          
          if (newBalance < 0) {
            return res.status(400).json({ error: "Insufficient balance for amount adjustment" });
          }
          
          await storage.updateUser(transaction.userId, {
            nairaBalance: newBalance.toString()
          });
        }
      }

      // Update transaction
      const updates: any = {};
      if (amount !== undefined) updates.amount = amount.toString();
      if (status !== undefined) updates.status = status;
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      if (type !== undefined) updates.type = type;
      if (bankName !== undefined) updates.bankName = bankName;
      if (accountNumber !== undefined) updates.accountNumber = accountNumber;
      if (accountName !== undefined) updates.accountName = accountName;

      const updatedTransaction = await storage.updateTransaction(transactionId, updates);

      res.json({ 
        success: true, 
        message: "Transaction updated successfully",
        transaction: updatedTransaction
      });
    } catch (error) {
      console.error("Update transaction error:", error);
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  app.delete("/api/admin/transactions/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Prevent deletion of completed transactions that affect balance
      if (transaction.status === "completed" && ["credit", "debit", "deposit", "withdrawal"].includes(transaction.type)) {
        // Reverse the transaction effect on user balance before deletion
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const amount = parseFloat(transaction.amount);
          let currentBalance = parseFloat(user.nairaBalance || "0");

          if (transaction.type === "credit" || transaction.type === "deposit") {
            // Reverse credit by debiting
            currentBalance -= amount;
          } else if (transaction.type === "debit" || transaction.type === "withdrawal") {
            // Reverse debit by crediting
            currentBalance += amount;
          }

          if (currentBalance < 0) {
            return res.status(400).json({ 
              error: "Cannot delete transaction: would result in negative balance" 
            });
          }

          await storage.updateUser(transaction.userId, {
            nairaBalance: currentBalance.toString()
          });
        }
      }

      // Delete transaction
      await pool.query("DELETE FROM transactions WHERE id = $1", [transactionId]);

      res.json({ 
        success: true, 
        message: "Transaction deleted successfully"
      });
    } catch (error) {
      console.error("Delete transaction error:", error);
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // User lookup for transfers
  app.post("/api/users/lookup", authenticateToken, async (req, res) => {
    try {
      const { query } = req.body;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      let user = null;
      const trimmedQuery = query.trim().toLowerCase();

      // Try to find by email first
      if (trimmedQuery.includes('@')) {
        user = await storage.getUserByEmail(trimmedQuery);
      } else {
        // Try to find by username
        user = await storage.getUserByUsername(trimmedQuery);
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't allow sending to self
      if (user.id === req.user?.id) {
        return res.status(400).json({ error: "Cannot send funds to yourself" });
      }

      // Return only safe user info with verification details
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username || (user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email.split('@')[0]),
        kycVerified: user.kycVerified,
        kycStatus: user.kycStatus,
        averageRating: user.averageRating || "0",
        ratingCount: user.ratingCount || 0,
        isOnline: user.isOnline || false,
        lastSeen: user.lastSeen
      });
    } catch (error) {
      console.error("User lookup error:", error);
      res.status(500).json({ error: "Lookup failed" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      const { firstName, lastName, username, location, phone } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if username is taken by another user
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Username is already taken" });
        }
      }

      const updatedUser = await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        username,
        location,
        phone
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Send funds between users
  app.post("/api/transfers/send", authenticateToken, async (req, res) => {
    try {
      const { recipientId, amount, description } = req.body;
      const senderId = req.user!.id;

      if (senderId === recipientId) {
        return res.status(400).json({ error: "Cannot send funds to yourself" });
      }

      const sender = await storage.getUser(senderId);
      const recipient = await storage.getUser(recipientId);

      if (!sender || !recipient) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if sender's funds are frozen
      if (sender.fundsFrozen) {
        return res.status(403).json({ 
          error: "Your funds have been frozen. Please contact support for assistance.",
          reason: sender.freezeReason || "Account under review"
        });
      }

      // Check if sender is banned
      if (sender.isBanned) {
        return res.status(403).json({ 
          error: "Your account has been suspended. Please contact support.",
          reason: sender.banReason || "Account suspended"
        });
      }

      const senderBalance = parseFloat(sender.nairaBalance || "0");
      if (amount > senderBalance) {
        return res.status(400).json({ error: "Insufficient balance" });
      }



      // Apply 1% fee
      const fee = amount * 0.01;
      const transferAmount = amount - fee;

      // Update balances with fee deduction
      const newSenderBalance = senderBalance - amount; // Full amount including fee
      const newRecipientBalance = parseFloat(recipient.nairaBalance || "0") + transferAmount; // Amount minus fee

      await storage.updateUser(senderId, { 
        nairaBalance: newSenderBalance.toString() 
      });
      await storage.updateUser(recipientId, { 
        nairaBalance: newRecipientBalance.toString() 
      });

      // Create transaction records
      await storage.createTransaction({
        userId: senderId,
        type: "transfer_out",
        amount: amount.toString(),
        status: "completed",
        adminNotes: `Transfer to ${recipient.email}: ${description} (Fee: ₦${fee.toLocaleString()})`
      });

      await storage.createTransaction({
        userId: recipientId,
        type: "transfer_in",
        amount: transferAmount.toString(),
        status: "completed",
        adminNotes: `Transfer from ${sender.email}: ${description}`
      });

      res.json({ 
        success: true, 
        message: `₦${transferAmount.toLocaleString()} sent successfully to ${recipient.email} (Fee: ₦${fee.toLocaleString()})` 
      });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(500).json({ error: "Transfer failed" });
    }
  });

  // Currency swap
  app.post("/api/swap", authenticateToken, async (req, res) => {
    try {
      const { fromCurrency, amount } = req.body;
      const userId = req.user!.id;
      const USDT_RATE = 1485; // ₦1485 per USDT

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let newNairaBalance: number;
      let newUsdtBalance: number;
      let transactionNote: string;

      if (fromCurrency === "NGN") {
        // NGN to USDT
        const currentNaira = parseFloat(user.nairaBalance || "0");
        if (amount > currentNaira) {
          return res.status(400).json({ error: "Insufficient NGN balance" });
        }

        const fee = amount * 0.01; // 1% fee
        const amountAfterFee = amount - fee;
        const usdtAmount = amountAfterFee / USDT_RATE;
        newNairaBalance = currentNaira - amount;
        newUsdtBalance = parseFloat(user.usdtBalance || "0") + usdtAmount;
        transactionNote = `Swapped ₦${amount.toLocaleString()} to ${usdtAmount.toFixed(6)} USDT (Fee: ₦${fee.toLocaleString()})`;
      } else {
        // USDT to NGN
        const currentUsdt = parseFloat(user.usdtBalance || "0");
        if (amount > currentUsdt) {
          return res.status(400).json({ error: "Insufficient USDT balance" });
        }

        const fee = amount * 0.01; // 1% fee
        const amountAfterFee = amount - fee;
        const nairaAmount = amountAfterFee * USDT_RATE;
        newUsdtBalance = currentUsdt - amount;
        newNairaBalance = parseFloat(user.nairaBalance || "0") + nairaAmount;
        transactionNote = `Swapped ${amount} USDT to ₦${nairaAmount.toLocaleString()} (Fee: ${fee.toFixed(6)} USDT)`;
      }

      // Update user balances
      await storage.updateUser(userId, {
        nairaBalance: newNairaBalance.toString(),
        usdtBalance: newUsdtBalance.toFixed(2)
      });

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "swap",
        amount: amount.toString(),
        status: "completed",
        adminNotes: transactionNote
      });

      res.json({
        success: true,
        message: transactionNote,
        newBalances: {
          nairaBalance: newNairaBalance.toString(),
          usdtBalance: newUsdtBalance.toFixed(2)
        }
      });
    } catch (error) {
      console.error("Swap error:", error);
      res.status(500).json({ error: "Swap failed" });
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

  // USDT transfer endpoint (for internal USDT transfers between users)
  app.post("/api/transfers/send-usdt", authenticateToken, async (req, res) => {
    try {
      const { recipientId, amount, description } = req.body;
      const senderId = req.user!.id;

      if (senderId === recipientId) {
        return res.status(400).json({ error: "Cannot send USDT to yourself" });
      }

      const sender = await storage.getUser(senderId);
      const recipient = await storage.getUser(recipientId);

      if (!sender || !recipient) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if sender's funds are frozen
      if (sender.fundsFrozen) {
        return res.status(403).json({ 
          error: "Your funds have been frozen. USDT transfers are not allowed.",
          reason: sender.freezeReason || "Account under review"
        });
      }

      // Check if sender is banned
      if (sender.isBanned) {
        return res.status(403).json({ 
          error: "Your account has been suspended. Please contact support.",
          reason: sender.banReason || "Account suspended"
        });
      }

      const senderUsdtBalance = parseFloat(sender.usdtBalance || "0");
      if (amount > senderUsdtBalance) {
        return res.status(400).json({ error: "Insufficient USDT balance" });
      }

      // Apply 1% fee for USDT transfers
      const fee = amount * 0.01;
      const transferAmount = amount - fee;

      // Update USDT balances
      const newSenderBalance = senderUsdtBalance - amount; // Full amount including fee
      const newRecipientBalance = parseFloat(recipient.usdtBalance || "0") + transferAmount; // Amount minus fee

      await storage.updateUser(senderId, { 
        usdtBalance: newSenderBalance.toFixed(8)
      });
      await storage.updateUser(recipientId, { 
        usdtBalance: newRecipientBalance.toFixed(8)
      });

      // Create transaction records
      await storage.createTransaction({
        userId: senderId,
        type: "transfer_out",
        amount: amount.toString(),
        status: "completed",
        adminNotes: `USDT transfer to ${recipient.email}: ${description || 'Internal transfer'} (Fee: ${fee.toFixed(6)} USDT)`
      });

      await storage.createTransaction({
        userId: recipientId,
        type: "transfer_in",
        amount: transferAmount.toString(),
        status: "completed",
        adminNotes: `USDT transfer from ${sender.email}: ${description || 'Internal transfer'}`
      });

      res.json({ 
        success: true, 
        message: `${transferAmount.toFixed(6)} USDT sent successfully to ${recipient.email} (Fee: ${fee.toFixed(6)} USDT)`,
        txHash: `internal-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      });
    } catch (error) {
      console.error("USDT transfer error:", error);
      res.status(500).json({ error: "USDT transfer failed" });
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
    try{
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
          const rater =await storage.getUser(rating.raterId);
          return {
            ...rating,
            rater: rater ? {              id: rater.id, 
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

  // Admin user management endpoints
  app.patch("/api/admin/users/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const updateData = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user
      const updatedUser = await storage.updateUser(userId, {
        email: updateData.email,
        username: updateData.username || null,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone || null,
        nairaBalance: updateData.nairaBalance,
        usdtBalance: updateData.usdtBalance,
        isAdmin: updateData.isAdmin,
        kycVerified: updateData.kycVerified
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Prevent deleting self
      if (userId === req.user!.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/admin/users/:userId/transactions", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Get user transactions error:", error);
      res.status(500).json({ error: "Failed to fetch user transactions" });
    }
  });

  app.get("/api/admin/users/:userId/trades", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const trades = await storage.getUserTrades(userId);
      res.json(trades);
    } catch (error) {
      console.error("Get user trades error:", error);
      res.status(500).json({ error: "Failed to fetch user trades" });
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

  app.get("/api/trades/:id", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const user = req.user!;

      const trade = await storage.getTradeById(tradeId);

      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      // Check if user is part of this trade
      if (trade.buyerId !== user.id && trade.sellerId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get trade with full details
      const tradeWithDetails = await storage.getTradeWithDetails(tradeId);

      res.json(tradeWithDetails);
    } catch (error) {
      console.error("Error fetching trade:", error);
      res.status(500).json({ error: "Failed to fetch trade" });
    }
  });

  // Get all trades for the current user
  app.get("/api/trades", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;

      console.log(`Fetching trades for user ${userId}`);

      const trades = await storage.getUserTrades(userId);

      // Check for expired trades and update their status
      const now = new Date();
      for (const trade of trades) {
        if (trade.paymentDeadline && 
            new Date(trade.paymentDeadline) < now && 
            ["payment_pending"].includes(trade.status)) {
          await storage.updateTradeStatus(trade.id, { status: "expired" });
          trade.status = "expired"; // Update the local object
        }
      }

      console.log(`Found ${trades.length} trades for user ${userId}`);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ error: "Failed to fetch trades", details: error.message });
    }
  });

  // Mark payment as made (buyer action)
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
        await storage.updateTradeStatus(tradeId, "expired");
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

  // Confirm payment received (seller action)
  app.post("/api/trades/:id/confirm-payment", authenticateToken, async (req, res) => {
    try {
      const tradeId = parseInt(req.params.id);
      const userId = req.user!.id;

      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      if (trade.sellerId !== userId) {
        return res.status(403).json({ error: "Only seller can confirm payment" });
      }

      if (trade.status !== "payment_made") {
        return res.status(400).json({ error: "Payment has not been marked as made" });
      }

      // Complete the trade
      const updatedTrade = await storage.updateTrade(tradeId, {
        status: "completed",
        sellerConfirmedAt: new Date()
      });

      // Release funds and update balances
      const buyer = await storage.getUser(trade.buyerId);
      const seller = await storage.getUser(trade.sellerId);

      if (buyer && seller) {
        const tradeAmount = parseFloat(trade.amount);
        const fiatAmount = parseFloat(trade.fiatAmount);

        // Buyer gets USDT, Seller gets Naira
        await storage.updateUser(buyer.id, {
          usdtBalance: (parseFloat(buyer.usdtBalance || "0") + tradeAmount).toString()
        });

        await storage.updateUser(seller.id, {
          nairaBalance: (parseFloat(seller.nairaBalance || "0") + fiatAmount).toString()
        });

        // Send completion notifications
        await emailService.sendTradeNotification(
          buyer.email,
          trade.id,
          `Trade completed! You received ${tradeAmount} USDT.`
        );

        await emailService.sendTradeNotification(
          seller.email,
          trade.id,
          `Trade completed! You received ₦${fiatAmount.toLocaleString()}.`
        );
      }

      res.json(updatedTrade);
    } catch (error) {
      console.error("Confirm payment error:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Setup WebSocket for real-time updates (only if not already setup)
  if (!(global as any).wsServer) {
    const websocketModule = await import("./middleware/websocket.js");
    websocketModule.setupWebSocket(httpServer);
  }

  return httpServer;
}