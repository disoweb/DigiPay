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
- **2025-06-24**: Enhanced trade management with expiration handling and improved UI/UX
  - Added "Expired" tab to trades page showing expired trades for 24 hours with reopen functionality
  - Enhanced status badge colors across all components (green for completed, red for expired/disputed, blue for payment_made, yellow for pending)
  - Implemented automatic trade expiration handling with server-side checks
  - Fixed mobile responsiveness for expired trades filter with dynamic visibility and horizontal scrolling
  - Enhanced mobile filter scrolling with smooth horizontal scroll, snap behavior, and gradient fade indicators
  - Fixed trade reopen functionality with proper date formatting and balance validation
  - Added seller balance verification before allowing trade reopening for sell offers
  - Fixed reopen timer to use original offer's timeLimit ensuring consistency with original trade duration
  - Fixed database query alias conflicts in getTrades method affecting market stats
  - Implemented most recent first sorting for all trade filters to show latest activity
  - Cleaned up debugging logs for production readiness
  - Added comprehensive rating and dispute mechanisms integrated into trade flow and user profiles
  - **FIXED**: Status display JSON format issue - corrected server-side updateTradeStatus function call and cleaned database records containing JSON status values
  - **RESOLVED**: Trade #47 and #48 status now display as "Expired" instead of {"status":"expired"} across all pages and components

## User Preferences
- Non-technical user communication preferred
- Focus on functionality over technical details
- Real-time updates are critical for user experience
- Transaction history visibility is important for transparency
- Smart default filter selection: "Active" → "Completed" → "All" (fallback chain)
- Hide filters with 0 count completely from UI

## Key Features
- P2P trading with escrow protection
- Real-time balance updates via WebSocket
- KYC verification system
- Admin panel for trade dispute resolution
- Mobile-optimized responsive design
- Comprehensive transaction logging