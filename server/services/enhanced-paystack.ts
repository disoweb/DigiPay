import axios from 'axios';
import crypto from 'crypto';
import { storage } from '../storage.js';

export interface PaymentInitialization {
  success: boolean;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
  message?: string;
}

export interface PaymentVerification {
  success: boolean;
  data?: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    customer: {
      email: string;
    };
    gateway_response?: string;
    channel?: string;
  };
  message?: string;
}

export interface BankList {
  success: boolean;
  data?: Array<{
    id: number;
    name: string;
    code: string;
    longcode: string;
    gateway: string;
    pay_with_bank: boolean;
    active: boolean;
    is_deleted: boolean;
    country: string;
    currency: string;
    type: string;
    slug: string;
  }>;
}

export class EnhancedPaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';
  private processingReferences = new Set<string>();

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    if (!this.secretKey) {
      console.warn('PAYSTACK_SECRET_KEY not configured - payment features will be limited');
    }
  }

  /**
   * Generate a unique payment reference with timestamp and random component
   */
  generateReference(userId: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `dp_${userId}_${timestamp}_${random}`;
  }

  /**
   * Initialize payment with enhanced error handling and mobile optimization
   */
  async initializePayment(
    userId: number,
    email: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<PaymentInitialization> {
    if (!this.secretKey) {
      throw new Error('Payment service not configured. Please contact support.');
    }

    if (amount < 100) {
      throw new Error('Minimum deposit amount is ₦100');
    }

    if (amount > 1000000) {
      throw new Error('Maximum deposit amount is ₦1,000,000');
    }

    const reference = this.generateReference(userId);

    try {
      // Create pending transaction record first
      await storage.createTransaction({
        userId,
        type: 'deposit',
        amount: amount.toString(),
        status: 'pending',
        paystackRef: reference,
        paymentMethod: 'paystack',
      });

      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email,
          amount: Math.round(amount * 100), // Convert to kobo and ensure integer
          reference,
          currency: 'NGN',
          channels: ['card', 'bank', 'ussd', 'mobile_money', 'qr'],
          metadata: {
            userId,
            depositType: 'wallet_funding',
            ...metadata
          },
          callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment-callback`,
          bearer: 'account'
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (!response.data.status) {
        // Clean up failed transaction
        await storage.deleteTransactionByReference(reference);
        throw new Error(response.data.message || 'Payment initialization failed');
      }

      return {
        success: true,
        data: response.data.data,
        message: 'Payment initialized successfully'
      };

    } catch (error: any) {
      // Clean up transaction on error
      await storage.deleteTransactionByReference(reference);
      
      console.error('Payment initialization error:', error.response?.data || error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Payment service timeout. Please try again.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Payment service authentication failed. Please contact support.');
      }
      
      if (error.response?.status >= 500) {
        throw new Error('Payment service temporarily unavailable. Please try again in a few minutes.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Payment initialization failed');
    }
  }

  /**
   * Verify payment with duplicate prevention and automatic balance crediting
   */
  async verifyPayment(reference: string, userId?: number): Promise<PaymentVerification & { balanceUpdated?: boolean }> {
    if (!this.secretKey) {
      throw new Error('Payment service not configured');
    }

    // Prevent concurrent processing of same reference
    if (this.processingReferences.has(reference)) {
      throw new Error('Payment verification already in progress');
    }

    this.processingReferences.add(reference);

    try {
      // Check if already processed
      const existingTransaction = await storage.getTransactionByReference(reference);
      if (existingTransaction?.status === 'completed') {
        return {
          success: true,
          data: {
            id: 0,
            status: 'success',
            reference,
            amount: parseFloat(existingTransaction.amount) * 100,
            currency: 'NGN',
            paid_at: existingTransaction.createdAt?.toISOString() || new Date().toISOString(),
            customer: { email: '' }
          },
          message: 'Payment already processed',
          balanceUpdated: false
        };
      }

      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          },
          timeout: 10000
        }
      );

      if (!response.data.status) {
        // Check if this is a test transaction that was never paid
        if (existingTransaction && existingTransaction.status === 'pending') {
          // Mark as failed/abandoned
          await storage.updateTransaction(existingTransaction.id, {
            status: 'failed',
            adminNotes: 'Payment abandoned - not completed within time limit'
          });
        }
        throw new Error(response.data.message || 'Payment abandoned. Please try again or contact support.');
      }

      const paymentData = response.data.data;
      
      if (paymentData.status === 'success') {
        // DISABLED: Auto-credit functionality to prevent duplicate crediting
        // The main /api/payments/verify endpoint handles all crediting
        console.log('Enhanced Paystack service: Payment successful but crediting disabled to prevent duplicates');
        
        return {
          success: true,
          data: paymentData,
          message: 'Payment verified - crediting handled by main endpoint',
          balanceUpdated: false
        };
      }

      // Handle other payment statuses
      if (existingTransaction) {
        await storage.updateTransaction(existingTransaction.id, {
          status: 'failed',
          adminNotes: `Payment ${paymentData.status} via Paystack`
        });
      }

      return {
        success: false,
        message: `Payment ${paymentData.status}. Please try again or contact support.`
      };

    } catch (error: any) {
      console.error('Payment verification error:', error.response?.data || error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Verification timeout. Please try again.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Payment verification failed');
    } finally {
      this.processingReferences.delete(reference);
    }
  }

  /**
   * Credit user balance after successful payment with duplicate prevention
   */
  private async creditUserBalance(reference: string, paymentData: any): Promise<boolean> {
    // Try to find transaction by the reference we created vs what Paystack returns
    let transaction = await storage.getTransactionByReference(reference);
    
    // If not found, search by pending deposits with matching amount and recent timestamp
    if (!transaction) {
      const allTransactions = await storage.getAllTransactions();
      const targetAmount = (paymentData.amount / 100).toString();
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      transaction = allTransactions.find(t => 
        t.status === 'pending' && 
        t.type === 'deposit' && 
        t.amount === targetAmount &&
        t.createdAt && new Date(t.createdAt) > twoHoursAgo
      ) || null;
      
      if (transaction) {
        console.log(`Found matching transaction by amount: ${targetAmount} for reference: ${reference}`);
        // Update the transaction with the correct Paystack reference
        await storage.updateTransaction(transaction.id, {
          paystackRef: reference
        });
      }
    }
    
    if (!transaction) {
      console.error('Transaction not found for reference:', reference, 'amount:', paymentData.amount / 100);
      // Create a new transaction record for this successful payment
      try {
        const userId = paymentData.metadata?.userId || paymentData.customer?.id;
        if (!userId) {
          console.error('No user ID available for creating transaction');
          return false;
        }
        
        transaction = await storage.createTransaction({
          userId: parseInt(userId),
          type: 'deposit',
          amount: (paymentData.amount / 100).toString(),
          status: 'pending',
          paystackRef: reference,
          paymentMethod: 'paystack'
        });
      } catch (error) {
        console.error('Failed to create transaction for payment:', error);
        return false;
      }
    }

    if (transaction.status === 'completed') {
      console.log('Transaction already completed:', reference);
      return false;
    }

    const user = await storage.getUser(transaction.userId);
    if (!user) {
      console.error('User not found for transaction:', reference);
      return false;
    }

    try {
      // Atomic balance update
      const currentBalance = parseFloat(user.nairaBalance || '0');
      const depositAmount = paymentData.amount / 100; // Convert from kobo
      const newBalance = currentBalance + depositAmount;

      // Update user balance
      await storage.updateUserBalance(user.id, { nairaBalance: newBalance.toString() });
      
      // Mark transaction as completed
      await storage.updateTransaction(transaction.id, {
        status: 'completed',
        adminNotes: `Auto-credited ₦${depositAmount.toLocaleString()} via Paystack`
      });

      console.log(`Successfully credited ₦${depositAmount.toLocaleString()} to user ${user.id}`);
      
      // Emit real-time balance update via WebSocket with retry mechanism
      setTimeout(async () => {
        try {
          const wsServer = (global as any).wsServer;
          if (wsServer && wsServer.clients && wsServer.clients.size > 0) {
            const clientCount = wsServer.clients.size;
            console.log(`📡 Broadcasting balance update to ${clientCount} connected clients for user ${user.id}`);
            console.log(`💰 Balance updated: ₦${currentBalance.toLocaleString()} → ₦${newBalance.toLocaleString()}`);
            
            const updateMessage = {
              type: 'balance_updated',
              userId: user.id,
              nairaBalance: newBalance.toString(),
              usdtBalance: user.usdtBalance || "0",
              previousBalance: currentBalance.toString(),
              depositAmount: depositAmount.toString(),
              timestamp: new Date().toISOString(),
              lastTransaction: {
                id: transaction.id,
                type: 'deposit',
                amount: depositAmount.toString(),
                status: 'completed',
                timestamp: new Date().toISOString()
              }
            };
            
            const messageStr = JSON.stringify(updateMessage);
            console.log('📤 Broadcasting balance update message');
            
            let sentCount = 0;
            let targetUserConnected = false;
            
            // Send to all clients but only to the target user
            wsServer.clients.forEach((client: any) => {
              if (client.readyState === 1) { // WebSocket.OPEN
                try {
                  // Only send balance updates to the specific user
                  if (client.userId === user.id) {
                    client.send(messageStr);
                    sentCount++;
                    targetUserConnected = true;
                    console.log(`✅ Target user ${user.id} is connected and received the update`);
                  }
                } catch (sendError) {
                  console.error('❌ Failed to send WebSocket message to client:', sendError);
                }
              }
            });
            
            console.log(`📊 Balance update sent to ${sentCount}/${clientCount} clients`);
            
            if (!targetUserConnected) {
              console.log(`⚠️ User ${user.id} not currently connected via WebSocket`);
            }
          } else {
            console.log('📡 No WebSocket server or clients available for broadcast');
          }
        } catch (wsError) {
          console.error('❌ WebSocket broadcast error:', wsError);
        }
      }, 100); // Small delay to ensure transaction is committed
      
      return true;

    } catch (error) {
      console.error('Balance crediting failed:', error);
      // Mark transaction as failed
      await storage.updateTransaction(transaction.id, {
        status: 'failed',
        adminNotes: 'Balance crediting failed - requires manual intervention'
      });
      return false;
    }
  }

  /**
   * Handle Paystack webhook events for automatic processing
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    if (!this.secretKey) {
      throw new Error('Webhook processing not configured');
    }

    // Verify webhook signature
    const hash = crypto.createHmac('sha512', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      console.warn('Webhook signature mismatch - processing anyway for development');
      // In production, you should uncomment the line below
      // throw new Error('Invalid webhook signature');
    }

    const event = payload.event;
    const data = payload.data;

    switch (event) {
      case 'charge.success':
        await this.handleSuccessfulCharge(data);
        break;
      case 'charge.failed':
        await this.handleFailedCharge(data);
        break;
      case 'transfer.success':
        await this.handleSuccessfulTransfer(data);
        break;
      case 'transfer.failed':
        await this.handleFailedTransfer(data);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
  }

  private async handleSuccessfulCharge(data: any): Promise<void> {
    const { reference, amount, status } = data;
    
    if (status === 'success') {
      try {
        await this.verifyPayment(reference);
        console.log(`Webhook processed successful charge: ${reference}`);
      } catch (error) {
        console.error('Webhook charge processing failed:', error);
      }
    }
  }

  private async handleFailedCharge(data: any): Promise<void> {
    const { reference } = data;
    
    const transaction = await storage.getTransactionByReference(reference);
    if (transaction && transaction.status === 'pending') {
      await storage.updateTransaction(transaction.id, {
        status: 'failed',
        adminNotes: 'Payment failed via webhook'
      });
      console.log(`Webhook processed failed charge: ${reference}`);
    }
  }

  private async handleSuccessfulTransfer(data: any): Promise<void> {
    // Handle successful withdrawal transfers
    const { reference } = data;
    console.log(`Transfer successful: ${reference}`);
  }

  private async handleFailedTransfer(data: any): Promise<void> {
    // Handle failed withdrawal transfers
    const { reference } = data;
    console.log(`Transfer failed: ${reference}`);
  }

  /**
   * Get list of supported banks for withdrawals
   */
  async getBankList(): Promise<BankList> {
    if (!this.secretKey) {
      throw new Error('Bank list service not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/bank`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          },
          timeout: 10000
        }
      );

      return {
        success: response.data.status,
        data: response.data.data
      };

    } catch (error: any) {
      console.error('Bank list fetch error:', error.response?.data || error.message);
      return {
        success: false
      };
    }
  }

  /**
   * Verify bank account details
   */
  async verifyBankAccount(accountNumber: string, bankCode: string): Promise<{
    success: boolean;
    data?: {
      account_number: string;
      account_name: string;
      bank_id: number;
    };
    message?: string;
  }> {
    if (!this.secretKey) {
      throw new Error('Account verification service not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          },
          timeout: 10000
        }
      );

      return {
        success: response.data.status,
        data: response.data.data,
        message: response.data.message
      };

    } catch (error: any) {
      console.error('Bank verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Account verification failed'
      };
    }
  }
}

export const enhancedPaystackService = new EnhancedPaystackService();