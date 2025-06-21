
import { Router } from "express";
import { db, offers, users } from "../db";
import { requireAuth } from "../auth";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Get all active offers
router.get("/", async (req, res) => {
  try {
    const allOffers = await db
      .select({
        id: offers.id,
        userId: offers.userId,
        amount: offers.amount,
        rate: offers.rate,
        type: offers.type,
        status: offers.status,
        createdAt: offers.createdAt,
        userEmail: users.email,
        userRating: users.averageRating,
        userRatingCount: users.ratingCount,
      })
      .from(offers)
      .leftJoin(users, eq(offers.userId, users.id))
      .where(eq(offers.status, "active"))
      .orderBy(desc(offers.createdAt));

    res.json(allOffers);
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

// Create new offer
router.post("/", requireAuth, async (req, res) => {
  try {
    const { amount, rate, type } = req.body;
    const userId = req.user!.id;

    if (!amount || !rate || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (type !== "buy" && type !== "sell") {
      return res.status(400).json({ error: "Type must be 'buy' or 'sell'" });
    }

    const newOffer = await db
      .insert(offers)
      .values({
        userId,
        amount: amount.toString(),
        rate: rate.toString(),
        type,
        status: "active",
      })
      .returning();

    res.status(201).json(newOffer[0]);
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ error: "Failed to create offer" });
  }
});

// Delete offer
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const offerId = parseInt(req.params.id);
    const userId = req.user!.id;

    const offer = await db
      .select()
      .from(offers)
      .where(eq(offers.id, offerId))
      .limit(1);

    if (!offer.length) {
      return res.status(404).json({ error: "Offer not found" });
    }

    if (offer[0].userId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db
      .update(offers)
      .set({ status: "cancelled" })
      .where(eq(offers.id, offerId));

    res.json({ message: "Offer cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling offer:", error);
    res.status(500).json({ error: "Failed to cancel offer" });
  }
});

export default router;
