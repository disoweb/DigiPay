import { pgTable, text, varchar, serial, integer, boolean, timestamp, decimal, jsonb, index } from "drizzle-orm/pg-core";
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
  kycStatus: text("kyc_status").default("not_started"), // 'not_started', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected'
  kycSubmittedAt: timestamp("kyc_submitted_at"),
  kycApprovedAt: timestamp("kyc_approved_at"),
  kycRejectionReason: text("kyc_rejection_reason"),
  nairaBalance: decimal("naira_balance", { precision: 12, scale: 2 }).default("0"),
  usdtBalance: decimal("usdt_balance", { precision: 12, scale: 8 }).default("0"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: integer("rating_count").default(0),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// KYC verification data table
export const kycVerifications = pgTable("kyc_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),

  // Personal Information
  firstName: text("first_name"),
  lastName: text("last_name"),
  middleName: text("middle_name"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),

  // Address Information
  street: text("street"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("Nigeria"),
  postalCode: text("postal_code"),
  residentialType: text("residential_type"),

  // Identity Information
  idType: text("id_type"),
  idNumber: text("id_number"),
  nin: text("nin"),

  // Document URLs (stored in secure storage)
  idFrontUrl: text("id_front_url"),
  idBackUrl: text("id_back_url"),
  selfieUrl: text("selfie_url"),
  proofOfAddressUrl: text("proof_of_address_url"),

  // Verification status and metadata
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected'
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 8 }).notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'buy' or 'sell'
  status: text("status").default("active"), // 'active', 'inactive', 'completed'
  paymentMethod: text("payment_method").default("bank_transfer"),
  terms: text("terms"),
  minAmount: decimal("min_amount", { precision: 12, scale: 8 }),
  maxAmount: decimal("max_amount", { precision: 12, scale: 8 }),
  timeLimit: integer("time_limit").default(15), // minutes
  requiresVerification: boolean("requires_verification").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").references(() => offers.id),
  buyerId: integer("buyer_id").references(() => users.id),
  sellerId: integer("seller_id").references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  rate: decimal("rate", { precision: 12, scale: 2 }).notNull(),
  fiatAmount: decimal("fiat_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  escrowAddress: text("escrow_address"),
  paymentDeadline: timestamp("payment_deadline"),
  paymentReference: text("payment_reference"),
  paymentProof: text("payment_proof"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  status: text("status").default("pending"), // 'pending', 'completed', 'failed', 'approved', 'rejected'
  paystackRef: text("paystack_ref"),
  adminNotes: text("admin_notes"),
  paymentMethod: text("payment_method"),
  rate: text("rate"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").references(() => trades.id).notNull(),
  raterId: integer("rater_id").references(() => users.id).notNull(),
  ratedUserId: integer("rated_user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  categories: text("categories"), // JSON: {communication, speed, trustworthiness}
  isRecommended: boolean("is_recommended").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User reports and disputes
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").references(() => users.id).notNull(),
  reportedUserId: integer("reported_user_id").references(() => users.id).notNull(),
  tradeId: integer("trade_id").references(() => trades.id),
  type: text("type").notNull(), // 'fraud', 'harassment', 'fake_payment', 'other'
  description: text("description").notNull(),
  evidence: text("evidence"), // JSON array of file paths/URLs
  status: text("status").default("pending"), // 'pending', 'investigating', 'resolved', 'dismissed'
  adminNotes: text("admin_notes"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User payment methods
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'bank_transfer', 'mobile_money', 'digital_wallet'
  name: text("name").notNull(),
  details: text("details"), // JSON object with account details
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'trade_request', 'payment_received', 'dispute_opened', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON object with additional data
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  tronAddress: z.string().optional(),
  kycVerified: z.boolean().optional(),
  kycStatus: z.string().optional(),
  kycSubmittedAt: z.date().optional(),
  kycApprovedAt: z.date().optional(),
  kycRejectionReason: z.string().optional(),
  nairaBalance: z.string().optional(),
  usdtBalance: z.string().optional(),
  averageRating: z.string().optional(),
  ratingCount: z.number().optional(),
  isAdmin: z.boolean().optional(),
});

export const insertKycVerificationSchema = createInsertSchema(kycVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  amount: z.coerce.string(),
  rate: z.coerce.string(),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  status: true,
  escrowAddress: true,
}).extend({
  amount: z.coerce.string(),
  rate: z.coerce.string(),
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
export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycVerification = z.infer<typeof insertKycVerificationSchema>;
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