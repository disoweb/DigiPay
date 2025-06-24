# DigiPay P2P Cryptocurrency Trading Platform

## Project Overview
A peer-to-peer cryptocurrency trading platform that enables direct trading between users without intermediaries. The platform focuses on USDT/Naira trading with secure escrow services, real-time chat, and comprehensive user management.

## Recent Changes
- **2024-01-23**: Successfully migrated from Replit Agent to Replit environment
- **2024-01-23**: Installed required dependencies (tsx, database setup)
- **2024-01-23**: Created PostgreSQL database and applied schema migrations
- **2024-01-23**: Redesigned chat page (/chat/36) for mobile-first viewport optimization
- **2024-01-23**: Applied same mobile design principles as trade detail page for consistent UX

## Project Architecture

### Backend (Express.js + TypeScript)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with passport
- **Real-time**: WebSocket for live chat and notifications
- **Payment**: Paystack integration for NGN transactions
- **Crypto**: TronWeb integration for USDT transactions

### Frontend (React + TypeScript)
- **UI**: Tailwind CSS with Radix UI components
- **State**: TanStack Query for server state
- **Routing**: Wouter for lightweight routing
- **Mobile-first**: Optimized for single viewport display

### Key Features
- User registration/authentication with KYC verification
- P2P offer creation and trading system
- Real-time chat between traders
- Escrow service for secure transactions
- Admin panel for user and transaction management
- Mobile-optimized responsive design

### Database Schema
- **Users**: Authentication, KYC, balances, ratings
- **Offers**: Buy/sell offers with rates and amounts
- **Trades**: Active trading sessions between users
- **Messages**: Real-time chat for trade coordination
- **Transactions**: Payment and withdrawal records

## User Preferences
- Mobile-first design approach prioritizing single viewport layouts
- Compact UI elements to minimize scrolling
- Real-time features for enhanced user experience

## Security Features
- Client-server separation with proper API boundaries
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- Secure session management
- KYC verification requirements

## Development Status
- **Status**: Fully functional and deployed
- **Environment**: Production-ready on Replit
- **Database**: Live PostgreSQL with seed data
- **Chat System**: Real-time WebSocket implementation complete