import TronWeb from 'tronweb';

export interface TronWallet {
  address: string;
  privateKey: string;
}

export interface USDTBalance {
  balance: number;
  decimals: number;
}

export class TronService {
  private tronWeb: any;
  private usdtContract: any;
  private escrowContract: any;

  constructor() {
    this.tronWeb = new TronWeb({
      fullHost: 'https://api.trongrid.io',
      headers: { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY },
      privateKey: process.env.TRON_PRIVATE_KEY
    });

    // USDT TRC-20 contract address
    const usdtContractAddress = process.env.USDT_CONTRACT_ADDRESS || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    this.usdtContract = this.tronWeb.contract().at(usdtContractAddress);

    // Escrow contract address (will be set after deployment)
    if (process.env.ESCROW_CONTRACT_ADDRESS) {
      this.escrowContract = this.tronWeb.contract().at(process.env.ESCROW_CONTRACT_ADDRESS);
    }
  }

  generateWallet(): TronWallet {
    const account = this.tronWeb.createAccount();
    return {
      address: account.address.base58,
      privateKey: account.privateKey
    };
  }

  async getUSDTBalance(address: string): Promise<USDTBalance> {
    try {
      const balance = await this.usdtContract.balanceOf(address).call();
      return {
        balance: this.tronWeb.fromSun(balance),
        decimals: 6
      };
    } catch (error) {
      console.error('Error getting USDT balance:', error);
      return { balance: 0, decimals: 6 };
    }
  }

  async transferUSDT(fromPrivateKey: string, toAddress: string, amount: number): Promise<string | null> {
    try {
      const tronWebInstance = new TronWeb({
        fullHost: 'https://api.trongrid.io',
        headers: { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY },
        privateKey: fromPrivateKey
      });

      const contract = await tronWebInstance.contract().at(this.usdtContract.address);
      const amountSun = this.tronWeb.toSun(amount);
      
      const transaction = await contract.transfer(toAddress, amountSun).send();
      return transaction;
    } catch (error) {
      console.error('Error transferring USDT:', error);
      return null;
    }
  }

  async depositToEscrow(fromPrivateKey: string, tradeId: number, amount: number): Promise<string | null> {
    if (!this.escrowContract) {
      console.error('Escrow contract not configured');
      return null;
    }

    try {
      const tronWebInstance = new TronWeb({
        fullHost: 'https://api.trongrid.io',
        headers: { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY },
        privateKey: fromPrivateKey
      });

      const escrow = await tronWebInstance.contract().at(this.escrowContract.address);
      const amountSun = this.tronWeb.toSun(amount);
      
      const transaction = await escrow.deposit(tradeId, amountSun).send();
      return transaction;
    } catch (error) {
      console.error('Error depositing to escrow:', error);
      return null;
    }
  }

  async releaseFromEscrow(tradeId: number): Promise<string | null> {
    if (!this.escrowContract) {
      console.error('Escrow contract not configured');
      return null;
    }

    try {
      const transaction = await this.escrowContract.release(tradeId).send();
      return transaction;
    } catch (error) {
      console.error('Error releasing from escrow:', error);
      return null;
    }
  }

  async refundFromEscrow(tradeId: number): Promise<string | null> {
    if (!this.escrowContract) {
      console.error('Escrow contract not configured');
      return null;
    }

    try {
      const transaction = await this.escrowContract.refund(tradeId).send();
      return transaction;
    } catch (error) {
      console.error('Error refunding from escrow:', error);
      return null;
    }
  }
}

export const tronService = new TronService();