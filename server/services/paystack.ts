import axios from 'axios';

export interface InitializePaymentResponse {
  success: boolean;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
  message?: string;
}

export interface VerifyPaymentResponse {
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
  };
  message?: string;
}

export interface TransferResponse {
  success: boolean;
  data?: {
    transfer_code: string;
    id: number;
    amount: number;
    status: string;
  };
  message?: string;
}

export class PaystackService {
  private secretKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    if (!this.secretKey) {
      console.warn('PAYSTACK_SECRET_KEY not found in environment variables');
    }
  }

  async initializePayment(
    email: string,
    amount: number,
    reference: string,
    callbackUrl?: string
  ): Promise<InitializePaymentResponse> {
    if (!this.secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email,
          amount: amount * 100, // Paystack expects amount in kobo
          reference,
          currency: 'NGN',
          callback_url: callbackUrl
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.status,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Paystack payment initialization error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Payment initialization failed'
      };
    }
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    if (!this.secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: response.data.status,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Paystack payment verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Payment verification failed'
      };
    }
  }

  async initiateTransfer(
    amount: number,
    accountNumber: string,
    bankCode: string,
    accountName: string,
    reason: string
  ): Promise<TransferResponse> {
    if (!this.secretKey) {
      throw new Error('Paystack secret key not configured');
    }

    try {
      // First create transfer recipient
      const recipientResponse = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        {
          type: 'nuban',
          name: accountName,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: 'NGN'
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!recipientResponse.data.status) {
        throw new Error('Failed to create transfer recipient');
      }

      // Then initiate transfer
      const transferResponse = await axios.post(
        `${this.baseUrl}/transfer`,
        {
          source: 'balance',
          amount: amount * 100, // Convert to kobo
          recipient: recipientResponse.data.data.recipient_code,
          reason
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: transferResponse.data.status,
        data: transferResponse.data.data,
        message: transferResponse.data.message
      };
    } catch (error: any) {
      console.error('Paystack transfer error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Transfer initiation failed'
      };
    }
  }
}

export const paystackService = new PaystackService();