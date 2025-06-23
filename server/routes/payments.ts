import type { Express } from "express";
import { authenticateToken } from "../auth-jwt.js";
import { storage } from "../storage.js";
import { enhancedPaystackService } from "../services/enhanced-paystack.js";

export function registerPaymentRoutes(app: Express) {
  // Cancel pending deposit
  app.post("/api/payments/cancel-pending", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const pendingTransaction = await storage.getUserPendingDeposit(userId);
      if (!pendingTransaction) {
        return res.status(404).json({ 
          success: false, 
          message: "No pending deposit found" 
        });
      }

      await storage.updateTransaction(pendingTransaction.id, {
        status: 'cancelled',
        adminNotes: 'Cancelled by user'
      });

      console.log(`User ${userId} cancelled pending deposit ${pendingTransaction.id}`);

      res.json({ 
        success: true, 
        message: "Pending deposit cancelled successfully" 
      });

    } catch (error: any) {
      console.error("Cancel pending deposit error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to cancel pending deposit" 
      });
    }
  });

  // Get user's pending deposits
  app.get("/api/payments/pending", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const pendingTransaction = await storage.getUserPendingDeposit(userId);
      
      res.json({ 
        success: true, 
        pendingDeposit: pendingTransaction 
      });

    } catch (error: any) {
      console.error("Get pending deposits error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch pending deposits" 
      });
    }
  });
}