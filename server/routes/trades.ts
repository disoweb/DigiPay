
import { Router } from "express";
import { db, trades, offers, users } from "../db";
import { requireAuth } from "../auth";
import { eq, or, desc } from "drizzle-orm";
import { notificationService } from "../services/notification";

const router = Router();

// Get user's trades
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const userTrades = await db
      .select({
        id: trades.id,
        offerId: trades.offerId,
        buyerId: trades.buyerId,
        sellerId: trades.sellerId,
        amount: trades.amount,
        rate: trades.rate,
        status: trades.status,
        createdAt: trades.createdAt,
        completedAt: trades.completedAt,
        buyerEmail: users.email,
      })
      .from(trades)
      .leftJoin(users, eq(trades.buyerId, users.id))
      .where(or(eq(trades.buyerId, userId), eq(trades.sellerId, userId)))
      .orderBy(desc(trades.createdAt));

    res.json(userTrades);
  } catch (error) {
    console.error("Error fetching trades:", error);
    res.status(500).json({ error: "Failed to fetch trades" });
  }
});

// Create new trade
router.post("/", requireAuth, async (req, res) => {
  try {
    const { offerId, amount } = req.body;
    const buyerId = req.user!.id;

    if (!offerId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get offer details
    const offer = await db
      .select()
      .from(offers)
      .where(eq(offers.id, offerId))
      .limit(1);

    if (!offer.length || offer[0].status !== "active") {
      return res.status(404).json({ error: "Offer not found or inactive" });
    }

    if (offer[0].userId === buyerId) {
      return res.status(400).json({ error: "Cannot trade with yourself" });
    }

    const newTrade = await db
      .insert(trades)
      .values({
        offerId,
        buyerId,
        sellerId: offer[0].userId!,
        amount: amount.toString(),
        rate: offer[0].rate,
        status: "pending",
      })
      .returning();

    // Send notification
    const seller = await db
      .select()
      .from(users)
      .where(eq(users.id, offer[0].userId!))
      .limit(1);

    if (seller.length) {
      await notificationService.sendTradeNotification(
        seller[0].email,
        newTrade[0].id,
        "created"
      );
    }

    res.status(201).json(newTrade[0]);
  } catch (error) {
    console.error("Error creating trade:", error);
    res.status(500).json({ error: "Failed to create trade" });
  }
});

// Complete trade
router.patch("/:id/complete", requireAuth, async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    const userId = req.user!.id;

    const trade = await db
      .select()
      .from(trades)
      .where(eq(trades.id, tradeId))
      .limit(1);

    if (!trade.length) {
      return res.status(404).json({ error: "Trade not found" });
    }

    // Only seller can complete the trade
    if (trade[0].sellerId !== userId) {
      return res.status(403).json({ error: "Only seller can complete trade" });
    }

    await db
      .update(trades)
      .set({ 
        status: "completed",
        completedAt: new Date()
      })
      .where(eq(trades.id, tradeId));

    // Send notifications
    const [buyer, seller] = await Promise.all([
      db.select().from(users).where(eq(users.id, trade[0].buyerId!)).limit(1),
      db.select().from(users).where(eq(users.id, trade[0].sellerId!)).limit(1)
    ]);

    if (buyer.length) {
      await notificationService.sendTradeNotification(buyer[0].email, tradeId, "completed");
    }
    if (seller.length) {
      await notificationService.sendTradeNotification(seller[0].email, tradeId, "completed");
    }

    res.json({ message: "Trade completed successfully" });
  } catch (error) {
    console.error("Error completing trade:", error);
    res.status(500).json({ error: "Failed to complete trade" });
  }
});

export default router;
