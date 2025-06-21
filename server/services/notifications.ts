import { createTransport } from 'nodemailer';
import twilio from 'twilio';

// Email service
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"DigiPay" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  async sendTradeNotification(email: string, tradeId: number, message: string) {
    const subject = `DigiPay Trade Update - Trade #${tradeId}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1D4ED8;">DigiPay Trade Notification</h2>
        <p>Hello,</p>
        <p>${message}</p>
        <p><strong>Trade ID:</strong> #${tradeId}</p>
        <p>Please log in to your DigiPay account to view trade details.</p>
        <p>Best regards,<br>DigiPay Team</p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }

  async sendKYCNotification(email: string, status: 'approved' | 'rejected') {
    const subject = `DigiPay KYC ${status === 'approved' ? 'Approved' : 'Rejected'}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1D4ED8;">DigiPay KYC Update</h2>
        <p>Hello,</p>
        <p>Your KYC verification has been ${status}.</p>
        ${status === 'approved' 
          ? '<p>You can now start trading on DigiPay platform.</p>'
          : '<p>Please contact support for more information.</p>'
        }
        <p>Best regards,<br>DigiPay Team</p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }
}

// SMS service
export class SMSService {
  private client;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.client) {
      console.error('Twilio not configured');
      return false;
    }

    try {
      await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
      return true;
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  }

  async sendTradeAlert(phoneNumber: string, tradeId: number, message: string) {
    const fullMessage = `DigiPay: Trade #${tradeId} - ${message}`;
    return this.sendSMS(phoneNumber, fullMessage);
  }
}

export const emailService = new EmailService();
export const smsService = new SMSService();