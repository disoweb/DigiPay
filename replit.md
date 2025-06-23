# DigiPay P2P Cryptocurrency Trading Platform

## Overview
DigiPay is a peer-to-peer cryptocurrency trading platform that enables direct trading between users without intermediaries. The platform supports both Nigerian Naira (NGN) and USDT transactions with integrated payment processing through Paystack and TRON blockchain integration.

## Project Architecture
- **Frontend**: React with TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js with TypeScript 
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication
- **Payment Processing**: Paystack for NGN transactions
- **Blockchain**: TRON network for USDT transactions
- **Real-time Features**: WebSocket support for live chat and notifications

## Key Features
- User registration and KYC verification system
- P2P trading marketplace with offer creation and management
- Wallet functionality with deposit/withdrawal capabilities
- Real-time messaging system between traders
- Escrow system for secure transactions
- Admin panel for user and trade management
- Rating and review system
- Mobile-responsive design

## Recent Changes
- **2025-01-23**: Successfully migrated project from Replit Agent to standard Replit environment
- **2025-01-23**: Fixed database schema issues with message table columns
- **2025-01-23**: Resolved Paystack payment integration issues
- **2025-01-23**: Enhanced send funds modal with real-time user lookup and verification status display
- **2025-01-23**: Added debounced search functionality for user lookup with visual feedback indicators

## Database Schema
- Users table with KYC verification fields
- Offers table for trading listings
- Trades table for transaction records
- Messages table for chat functionality
- Transactions table for payment history
- Ratings table for user feedback

## Environment Setup
- Node.js 20 with TypeScript
- PostgreSQL database (configured)
- Paystack API integration (configured)
- TRON network integration (demo mode for development)

## User Preferences
- Focus on security and user verification
- Real-time feedback for user interactions
- Clean, professional UI design
- Mobile-first responsive design

## Current Status
The project is fully functional and ready for continued development. All core features are working including payments, user verification, and real-time messaging.