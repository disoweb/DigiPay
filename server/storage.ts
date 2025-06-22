import { 
  users, offers, trades, messages, transactions, ratings,
  type User, type InsertUser, type Offer, type InsertOffer,
  type Trade, type InsertTrade, type Message, type InsertMessage,
  type Transaction, type InsertTransaction, type Rating, type InsertRating
} from "@shared/schema";
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

  // Additional transaction methods
  getAllTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;

  // Enhanced user profile methods
  getUserProfile(id: number): Promise<User | undefined>;
  getUserTrades(id: number): Promise<Trade[]>;
  getUserPublicRatings(id: number): Promise<any[]>;

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
  };
  seller: {
    id: number;
    email: string;
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
      // Always ensure users exist
      let user1 = await this.getUser(1);
      if (!user1) {
        const hashedPass = await bcrypt.hash("password123", 12);
        user1 = await this.createUser({
          email: "cyfer33@gmail.com",
          phone: "08000000000",
          password: hashedPass,
          kycVerified: true,
          nairaBalance: "50000",
          usdtBalance: "25.50",
          bvn: "12345678901",
          tronAddress: "TRX123456789"
        });
        console.log("Seeded initial user data");
      }

      // Create admin user
      let adminUser = await this.getUserByEmail("admin@digipay.com");
      if (!adminUser) {
        const hashedAdminPass = await bcrypt.hash("admin123", 12);
        adminUser = await this.createUser({
          email: "admin@digipay.com",
          phone: "08099999999",
          password: hashedAdminPass,
          kycVerified: true,
          isAdmin: true,
          nairaBalance: "100000",
          usdtBalance: "100.00",
          bvn: "98765432109",
          tronAddress: "TRXAdmin987654321"
        });
        console.log("✅ Seeded admin user - Email: admin@digipay.com, Password: admin123");
      } else {
        // Update existing admin with new balances
        await this.updateUser(adminUser.id, {
          nairaBalance: "100000",
          usdtBalance: "100.00"
        });
      }

      // Add ₦100,000 to all users for testing
      const allUsers = await db.select().from(users);
      for (const user of allUsers) {
        const currentNaira = parseFloat(user.nairaBalance || "0");
        const currentUsdt = parseFloat(user.usdtBalance || "0");
        const newNairaBalance = currentNaira + 100000;

        await this.updateUser(user.id, {
          nairaBalance: newNairaBalance.toString(),
          usdtBalance: Math.max(currentUsdt, 100).toFixed(2)
        });
        console.log(`✅ Added ₦100,000 to ${user.email} - New balance: ₦${newNairaBalance.toLocaleString()}`);
      }

      // Create additional test users for offers
      let testUser1 = await this.getUserByEmail("trader1@example.com");
      if (!testUser1) {
        testUser1 = await this.createUser({
          email: "trader1@example.com",
          phone: "08011111111",
          password: "trader123",
          kycVerified: true,
          nairaBalance: "75000",
          usdtBalance: "40.00",
          bvn: "11111111111",
          tronAddress: "TRXTrader1111",
          averageRating: "4.8",
          ratingCount: 25
        });
        console.log("✅ Seeded trader1 user");
      }

      let testUser2 = await this.getUserByEmail("trader2@example.com");
      if (!testUser2) {
        testUser2 = await this.createUser({
          email: "trader2@example.com",
          phone: "08022222222",
          password: "trader123",
          kycVerified: true,
          nairaBalance: "120000",
          usdtBalance: "80.00",
          bvn: "22222222222",
          tronAddress: "TRXTrader2222",
          averageRating: "4.9",
          ratingCount: 42
        });
        console.log("✅ Seeded trader2 user");
      }

      // Always refresh offers to ensure they exist
      const existingOffers = await this.getOffers();
      console.log(`📊 Found ${existingOffers.length} existing offers`);

      if (existingOffers.length < 6) {
        // Clear existing data in correct order to avoid foreign key constraints
        await db.delete(messages); // Clear messages first
        await db.delete(trades);   // Then trades
        await db.delete(offers);   // Finally offers

        // Buy offers (users want to buy USDT)
        await this.createOffer({
          userId: testUser1.id,
          type: "buy",
          amount: "10.00",
          rate: "1485.00",
          paymentMethod: "bank_transfer"
        });

        await this.createOffer({
          userId: testUser2.id,
          type: "buy",
          amount: "25.00",
          rate: "1490.00",
          paymentMethod: "mobile_money"
        });

        await this.createOffer({
          userId: user1.id,
          type: "buy",
          amount: "5.00",
          rate: "1480.00",
          paymentMethod: "digital_wallet"
        });

        // Sell offers (users want to sell USDT)
        await this.createOffer({
          userId: testUser2.id,
          type: "sell",
          amount: "15.00",
          rate: "1475.00",
          paymentMethod: "bank_transfer"
        });

        await this.createOffer({
          userId: testUser1.id,
          type: "sell",
          amount: "30.00",
          rate: "1470.00",
          paymentMethod: "mobile_money"
        });

        await this.createOffer({
          userId: user1.id,
          type: "sell",
          amount: "8.00",
          rate: "1478.00",
          paymentMethod: "card_payment"
        });

        console.log("✅ Seeded 6 demo offers (3 buy, 3 sell)");
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        tronAddress: `TRX${Math.random().toString(36).substring(2, 15)}`,
        kycVerified: false,
        nairaBalance: "0",
        usdtBalance: "0",
        averageRating: "0",
        ratingCount: 0,
        isAdmin: false,
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

  // Offer methods
  async getOffers(): Promise<Offer[]> {
    return await db.select().from(offers).where(eq(offers.status, "active"));
  }

  async getOffer(id: number): Promise<Offer | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, id));
    return offer || undefined;
  }

  async getUserOffers(userId: number): Promise<Offer[]> {
    return await db
      .select()
      .from(offers)
      .where(eq(offers.userId, userId))
      .orderBy(desc(offers.createdAt));
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
    return await db.select().from(trades);
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade || undefined;
  }

  async getUserTrades(userId: number): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(or(eq(trades.buyerId, userId), eq(trades.sellerId, userId)))
      .orderBy(desc(trades.createdAt))
      .limit(20);
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const [trade] = await db
      .insert(trades)
      .values({
        ...insertTrade,
        status: "pending",
        escrowAddress: `TRX_ESCROW_${Math.random().toString(36).substring(2, 15)}`,
      })
      .returning();
    return trade;
  }

  async updateTradeStatus(tradeId: number, status: string) {
    await db.update(trades)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(trades.id, tradeId));
  }

  async updateTrade(id: number, updates: Partial<Trade>): Promise<Trade | undefined> {
    const [trade] = await db
      .update(trades)
      .set(updates)
      .where(eq(trades.id, id))
      .returning();
    return trade || undefined;
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

    async getUserMessages(userId: number): Promise<any[]> {
        // Implementation for retrieving user messages
        // Example:
        return await db.select().from(messages).where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId))).orderBy(desc(messages.createdAt));
    }

    async createDirectMessage(message: any): Promise<Message> {
        // Implementation for creating a direct message
        // Map messageText to message field and ensure required fields
        const messageData = {
            senderId: message.senderId,
            message: message.messageText || message.message || "", // Handle both field names
            tradeId: message.tradeId || null, // Set to null if not provided
            receiverId: message.receiverId || null // Optional field
        };
        
        const [newMessage] = await db.insert(messages).values(messageData).returning();
        return newMessage;
    }

  // Transaction methods
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...insertTransaction,
        status: "pending",
        paystackRef: `PSK_${Math.random().toString(36).substring(2, 15)}`,
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

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
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
      buyer: buyer ? { id: buyer.id, email: buyer.email } : null,
      seller: seller ? { id: seller.id, email: seller.email } : null,
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
        },
        seller: {
          id: sellerUser.id,
          email: sellerUser.email,
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