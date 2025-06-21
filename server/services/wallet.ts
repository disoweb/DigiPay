
import TronWeb from 'tronweb';

export class WalletService {
  private tronWeb: any;
  private usdtContractAddress: string;

  constructor() {
    try {
      this.tronWeb = new TronWeb({
        fullHost: 'https://api.trongrid.io',
        headers: { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY || 'demo' },
        privateKey: process.env.TRON_PRIVATE_KEY || '01'.repeat(32)
      });
      this.usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    } catch (error) {
      console.error('TronWeb initialization error (using demo mode):', error);
      // Initialize with demo values for development
      this.tronWeb = null;
      this.usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    }
  }

  generateWallet() {
    try {
      if (!this.tronWeb) {
        // Demo mode - generate fake wallet
        const demoAddress = 'TDemo' + Math.random().toString(36).substring(2, 15);
        const demoPrivateKey = '01'.repeat(32);
        return {
          address: demoAddress,
          privateKey: demoPrivateKey
        };
      }

      const account = this.tronWeb.createAccount();
      return {
        address: account.address.base58,
        privateKey: account.privateKey
      };
    } catch (error) {
      console.error('Wallet generation error:', error);
      throw new Error('Failed to generate wallet');
    }
  }

  async getUSDTBalance(address: string): Promise<number> {
    try {
      if (!this.tronWeb) {
        // Demo mode - return random balance
        return Math.floor(Math.random() * 1000);
      }

      const contract = await this.tronWeb.contract().at(this.usdtContractAddress);
      const balance = await contract.balanceOf(address).call();
      return this.tronWeb.fromSun(balance) / 1000000; // USDT has 6 decimals
    } catch (error) {
      console.error('Error getting USDT balance:', error);
      return 0;
    }
  }

  async getTRXBalance(address: string): Promise<number> {
    try {
      if (!this.tronWeb) {
        return Math.floor(Math.random() * 100);
      }

      const balance = await this.tronWeb.trx.getBalance(address);
      return this.tronWeb.fromSun(balance);
    } catch (error) {
      console.error('Error getting TRX balance:', error);
      return 0;
    }
  }
}

export const walletService = new WalletService();
