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
- **2025-06-24**: Completely revamped dispute system and fixed critical UI issues
  - Created DisputeSystemV2 with mobile-optimized modern design and robust validation
  - Enhanced admin dispute management with priority levels, case tracking, and detailed resolution actions
  - Added comprehensive evidence upload system with file validation and descriptions
  - Implemented security measures including minimum character requirements and proper authorization
  - Created AdminDisputesV2 with advanced filtering, search, and case management features
  - Added audit trails, transaction logging, and detailed notification system for all dispute activities
  - Integrated dispute priority classification (high/medium/low) based on category severity
  - Fixed infinite re-render issues by creating simplified TradeDetailSimple component
  - Resolved trade-direct page routing and parameter extraction problems

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