import type { Express } from "express";
import { authenticateToken } from "../auth-jwt.js";
import { storage } from "../storage.js";

export function registerTestPaymentRoutes(app: Express) {
  // Test payment completion (for demo purposes)
  app.post("/api/payments/test-complete", authenticateToken, async (req, res) => {
    try {
      const { reference } = req.body;
      const userId = req.user!.id;
      
      if (!reference) {
        return res.status(400).json({ 
          success: false, 
          message: "Payment reference is required" 
        });
      }

      const transaction = await storage.getTransactionByReference(reference);
      if (!transaction) {
        return res.status(404).json({ 
          success: false, 
          message: "Transaction not found" 
        });
      }

      if (transaction.userId !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: "Unauthorized access to transaction" 
        });
      }

      if (transaction.status !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          message: `Transaction is already ${transaction.status}` 
        });
      }

      // Simulate successful payment completion
      const depositAmount = parseFloat(transaction.amount);
      
      // Update user balance
      const user = await storage.getUser(userId);
      if (user) {
        const currentBalance = parseFloat(user.nairaBalance || '0');
        const newBalance = currentBalance + depositAmount;
        
        await storage.updateUserBalance(userId, { 
          nairaBalance: newBalance.toString() 
        });
        
        // Mark transaction as completed
        await storage.updateTransaction(transaction.id, {
          status: 'completed',
          adminNotes: 'Test payment completed successfully'
        });

        console.log(`Test payment completed: ₦${depositAmount.toLocaleString()} credited to user ${userId}`);

        res.json({
          success: true,
          data: {
            status: 'success',
            reference,
            amount: depositAmount * 100, // Return in kobo for consistency
            currency: 'NGN',
            paid_at: new Date().toISOString(),
            customer: { email: user.email }
          },
          message: 'Test payment completed and balance updated',
          balanceUpdated: true
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

    } catch (error: any) {
      console.error("Test payment completion error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to complete test payment" 
      });
    }
  });

  // Get test payment status
  app.get("/api/payments/test-status/:reference", authenticateToken, async (req, res) => {
    try {
      const { reference } = req.params;
      const userId = req.user!.id;
      
      const transaction = await storage.getTransactionByReference(reference);
      if (!transaction) {
        return res.status(404).json({ 
          success: false, 
          message: "Transaction not found" 
        });
      }

      if (transaction.userId !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: "Unauthorized access to transaction" 
        });
      }

      res.json({
        success: true,
        transaction: {
          id: transaction.id,
          reference: transaction.paystackRef,
          amount: transaction.amount,
          status: transaction.status,
          createdAt: transaction.createdAt,
          adminNotes: transaction.adminNotes
        }
      });

    } catch (error: any) {
      console.error("Test payment status error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to get payment status" 
      });
    }
  });
}