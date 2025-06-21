import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { integer, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Additional tables for the complete DigiPay system
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => schema.users.id),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  rate: numeric("rate", { precision: 18, scale: 2 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // 'buy' or 'sell'
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").references(() => offers.id),
  buyerId: integer("buyer_id").references(() => schema.users.id),
  sellerId: integer("seller_id").references(() => schema.users.id),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  rate: numeric("rate", { precision: 18, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  escrowAddress: varchar("escrow_address", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").references(() => trades.id),
  raterId: integer("rater_id").references(() => schema.users.id),
  ratedUserId: integer("rated_user_id").references(() => schema.users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").references(() => trades.id),
  senderId: integer("sender_id").references(() => schema.users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export async function createTables() {
await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      bvn VARCHAR(11),
      tron_address VARCHAR(100),
      phone VARCHAR(20),
      kyc_verified BOOLEAN DEFAULT FALSE,
      naira_balance DECIMAL(18,2) DEFAULT 0,
      usdt_balance DECIMAL(18,6) DEFAULT 0,
      average_rating DECIMAL(3,2) DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(18,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      paystack_ref VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS offers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      amount DECIMAL(18,6) NOT NULL,
      rate DECIMAL(18,2) NOT NULL,
      type VARCHAR(10) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      offer_id INTEGER REFERENCES offers(id),
      buyer_id INTEGER REFERENCES users(id),
      seller_id INTEGER REFERENCES users(id),
      amount DECIMAL(18,6) NOT NULL,
      rate DECIMAL(18,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      escrow_address VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      trade_id INTEGER REFERENCES trades(id),
      rater_id INTEGER REFERENCES users(id),
      rated_user_id INTEGER REFERENCES users(id),
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      trade_id INTEGER REFERENCES trades(id),
      sender_id INTEGER REFERENCES users(id),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}