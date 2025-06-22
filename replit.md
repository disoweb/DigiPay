# DigiPay P2P Cryptocurrency Trading Platform

## Project Overview
A comprehensive peer-to-peer cryptocurrency trading platform built with React, Node.js/Express, and PostgreSQL. Features include secure trading, KYC verification, real-time messaging, escrow services, and admin management.

## Architecture Overview
- **Frontend**: React with TypeScript, Tailwind CSS, Radix UI components
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket for live chat and notifications
- **Authentication**: JWT-based auth with session management
- **Security**: Helmet, rate limiting, input validation

## Recent Changes
- **2025-01-22**: Successfully migrated from Replit Agent to Replit environment
- **2025-01-22**: Added online status indicators for traders in marketplace
- **2025-01-22**: Implemented direct messaging feature for trader communication
- **2025-01-22**: Enhanced WebSocket system for real-time status updates
- **2025-01-22**: Fixed database schema issues with isOnline/lastSeen columns
- **2025-01-22**: Created new marketplace component with proper online status display  
- **2025-01-22**: Fixed messaging functionality with working send button
- **2025-01-22**: Modernized messaging system with mobile-optimized floating widget
- **2025-01-22**: Implemented automatic messaging when new trades are created
- **2025-01-22**: Added responsive message interface with real-time updates

## Key Features
- P2P trading with USDT/Naira pairs
- Real-time marketplace with live offers
- Secure escrow system with smart contracts
- KYC verification workflow
- Admin panel for user and transaction management
- Real-time chat system for trades
- Payment integration with Paystack
- Mobile-responsive design

## Database Schema
- Users with KYC status and online tracking
- Offers with payment methods and terms
- Trades with escrow and status tracking
- Messages for trade communication
- Transactions for deposits/withdrawals
- Notifications for real-time updates

## Security Features
- JWT authentication
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- Secure password hashing with bcrypt
- Admin role-based access control

## User Preferences
*No specific preferences documented yet*