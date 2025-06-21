
import nodemailer from 'nodemailer';

export class NotificationService {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'demo@digipay.com',
        pass: process.env.EMAIL_PASS || 'demo_password'
      }
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      if (process.env.EMAIL_USER === 'demo@digipay.com') {
        console.log(`Demo email to ${to}: ${subject}`);
        return true;
      }

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
      });

      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  async sendTradeNotification(email: string, tradeId: number, type: 'created' | 'completed' | 'cancelled'): Promise<void> {
    const subjects = {
      created: 'New Trade Created',
      completed: 'Trade Completed',
      cancelled: 'Trade Cancelled'
    };

    const html = `
      <h2>Trade Update</h2>
      <p>Your trade #${tradeId} has been ${type}.</p>
      <p>Visit your dashboard to view details.</p>
    `;

    await this.sendEmail(email, subjects[type], html);
  }

  async sendDepositNotification(email: string, amount: number): Promise<void> {
    const html = `
      <h2>Deposit Successful</h2>
      <p>Your deposit of ₦${amount.toLocaleString()} has been credited to your account.</p>
    `;

    await this.sendEmail(email, 'Deposit Successful', html);
  }
}

export const notificationService = new NotificationService();
