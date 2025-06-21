import { 
  users, offers, trades, messages, transactions, ratings,
  type User, type InsertUser, type Offer, type InsertOffer,
  type Trade, type InsertTrade, type Message, type InsertMessage,
  type Transaction, type InsertTransaction, type Rating, type InsertRating
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private offers: Map<number, Offer>;
  private trades: Map<number, Trade>;
  private messages: Map<number, Message>;
  private transactions: Map<number, Transaction>;
  private ratings: Map<number, Rating>;
  private currentUserId: number;
  private currentOfferId: number;
  private currentTradeId: number;
  private currentMessageId: number;
  private currentTransactionId: number;
  private currentRatingId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.offers = new Map();
    this.trades = new Map();
    this.messages = new Map();
    this.transactions = new Map();
    this.ratings = new Map();
    this.currentUserId = 1;
    this.currentOfferId = 1;
    this.currentTradeId = 1;
    this.currentMessageId = 1;
    this.currentTransactionId = 1;
    this.currentRatingId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create admin user
    const adminUser: User = {
      id: 1,
      email: "admin@digipay.com",
      password: "$2b$10$8YxNQZ9YzQxNkQxNkQxNkO1YxNQZ9YzQxNkQxNkQxNkO1YxNQZ9Y", // "admin123"
      phone: "+2341234567890",
      bvn: "12345678901",
      tronAddress: "TRX123456789",
      kycVerified: true,
      nairaBalance: "1000000",
      usdtBalance: "5000",
      averageRating: "5.0",
      ratingCount: 100,
      isAdmin: true,
      createdAt: new Date(),
    };
    this.users.set(1, adminUser);
    this.currentUserId = 2;

    // Create sample regular user
    const sampleUser: User = {
      id: 2,
      email: "john@example.com",
      password: "$2b$10$8YxNQZ9YzQxNkQxNkQxNkO1YxNQZ9YzQxNkQxNkQxNkO1YxNQZ9Y", // "password123"
      phone: "+2349876543210",
      bvn: "09876543210",
      tronAddress: "TRX987654321",
      kycVerified: true,
      nairaBalance: "567890",
      usdtBalance: "1245.67",
      averageRating: "4.8",
      ratingCount: 45,
      isAdmin: false,
      createdAt: new Date(),
    };
    this.users.set(2, sampleUser);
    this.currentUserId = 3;

    // Create sample offers
    const offers: Offer[] = [
      {
        id: 1,
        userId: 2,
        amount: "1000",
        rate: "1485",
        type: "sell",
        status: "active",
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 2,
        amount: "500",
        rate: "1478",
        type: "buy",
        status: "active",
        createdAt: new Date(),
      },
    ];
    offers.forEach(offer => this.offers.set(offer.id, offer));
    this.currentOfferId = 3;

    // Create sample trade
    const sampleTrade: Trade = {
      id: 1,
      offerId: 1,
      buyerId: 1,
      sellerId: 2,
      amount: "200",
      rate: "1480",
      status: "pending",
      escrowAddress: "TRX_ESCROW_123",
      createdAt: new Date(),
    };
    this.trades.set(1, sampleTrade);
    this.currentTradeId = 2;

    // Create sample messages
    const messages: Message[] = [
      {
        id: 1,
        tradeId: 1,
        senderId: 2,
        message: "Hello! Please make the payment and let me know when done.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: 2,
        tradeId: 1,
        senderId: 1,
        message: "Sure, making the payment now. Will share receipt shortly.",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ];
    messages.forEach(message => this.messages.set(message.id, message));
    this.currentMessageId = 3;

    // Create sample transactions
    const transactions: Transaction[] = [
      {
        id: 1,
        userId: 2,
        type: "deposit",
        amount: "50000",
        status: "completed",
        paystackRef: "PSK_12345",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: 2,
        userId: 2,
        type: "withdrawal",
        amount: "100000",
        status: "completed",
        paystackRef: null,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    ];
    transactions.forEach(transaction => this.transactions.set(transaction.id, transaction));
    this.currentTransactionId = 3;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      tronAddress: `TRX${Math.random().toString(36).substring(2, 15)}`,
      kycVerified: false,
      nairaBalance: "0",
      usdtBalance: "0",
      averageRating: "0",
      ratingCount: 0,
      isAdmin: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Offer methods
  async getOffers(): Promise<Offer[]> {
    return Array.from(this.offers.values()).filter(offer => offer.status === "active");
  }

  async getOffer(id: number): Promise<Offer | undefined> {
    return this.offers.get(id);
  }

  async getUserOffers(userId: number): Promise<Offer[]> {
    return Array.from(this.offers.values()).filter(offer => offer.userId === userId);
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const id = this.currentOfferId++;
    const offer: Offer = {
      ...insertOffer,
      id,
      status: "active",
      createdAt: new Date(),
    };
    this.offers.set(id, offer);
    return offer;
  }

  async updateOffer(id: number, updates: Partial<Offer>): Promise<Offer | undefined> {
    const offer = this.offers.get(id);
    if (!offer) return undefined;
    
    const updatedOffer = { ...offer, ...updates };
    this.offers.set(id, updatedOffer);
    return updatedOffer;
  }

  // Trade methods
  async getTrades(): Promise<Trade[]> {
    return Array.from(this.trades.values());
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async getUserTrades(userId: number): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(
      trade => trade.buyerId === userId || trade.sellerId === userId
    );
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    const trade: Trade = {
      ...insertTrade,
      id,
      status: "pending",
      escrowAddress: `TRX_ESCROW_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date(),
    };
    this.trades.set(id, trade);
    return trade;
  }

  async updateTrade(id: number, updates: Partial<Trade>): Promise<Trade | undefined> {
    const trade = this.trades.get(id);
    if (!trade) return undefined;
    
    const updatedTrade = { ...trade, ...updates };
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }

  // Message methods
  async getTradeMessages(tradeId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.tradeId === tradeId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  // Transaction methods
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      status: "pending",
      paystackRef: `PSK_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...updates };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Rating methods
  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = this.currentRatingId++;
    const rating: Rating = {
      ...insertRating,
      id,
      createdAt: new Date(),
    };
    this.ratings.set(id, rating);

    // Update user's average rating
    const userRatings = Array.from(this.ratings.values())
      .filter(r => r.ratedUserId === insertRating.ratedUserId);
    
    const avgRating = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length;
    
    await this.updateUser(insertRating.ratedUserId, {
      averageRating: avgRating.toFixed(2),
      ratingCount: userRatings.length,
    });

    return rating;
  }

  async getUserRatings(userId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(rating => rating.ratedUserId === userId);
  }
}

export const storage = new MemStorage();
