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
- **2025-01-24**: Enhanced trade management with expiration handling and improved UI/UX
  - Added "Expired" tab to trades page showing expired trades for 1 hour with reopen functionality
  - Enhanced status badge colors across all components (green for completed, red for expired/disputed, blue for payment_made, yellow for pending)
  - Implemented automatic trade expiration handling with server-side checks
  - Fixed admin disputes page with proper data structure handling and fallback values
  - Added comprehensive rating and dispute mechanisms integrated into trade flow and user profiles
  - Created trade reopen functionality allowing users to restart expired trades within 1 hour window

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