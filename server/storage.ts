import { 
  users, offers, trades, messages, transactions, ratings, exchangeRates,
  type User, type InsertUser, type Offer, type InsertOffer,
  type Trade, type InsertTrade, type Message, type InsertMessage,
  type Transaction, type InsertTransaction, type Rating, type InsertRating,
  type ExchangeRate, type InsertExchangeRate
} from "../shared/schema.js";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, or, and } from "drizzle-orm";
import bcrypt from "bcrypt";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Offer methods
  getOffers(): Promise<Offer[]>;
  getOffer(id: number): Promise<Offer | undefined>;
  getUserOffers(userId: number): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: number, updates: Partial<Offer>): Promise<Offer | undefined>;

  // Trade methods
  getTrades(): Promise<Trade[]>;
  getTrade(id: number): Promise<Trade | undefined>;
  getUserTrades(userId: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, updates: Partial<Trade>): Promise<Trade | undefined>;

  // Message methods
  getTradeMessages(tradeId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: number, userId: number): Promise<boolean>;
  async getUserMessages(userId: number): Promise<any[]>;
  async createDirectMessage(message: any): Promise<Message>;

  // Transaction methods
  getUserTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // Rating methods
  createRating(rating: InsertRating): Promise<Rating>;
  getUserRatings(userId: number): Promise<Rating[]>;
  getAllRatings(): Promise<Rating[]>;
  getTradeRating(tradeId: number, raterId: number): Promise<Rating | null>;
  updateRating(ratingId: number, updates: Partial<Rating>): Promise<Rating | null>;

  // Additional transaction methods
  getAllTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;

  // Enhanced user profile methods
  getUserProfile(id: number): Promise<User | undefined>;
  getUserTrades(id: number): Promise<Trade[]>;
  getUserPublicRatings(id: number): Promise<any[]>;

  // Exchange rate methods
  getExchangeRates(): Promise<ExchangeRate[]>;
  getExchangeRate(name: string): Promise<ExchangeRate | null>;
  updateExchangeRate(name: string, rate: string): Promise<ExchangeRate | null>;
  createExchangeRate(data: InsertExchangeRate): Promise<ExchangeRate>;

  sessionStore: any;
}

// Define the EnrichedTrade type
interface EnrichedTrade {
  id: number;
  offerId: number;
  buyerId: number;
  sellerId: number;
  amount: number;
  rate: number;
  fiatAmount: number;
  status: string;
  escrowAddress: string;
  paymentDeadline: string;
  paymentReference: string;
  paymentProof: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  offer: {
    id: number;
    type: string;
    paymentMethod: string;
  };
  buyer: {
    id: number;
    email: string;
    username: string;
  };
  seller: {
    id: number;
    email: string;
    username: string;
  };
}

// Define buyerUser and sellerUser outside the class
const buyerUser = {
  id: users.id,
  email: users.email,
};

const sellerUser = {
  id: users.id,
  email: users.email,
};

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    // Seed initial data for demo
    this.seedInitialData();
  }

  private async seedInitialData() {
    try {
      // Create admin user without automatic balance seeding
      let adminUser = await this.getUserByEmail("admin@digipay.com");
      if (!adminUser) {
        const hashedAdminPass = await bcrypt.hash("admin123", 12);
        adminUser = await this.createUser({
          email: "admin@digipay.com",
          phone: "08099999999",
          password: hashedAdminPass,
          kycVerified: true,
          isAdmin: true,
          nairaBalance: "0",
          usdtBalance: "0",
          bvn: "98765432109",
          tronAddress: "TRXAdmin987654321"
        });
        console.log("✅ Created admin user - Email: admin@digipay.com, Password: admin123");
      } else {
        // Only update admin privileges, not balances
        await this.updateUser(adminUser.id, {
          isAdmin: true,
          kycVerified: true
        });
        console.log("✅ Updated admin@digipay.com admin privileges");
      }

      // Create additional test users for demo offers (without automatic balances)
      let testUser1 = await this.getUserByEmail("trader1@example.com");
      if (!testUser1) {
        testUser1 = await this.createUser({
          email: "trader1@example.com",
          phone: "08011111111",
          password: "trader123",
          kycVerified: true,
          nairaBalance: "0",
          usdtBalance: "0",
          bvn: "11111111111",
          tronAddress: "TRXTrader1111",
          averageRating: "4.8",
          ratingCount: 25
        });
        console.log("✅ Created trader1 user (no balance)");
      }

      let testUser2 = await this.getUserByEmail("trader2@example.com");
      if (!testUser2) {
        testUser2 = await this.createUser({
          email: "trader2@example.com",
          phone: "08022222222",
          password: "trader123",
          kycVerified: true,
          nairaBalance: "0",
          usdtBalance: "0",
          bvn: "22222222222",
          tronAddress: "TRXTrader2222",
          averageRating: "4.9",
          ratingCount: 42
        });
        console.log("✅ Created trader2 user (no balance)");
      }

      // Seed exchange rates if they don't exist - with error handling
      try {
        const existingRates = await db.select().from(exchangeRates);
        if (existingRates.length === 0) {
          await db.insert(exchangeRates).values([
            {
              name: "USDT_TO_NGN",
              rate: "1485.00000000",
              description: "USDT to Nigerian Naira exchange rate",
              isActive: true
            },
            {
              name: "NGN_TO_USD", 
              rate: "0.00067000",
              description: "Nigerian Naira to USD exchange rate",
              isActive: true
            }
          ]);
          console.log("💱 Seeded initial exchange rates");
        } else {
          console.log("💱 Exchange rates already exist");
        }
      } catch (error) {
        console.log("⚠️ Exchange rates table may not exist yet - will be created on next restart");
      }

      // Always refresh offers to ensure they exist
      const existingOffers = await this.getOffers();
      console.log(`📊 Found ${existingOffers.length} existing offers`);

      if (existingOffers.length < 12) {
        // Clear existing data in correct order to avoid foreign key constraints
        await db.delete(messages); // Clear messages first
        await db.delete(trades);   // Then trades
        await db.delete(offers);   // Finally offers

        // Featured Buy offers (users want to buy USDT) - High rates for featured
        await this.createOffer({
          userId: testUser1.id,
          type: "buy",
          amount: "100.00",
          rate: "1495.00",
          paymentMethod: "bank_transfer",
          minAmount: "10.00",
          maxAmount: "100.00"
        });

        await this.createOffer({
          userId: testUser2.id,
          type: "buy",
          amount: "250.00",
          rate: "1492.00",
          paymentMethod: "mobile_money",
          minAmount: "20.00",
          maxAmount: "250.00"
        });

        await this.createOffer({
          userId: adminUser.id,
          type: "buy",
          amount: "50.00",
          rate: "1490.00",
          paymentMethod: "digital_wallet",
          minAmount: "5.00",
          maxAmount: "50.00"
        });

        // More buy offers
        await this.createOffer({
          userId: adminUser.id,
          type: "buy",
          amount: "500.00",
          rate: "1488.00",
          paymentMethod: "bank_transfer",
          minAmount: "50.00",
          maxAmount: "500.00"
        });

        await this.createOffer({
          userId: testUser1.id,
          type: "buy",
          amount: "75.00",
          rate: "1486.00",
          paymentMethod: "card_payment",
          minAmount: "10.00",
          maxAmount: "75.00"
        });

        // Featured Sell offers (users want to sell USDT) - Low rates for featured
        await this.createOffer({
          userId: testUser2.id,
          type: "sell",
          amount: "150.00",
          rate: "1475.00",
          paymentMethod: "bank_transfer",
          minAmount: "15.00",
          maxAmount: "150.00"
        });

        await this.createOffer({
          userId: testUser1.id,
          type: "sell",
          amount: "300.00",
          rate: "1470.00",
          paymentMethod: "mobile_money",
          minAmount: "25.00",
          maxAmount: "300.00"
        });

        await this.createOffer({
          userId: adminUser.id,
          type: "sell",
          amount: "80.00",
          rate: "1478.00",
          paymentMethod: "card_payment",
          minAmount: "8.00",
          maxAmount: "80.00"
        });

        // More sell offers
        await this.createOffer({
          userId: adminUser.id,
          type: "sell",
          amount: "200.00",
          rate: "1472.00",
          paymentMethod: "bank_transfer",
          minAmount: "20.00",
          maxAmount: "200.00"
        });

        await this.createOffer({
          userId: testUser2.id,
          type: "sell",
          amount: "120.00",
          rate: "1476.00",
          paymentMethod: "digital_wallet",
          minAmount: "12.00",
          maxAmount: "120.00"
        });

        // Additional diverse offers
        await this.createOffer({
          userId: testUser1.id,
          type: "buy",
          amount: "35.00",
          rate: "1485.00",
          paymentMethod: "mobile_money",
          minAmount: "5.00",
          maxAmount: "35.00"
        });

        await this.createOffer({
          userId: adminUser.id,
          type: "sell",
          amount: "60.00",
          rate: "1474.00",
          paymentMethod: "bank_transfer",
          minAmount: "6.00",
          maxAmount: "60.00"
        });

        console.log("✅ Seeded 12 diverse demo offers (6 buy, 6 sell)");
      } else {
        console.log("📊 Offers already exist, skipping seed");
      }
    } catch (error) {
      console.error("Failed to seed initial data:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        tronAddress: insertUser.tronAddress || `TRX${Math.random().toString(36).substring(2, 15)}`,
        kycVerified: insertUser.kycVerified || false,
        nairaBalance: insertUser.nairaBalance || "0",
        usdtBalance: insertUser.usdtBalance || "0",
        averageRating: insertUser.averageRating || "0",
        ratingCount: insertUser.ratingCount || 0,
        isAdmin: insertUser.isAdmin || false,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      // Filter out undefined values to prevent SQL issues
      const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      if (Object.keys(cleanUpdates).length === 0) {
        // No valid updates, return current user
        return await this.getUser(id);
      }

      const [user] = await db
        .update(users)
        .set(cleanUpdates)
        .where(eq(users.id, id))
        .returning();
      return user || undefined;
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  }

  async updateUserProfile(id: number, updates: Partial<User>): Promise<User | null> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return updatedUser || null;
    } catch (error) {
      console.error("Update user profile error:", error);
      return null;
    }
  }

  // Offer methods
  async getOffers(): Promise<Offer[]> {
    return await db.select().from(offers).where(eq(offers.status, "active"));
  }

  async getFeaturedOffers(): Promise<{buyOffers: Offer[], sellOffers: Offer[]}> {
    const allOffers = await db.select().from(offers).where(eq(offers.status, "active")).orderBy(desc(offers.createdAt));

    // Get top 3 buy offers (highest rates)
    const buyOffers = allOffers
      .filter(o => o.type === "buy")
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))
      .slice(0, 3);

    // Get top 3 sell offers (lowest rates)
    const sellOffers = allOffers
      .filter(o => o.type === "sell")
      .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))
      .slice(0, 3);

    return { buyOffers, sellOffers };
  }

  async getOffer(id: number): Promise<Offer | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, id));
    return offer || undefined;
  }

  async getUserOffers(userId: number): Promise<Offer[]> {
    // Get offers with remaining amount calculation
    const userOffers = await db
      .select()
      .from(offers)
      .where(eq(offers.userId, userId))
      .orderBy(desc(offers.createdAt));

    // Calculate remaining amount for each offer
    const offersWithRemaining = await Promise.all(
      userOffers.map(async (offer) => {
        // Get completed trades for this offer
        const completedTrades = await db
          .select()
          .from(trades)
          .where(and(
            eq(trades.offerId, offer.id),
            eq(trades.status, 'completed')
          ));

        // Calculate total traded amount
        const totalTraded = completedTrades.reduce((sum, trade) => {
          return sum + parseFloat(trade.amount || "0");
        }, 0);

        // Calculate remaining amount
        const originalAmount = parseFloat(offer.amount);
        const remainingAmount = originalAmount - totalTraded;

        // Mark as completed if no amount remaining
        const isCompleted = remainingAmount <= 0;

        // Check for active trades
        const activeTrades = await db
          .select()
          .from(trades)
          .where(and(
            eq(trades.offerId, offer.id),
            or(
              eq(trades.status, 'pending'),
              eq(trades.status, 'payment_pending'),
              eq(trades.status, 'payment_made'),
              eq(trades.status, 'escrow_funded')
            )
          ));

        const hasActiveTrades = activeTrades.length > 0;

        return {
          ...offer,
          remainingAmount: remainingAmount.toString(),
          totalTraded: totalTraded.toString(),
          isFullyTraded: isCompleted,
          hasActiveTrades: hasActiveTrades
        };
      })
    );

    return offersWithRemaining;
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const [offer] = await db
      .insert(offers)
      .values({ ...insertOffer, status: "active" })
      .returning();
    return offer;
  }

  async updateOffer(id: number, updates: Partial<{
    amount: string;
    rate: string;
    status: string;
    minAmount: string;
    maxAmount: string;
    terms: string;
  }>): Promise<Offer | undefined> {
    const [offer] = await db
      .update(offers)
      .set(updates)
      .where(eq(offers.id, id))
      .returning();
    return offer || undefined;
  }

  async deleteOffer(id: number) {
    await db.delete(offers).where(eq(offers.id, id));
  }

  // Trade methods
  async getTrades(): Promise<Trade[]> {
    // Get trades and then fetch user data separately to avoid alias conflicts
    const allTrades = await db.select().from(trades);
    const userIds = new Set([
      ...allTrades.map(t => t.buyerId),
      ...allTrades.map(t => t.sellerId)
    ]);
    
    // Get all users individually to avoid complex join issues
    const allUsers = [];
    for (const id of userIds) {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (user) allUsers.push(user);
    }

    const usersMap = new Map(allUsers.map(u => [u.id, u]));

    return allTrades.map(trade => ({
      ...trade,
      buyer: usersMap.get(trade.buyerId),
      seller: usersMap.get(trade.sellerId)
    }));
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade || undefined;
  }

  async getUserTrades(userId: number): Promise<Trade[]> {
    const userTrades = await db
      .select()
      .from(trades)
      .where(or(eq(trades.buyerId, userId), eq(trades.sellerId, userId)))
      .orderBy(desc(trades.createdAt))
      .limit(20);

    // Get all unique user IDs from the trades
    const userIds = new Set([
      ...userTrades.map(t => t.buyerId),
      ...userTrades.map(t => t.sellerId)
    ]);
    
    // Fetch user data for all participants
    const usersData = await db
      .select()
      .from(users)
      .where(eq(users.id, [...userIds][0]));

    // Get all users individually since we can't use inArray easily
    const allUsers = [];
    for (const id of userIds) {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (user) allUsers.push(user);
    }

    const usersMap = new Map(allUsers.map(u => [u.id, u]));

    return userTrades.map(trade => ({
      ...trade,
      buyer: usersMap.get(trade.buyerId),
      seller: usersMap.get(trade.sellerId)
    }));
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const [trade] = await db
      .insert(trades)
      .values({
        offerId: insertTrade.offerId,
        buyerId: insertTrade.buyerId,
        sellerId: insertTrade.sellerId,
        amount: insertTrade.amount,
        rate: insertTrade.rate,
        fiatAmount: insertTrade.fiatAmount,
        status: "pending",
        escrowAddress: `TRX_ESCROW_${Math.random().toString(36).substring(2, 15)}`,
      })
      .returning();
    return trade;
  }

  async updateTradeStatus(tradeId: number, status: string) {
    const trade = await this.getTrade(tradeId);

    // If trade is being marked as expired or cancelled, restore offer amount
    if ((status === "expired" || status === "cancelled") && trade) {
      const offer = await this.getOffer(trade.offerId);
      if (offer) {
        const currentAmount = parseFloat(offer.amount || "0");
        const tradeAmount = parseFloat(trade.amount);
        const newAmount = currentAmount + tradeAmount;

        await this.updateOffer(offer.id, {
          amount: newAmount.toString(),
          status: "active" // Reactivate the offer
        });

        // If it's a sell offer, also restore the seller's USDT balance
        if (offer.type === "sell") {
          const seller = await this.getUser(trade.sellerId);
          if (seller) {
            const currentBalance = parseFloat(seller.usdtBalance || "0");
            await this.updateUser(seller.id, {
              usdtBalance: (currentBalance + tradeAmount).toString()
            });
          }
        }
      }
    }

    await db.update(trades)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(trades.id, tradeId));
  }

  async updateTrade(id: number, updates: Partial<Trade>): Promise<Trade | undefined> {
    try {
      // Convert string dates to Date objects for Drizzle ORM
      const processedUpdates = { ...updates };
      
      if (processedUpdates.paymentDeadline && typeof processedUpdates.paymentDeadline === 'string') {
        processedUpdates.paymentDeadline = new Date(processedUpdates.paymentDeadline);
      }
      
      if (processedUpdates.updatedAt && typeof processedUpdates.updatedAt === 'string') {
        processedUpdates.updatedAt = new Date(processedUpdates.updatedAt);
      }

      const [trade] = await db
        .update(trades)
        .set(processedUpdates)
        .where(eq(trades.id, id))
        .returning();
      return trade || undefined;
    } catch (error) {
      console.error('Error updating trade:', error);
      return undefined;
    }
  }

  // Message methods
  async getTradeMessages(tradeId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.tradeId, tradeId)).orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

    async getUserMessages(userId: number): Promise<Message[]> {
    try {
      console.log("getUserMessages called with userId:", userId);

      const result = await pool.query(`
        SELECT 
          m.id,
          m.sender_id,
          m.recipient_id,
          m.message,
          m.trade_id,
          m.offer_id,
          m.is_read,
          m.created_at,
          sender.email as sender_email,
          receiver.email as receiver_email
        FROM messages m
        LEFT JOIN users sender ON m.sender_id = sender.id
        LEFT JOIN users receiver ON m.recipient_id = receiver.id
        WHERE m.sender_id = $1 OR m.recipient_id = $1
        ORDER BY m.created_at DESC
      `, [userId]);

      return result.rows.map(row => ({
        id: row.id,
        senderId: row.sender_id,
        recipientId: row.recipient_id,
        messageText: row.message,
        tradeId: row.trade_id,
        offerId: row.offer_id,
        isRead: row.is_read,
        createdAt: row.created_at,
        senderEmail: row.sender_email,
        receiverEmail: row.receiver_email
      }));
    } catch (error) {
      console.error("Error in getUserMessages:", error);
      return [];
    }
  }

    async createDirectMessage(message: any): Promise<any> {
        try {
            const result = await pool.query(
                `INSERT INTO messages (sender_id, recipient_id, message, trade_id, is_read, created_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW()) 
                 RETURNING id, sender_id, recipient_id, message, trade_id, is_read, created_at`,
                [
                    message.senderId,
                    message.receiverId || message.recipientId,
                    message.content || message.messageText || message.message,
                    message.tradeId || null,
                    false
                ]
            );

            const row = result.rows[0];
            return {
                id: row.id,
                senderId: row.sender_id,
                receiverId: row.recipient_id,
                content: row.message,
                tradeId: row.trade_id,
                isRead: row.is_read,
                createdAt: row.created_at
            };
        } catch (error) {
            console.error("Error creating direct message:", error);
            throw new Error("Failed to create message");
        }
    }

    async markMessageAsRead(messageId: number, userId: number): Promise<boolean> {
    try {
      const result = await pool.query(
        "UPDATE messages SET is_read = true WHERE id = $1 AND recipient_id = $2",
        [messageId, userId]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
  }

    async getDirectMessages(userId1: number, userId2: number): Promise<Message[]> {
        try {
            return await db.select()
                .from(messages)
                .where(
                    or(
                        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
                        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
                    )
                )
                .orderBy(asc(messages.createdAt));
        } catch (error) {
            console.error("Error fetching direct messages:", error);
            return [];
        }
    }

  // Transaction methods
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(data: {
    userId: number;
    type: "deposit" | "withdrawal" | "transfer";
    amount: string;
    status: "pending" | "completed" | "failed" | "cancelled";
    paymentMethod?: string;
    rate?: string;
    adminNotes?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    paystackRef?: string;
  }): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        status: data.status,
        paymentMethod: data.paymentMethod,
        rate: data.rate,
        adminNotes: data.adminNotes,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        paystackRef: data.paystackRef
      })
      .returning();
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return transaction || undefined;
  }

  // Rating methods
  async createRating(insertRating: InsertRating): Promise<Rating> {
    const [rating] = await db
      .insert(ratings)
      .values(insertRating)
      .returning();

    // Update user's average rating
    const userRatings = await db.select().from(ratings).where(eq(ratings.ratedUserId, insertRating.ratedUserId));
    const avgRating = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length;

    await this.updateUser(insertRating.ratedUserId, {
      averageRating: avgRating.toFixed(2),
      ratingCount: userRatings.length,
    });

    return rating;
  }

  async getUserRatings(userId: number): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.ratedUserId, userId));
  }

  async getAllRatings(): Promise<Rating[]> {
    return await db.select().from(ratings);
  }

  async getTradeRating(tradeId: number, raterId: number): Promise<Rating | null> {
    const [rating] = await db.select().from(ratings).where(and(eq(ratings.tradeId, tradeId), eq(ratings.raterId, raterId)));
    return rating || null;
  }

  async updateRating(ratingId: number, updates: Partial<Rating>): Promise<Rating | null> {
    const [updatedRating] = await db
      .update(ratings)
      .set(updates)
      .where(eq(ratings.id, ratingId))
      .returning();

    if (updatedRating) {
      // Recalculate user's average rating
      const userRatings = await db.select().from(ratings).where(eq(ratings.ratedUserId, updatedRating.ratedUserId));
      const avgRating = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length;

      await this.updateUser(updatedRating.ratedUserId, {
        averageRating: avgRating.toFixed(2),
        ratingCount: userRatings.length,
      });
    }

    return updatedRating || null;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getTransactionByReference(reference: string): Promise<Transaction | null> {
    try {
      const result = await db.select()
        .from(transactions)
        .where(eq(transactions.paystackRef, reference))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting transaction by reference:", error);
      return null;
    }
  }

  async getTransactionByPaystackRef(paystackRef: string): Promise<Transaction | null> {
    try {
      const result = await db.select()
        .from(transactions)
        .where(eq(transactions.paystackRef, paystackRef))
        .limit(1);
      return result[0] || null;
    } catch (error) {
      console.error("Error getting transaction by paystack ref:", error);
      return null;
    }
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    try {
      const result = await db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt));
      return result;
    } catch (error) {
      console.error("Error getting transactions by user:", error);
      return [];
    }
  }

  async getExchangeRates(): Promise<ExchangeRate[]> {
    return await db.select().from(exchangeRates).where(eq(exchangeRates.isActive, true));
  }

  async getExchangeRate(name: string): Promise<ExchangeRate | null> {
    const [rate] = await db
      .select()
      .from(exchangeRates)
      .where(and(eq(exchangeRates.name, name), eq(exchangeRates.isActive, true)))
      .limit(1);
    return rate || null;
  }

  async updateExchangeRate(name: string, rate: string): Promise<ExchangeRate | null> {
    const [updated] = await db
      .update(exchangeRates)
      .set({ 
        rate: rate,
        updatedAt: new Date()
      })
      .where(eq(exchangeRates.name, name))
      .returning();
    return updated || null;
  }

  async createExchangeRate(data: InsertExchangeRate): Promise<ExchangeRate> {
    const [created] = await db.insert(exchangeRates).values(data).returning();
    return created;
  }

  async deleteTransactionByReference(reference: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.paystackRef, reference));
  }

  async updateUserBalance(userId: number, updates: { nairaBalance?: string; usdtBalance?: string }): Promise<void> {
    await db.update(users).set(updates).where(eq(users.id, userId));
  }

  async getUserPendingDeposit(userId: number): Promise<Transaction | null> {
    const result = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'deposit'),
        eq(transactions.status, 'pending')
      ))
      .limit(1);
    return result[0] || null;
  }



  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getUserProfile(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserPublicRatings(id: number): Promise<any[]> {
    return await db
      .select({
        id: ratings.id,
        rating: ratings.rating,
        comment: ratings.comment,
        createdAt: ratings.createdAt,
        rater: {
          email: users.email,
        },
      })
      .from(ratings)
      .leftJoin(users, eq(ratings.raterId, users.id))
      .where(eq(ratings.ratedUserId, id))
      .orderBy(desc(ratings.createdAt));
  }

  async getTradeById(tradeId: number) {
    const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId));
    return trade || null;
  }

  async getTradeWithDetails(tradeId: number): Promise<EnrichedTrade | null> {
    // Get trade first
    const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId));
    if (!trade) return null;

    // Get related data separately
    const [offer] = trade.offerId ? await db.select().from(offers).where(eq(offers.id, trade.offerId)) : [null];
    const [buyer] = trade.buyerId ? await db.select().from(users).where(eq(users.id, trade.buyerId)) : [null];
    const [seller] = trade.sellerId ? await db.select().from(users).where(eq(users.id, trade.sellerId)) : [null];

    return {
      ...trade,
      amount: parseFloat(trade.amount),
      rate: parseFloat(trade.rate),
      fiatAmount: parseFloat(trade.fiatAmount),
      offer: offer ? { id: offer.id, type: offer.type } : null,
      buyer: buyer ? { id: buyer.id, email: buyer.email, username: buyer.username } : null,
      seller: seller ? { id: seller.id, email: seller.email, username: seller.username } : null,
    } as unknown as EnrichedTrade;
  }

  async getTradesByUser(userId: number): Promise<EnrichedTrade[]> {
    const tradesResult = await db
      .select({
        id: trades.id,
        offerId: trades.offerId,
        buyerId: trades.buyerId,
        sellerId: trades.sellerId,
        amount: trades.amount,
        rate: trades.rate,
        fiatAmount: trades.fiatAmount,
        status: trades.status,
        escrowAddress: trades.escrowAddress,
        paymentDeadline: trades.paymentDeadline,
        paymentReference: trades.paymentReference,
        paymentProof: trades.paymentProof,
        bankName: trades.bankName,
        accountNumber: trades.accountNumber,
        accountName: trades.accountName,
        createdAt: trades.createdAt,
        offer: {
          id: offers.id,
          type: offers.type,
          paymentMethod: offers.paymentMethod,
        },
        buyer: {
          id: buyerUser.id,
          email: buyerUser.email,
          username: buyerUser.username,
        },
        seller: {
          id: sellerUser.id,
          email: sellerUser.email,
          username: sellerUser.username,
        },
      })
      .from(trades)
      .leftJoin(offers, eq(trades.offerId, offers.id))
      .leftJoin(buyerUser, eq(trades.buyerId, buyerUser.id))
      .leftJoin(sellerUser, eq(trades.sellerId, sellerUser.id))
      .where(or(eq(trades.buyerId, userId), eq(trades.sellerId, userId)))
      .orderBy(desc(trades.createdAt))
      .limit(20);

    return tradesResult as EnrichedTrade[];
  }

  // Dispute-related methods
  async getDisputedTrades(): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.status, "disputed"))
      .orderBy(desc(trades.createdAt));
  }

  async resolveDispute(tradeId: number, resolution: string, adminId: number): Promise<Trade | undefined> {
    const [trade] = await db
      .update(trades)
      .set({
        status: resolution === 'buyer_wins' ? 'completed' : 'cancelled',
        adminNotes: `Dispute resolved: ${resolution}`,
        resolvedBy: adminId,
        resolvedAt: new Date()
      })
      .where(eq(trades.id, tradeId))
      .returning();
    return trade || undefined;
  }

  // Notification methods
  async createNotification(notification: {
    userId: number;
    type: string;
    title: string;
    message: string;
    data?: string;
  }) {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: number) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

}

export const storage = new DatabaseStorage();