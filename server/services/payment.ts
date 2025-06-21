
export class PaymentService {
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_demo';
    this.baseUrl = 'https://api.paystack.co';
  }

  async initializeDeposit(email: string, amount: number, userId: number): Promise<any> {
    try {
      if (this.secretKey === 'sk_test_demo') {
        // Demo mode
        return {
          success: true,
          data: {
            authorization_url: '#demo-payment',
            access_code: 'demo_access_code',
            reference: `demo_${Date.now()}_${userId}`
          }
        };
      }

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // Convert to kobo
          currency: 'NGN',
          reference: `dep_${Date.now()}_${userId}`,
          callback_url: `${process.env.FRONTEND_URL}/dashboard`
        })
      });

      const data = await response.json();
      return {
        success: data.status,
        data: data.data
      };
    } catch (error) {
      console.error('Payment initialization error:', error);
      return {
        success: false,
        error: 'Payment service unavailable'
      };
    }
  }

  async verifyTransaction(reference: string): Promise<any> {
    try {
      if (this.secretKey === 'sk_test_demo') {
        // Demo mode - simulate successful payment
        return {
          success: true,
          data: {
            status: 'success',
            amount: 10000, // 100 NGN in kobo
            reference,
            paid_at: new Date().toISOString()
          }
        };
      }

      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`
        }
      });

      const data = await response.json();
      return {
        success: data.status,
        data: data.data
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: 'Verification failed'
      };
    }
  }
}

export const paymentService = new PaymentService();
