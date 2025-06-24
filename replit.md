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
- **2025-01-24**: Added admin password reset functionality
  - Created `/api/admin/users/:userId/password` endpoint for secure password updates
  - Added password reset button to admin users management dropdown menu
  - Implemented password update modal with validation and confirmation
  - Enhanced admin users interface with comprehensive user management controls
- **2025-01-22**: Fixed trade completion issues and real-time balance updates
  - Updated trade completion endpoints to properly handle payment_made status
  - Added WebSocket notifications for balance updates during trade completion
  - Created transaction records for both buyer and seller on trade completion
  - Fixed expiration status display to only show for active payment_pending trades
  - Ensured real-time balance updates work across all trade completion flows

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