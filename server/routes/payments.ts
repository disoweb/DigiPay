
import { Router } from "express";
import { db, transactions, users } from "../db";
import { requireAuth } from "../auth";
import { eq } from "drizzle-orm";
import { paymentService } from "../services/payment";
import { notificationService } from "../services/notification";

const router = Router();

// Initialize deposit
router.post("/deposit", requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user!.id;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: "Minimum deposit is ₦100" });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const paymentData = await paymentService.initializeDeposit(
      user[0].email,
      amount,
      userId
    );

    if (!paymentData.success) {
      return res.status(500).json({ error: "Failed to initialize payment" });
    }

    // Create transaction record
    await db.insert(transactions).values({
      userId,
      type: "deposit",
      amount: amount.toString(),
      status: "pending",
      paystackRef: paymentData.data.reference,
    });

    res.json(paymentData.data);
  } catch (error) {
    console.error("Error initializing deposit:", error);
    res.status(500).json({ error: "Failed to initialize deposit" });
  }
});

// Verify deposit
router.post("/verify-deposit", async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ error: "Reference is required" });
    }

    const verificationData = await paymentService.verifyTransaction(reference);

    if (!verificationData.success || verificationData.data.status !== 'success') {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Update transaction and user balance
    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.paystackRef, reference))
      .limit(1);

    if (!transaction.length) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction[0].status === 'completed') {
      return res.json({ message: "Transaction already processed" });
    }

    const amount = verificationData.data.amount / 100; // Convert from kobo

    await Promise.all([
      // Update transaction status
      db
        .update(transactions)
        .set({ status: "completed" })
        .where(eq(transactions.paystackRef, reference)),
      
      // Update user balance
      db
        .update(users)
        .set({ 
          nairaBalance: db.sql`naira_balance + ${amount}`
        })
        .where(eq(users.id, transaction[0].userId!))
    ]);

    // Send notification
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, transaction[0].userId!))
      .limit(1);

    if (user.length) {
      await notificationService.sendDepositNotification(user[0].email, amount);
    }

    res.json({ message: "Deposit successful", amount });
  } catch (error) {
    console.error("Error verifying deposit:", error);
    res.status(500).json({ error: "Failed to verify deposit" });
  }
});

export default router;
