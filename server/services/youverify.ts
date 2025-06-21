import axios from 'axios';

export interface VerifyBVNResponse {
  success: boolean;
  data?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phoneNumber: string;
    enrollmentBank: string;
    enrollmentBranch: string;
  };
  message?: string;
}

export class YouVerifyService {
  private apiKey: string;
  private baseUrl = 'https://api.youverify.co/v2';

  constructor() {
    this.apiKey = process.env.YOUVERIFY_API_KEY || '';
  }

  async verifyBVN(bvn: string, firstName: string, lastName: string): Promise<VerifyBVNResponse> {
    if (!this.apiKey) {
      throw new Error('YouVerify API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/identity/ng/bvn`,
        {
          id: bvn,
          firstName,
          lastName,
          isSubjectConsent: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Token': this.apiKey
          }
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('YouVerify BVN verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'BVN verification failed'
      };
    }
  }
}

export const youVerifyService = new YouVerifyService();