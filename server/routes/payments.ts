import type { Express } from "express";
import { authenticateToken } from "../auth-jwt.js";
import { storage } from "../storage.js";
import { enhancedPaystackService } from "../services/enhanced-paystack.js";

export function registerPaymentRoutes(app: Express) {
  // Cancel pending deposit (no-op since we removed restrictions)
  app.post("/api/payments/cancel-pending", authenticateToken, async (req, res) => {
    try {
      res.json({ 
        success: true, 
        message: "No pending deposit restrictions to cancel" 
      });
    } catch (error: any) {
      console.error("Cancel pending deposit error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process request" 
      });
    }
  });

  // Get user's pending deposits (disabled - no restrictions)
  app.get("/api/payments/pending", authenticateToken, async (req, res) => {
    res.json({ 
      success: true, 
      pendingDeposit: null
    });
  });
}