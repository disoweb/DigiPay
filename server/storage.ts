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

  sessionStore: any;
}

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
        const bcrypt = require('bcrypt');
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
        const bcrypt = require('bcrypt');
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

      // Update any existing users to have minimum balances
      const allUsers = await db.select().from(users);
      for (const user of allUsers) {
        const currentNaira = parseFloat(user.nairaBalance || "0");
        const currentUsdt = parseFloat(user.usdtBalance || "0");

        if (currentNaira < 10000 || currentUsdt < 100) {
          await this.updateUser(user.id, {
            nairaBalance: Math.max(currentNaira, 10000).toString(),
            usdtBalance: Math.max(currentUsdt, 100).toFixed(2)
          });
          console.log(`✅ Updated ${user.email} with minimum balances`);
        }
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
        // Clear existing trades first, then offers to avoid foreign key constraint
        await db.delete(trades);
        await db.delete(offers);

        // Buy offers (users want to buy USDT)
        await this.createOffer({
          userId: testUser1.id,
          type: "buy",
          amount: "10.00",
          rate: "1485.00"
        });

        await this.createOffer({
          userId: testUser2.id,
          type: "buy",
          amount: "25.00",
          rate: "1490.00"
        });

        await this.createOffer({
          userId: testUser1.id,
          type: "buy",
          amount: "5.00",
          rate: "1480.00"
        });

        // Sell offers (users want to sell USDT)
        await this.createOffer({
          userId: testUser2.id,
          type: "sell",
          amount: "15.00",
          rate: "1475.00"
        });

        await this.createOffer({
          userId: testUser1.id,
          type: "sell",
          amount: "30.00",
          rate: "1470.00"
        });

        await this.createOffer({
          userId: testUser2.id,
          type: "sell",
          amount: "8.00",
          rate: "1478.00"
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
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
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
    return await db.select().from(offers).where(eq(offers.userId, userId));
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const [offer] = await db
      .insert(offers)
      .values({ ...insertOffer, status: "active" })
      .returning();
    return offer;
  }

  async updateOffer(id: number, updates: Partial<Offer>): Promise<Offer | undefined> {
    const [offer] = await db
      .update(offers)
      .set(updates)
      .where(eq(offers.id, id))
      .returning();
    return offer || undefined;
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
    return await db.select().from(trades).where(or(eq(trades.buyerId, userId), eq(trades.sellerId, userId)));
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

}

export const storage = new DatabaseStorage();