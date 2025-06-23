# DigiPay P2P Cryptocurrency Trading Platform

## Project Overview
A peer-to-peer cryptocurrency trading platform that enables direct trading between users without intermediaries. The platform facilitates secure USDT/Naira transactions with built-in escrow services, KYC verification, and real-time messaging.

## Project Architecture
- **Frontend**: React with Vite, TypeScript, Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket connections for messaging
- **Payments**: Paystack integration for Naira transactions
- **Blockchain**: TronWeb for USDT transactions (demo mode in development)
- **Authentication**: JWT-based with session management

## Key Features
- User registration and KYC verification
- Buy/sell offer creation and management
- Real-time trading with escrow protection
- Secure messaging system
- Payment processing via Paystack
- Admin dashboard for transaction oversight
- Rating and review system

## Recent Changes
- **2025-01-22**: Successfully migrated project from Replit Agent to standard Replit environment
- **2025-01-22**: Fixed database schema mismatches (recipient_id → receiver_id, message → content)
- **2025-01-22**: Configured PostgreSQL database and applied migrations
- **2025-01-22**: Resolved Paystack integration issues and confirmed API key configuration
- **2025-01-22**: Application now running successfully on port 5000

## Environment Configuration
- Database: PostgreSQL (configured and migrated)
- Paystack: API keys configured for payment processing
- TronWeb: Running in demo mode for development
- WebSocket server: Active on /ws endpoint

## User Preferences
*To be updated as user preferences are expressed*

## Development Status
✅ Project successfully imported and running
✅ Database connectivity established
✅ Payment integration verified
✅ Core functionality operational