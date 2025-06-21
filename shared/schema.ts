import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  bvn: text("bvn"),
  tronAddress: text("tron_address"),
  kycVerified: boolean("kyc_verified").default(false),
  nairaBalance: decimal("naira_balance", { precision: 12, scale: 2 }).default("0"),
  usdtBalance: decimal("usdt_balance", { precision: 12, scale: 8 }).default("0"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: integer("rating_count").default(0),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 8 }).notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'buy' or 'sell'
  status: text("status").default("active"), // 'active', 'inactive', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").references(() => offers.id).notNull(),
  buyerId: integer("buyer_id").references(() => users.id).notNull(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 8 }).notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // 'pending', 'completed', 'cancelled', 'disputed'
  escrowAddress: text("escrow_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").references(() => trades.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'deposit', 'withdrawal'
  amount: text("amount").notNull(),
  status: text("status").default("pending"), // 'pending', 'completed', 'failed'
  paystackRef: text("paystack_ref"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").references(() => trades.id).notNull(),
  raterId: integer("rater_id").references(() => users.id).notNull(),
  ratedUserId: integer("rated_user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  tronAddress: true,
  kycVerified: true,
  nairaBalance: true,
  usdtBalance: true,
  averageRating: true,
  ratingCount: true,
  isAdmin: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  status: true,
  escrowAddress: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  paystackRef: z.string().optional(),
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;