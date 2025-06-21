
export class KYCService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.YOUVERIFY_API_KEY || 'demo_key';
    this.baseUrl = 'https://api.youverify.co/v2';
  }

  async verifyBVN(bvn: string, firstName: string, lastName: string): Promise<any> {
    try {
      if (this.apiKey === 'demo_key') {
        // Demo mode - simulate successful verification
        return {
          success: true,
          verified: true,
          data: {
            bvn,
            firstName,
            lastName,
            dateOfBirth: '1990-01-01',
            phoneNumber: '+2341234567890'
          }
        };
      }

      const response = await fetch(`${this.baseUrl}/identities/bvn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.apiKey
        },
        body: JSON.stringify({
          id: bvn,
          firstName,
          lastName
        })
      });

      const data = await response.json();
      return {
        success: response.ok,
        verified: data.success === true,
        data: data.data
      };
    } catch (error) {
      console.error('BVN verification error:', error);
      return {
        success: false,
        verified: false,
        error: 'Verification service unavailable'
      };
    }
  }
}

export const kycService = new KYCService();
