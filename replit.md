# DigiPay P2P Cryptocurrency Trading Platform

## Overview
A peer-to-peer cryptocurrency trading platform enabling direct trading between users without intermediaries. Built with Express.js backend, React frontend, and PostgreSQL database, featuring real-time WebSocket communications, escrow protection, and comprehensive trade management.

## Project Architecture
- **Backend**: Express.js with TypeScript, Drizzle ORM
- **Frontend**: React with Vite, TailwindCSS, Radix UI
- **Database**: PostgreSQL (Neon-backed)
- **Real-time**: WebSocket connections for live updates
- **Payment**: Paystack integration for NGN deposits
- **Security**: JWT authentication, rate limiting, helmet security

## Recent Changes
- **2025-01-24**: Integrated comprehensive rating and dispute mechanisms into trade flow
  - Added rating prompts after successful trade completion in ModernTradeDetail component
  - Integrated dispute resolution buttons for active trades (payment_pending, payment_made)
  - Enhanced user profile with tabbed interface showing trading stats, ratings received/given, and dispute history
  - Added rating check functionality to prevent duplicate ratings
  - Enhanced trade history display with dispute information and comprehensive trading statistics
  - Created unified rating and dispute tracking across the platform

## User Preferences
- Non-technical user communication preferred
- Focus on functionality over technical details
- Real-time updates are critical for user experience
- Transaction history visibility is important for transparency

## Key Features
- P2P trading with escrow protection
- Real-time balance updates via WebSocket
- KYC verification system
- Admin panel for trade dispute resolution
- Mobile-optimized responsive design
- Comprehensive transaction logging