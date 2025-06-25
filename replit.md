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
- **2025-06-25**: Fixed critical deployment issue - server now properly binds to 0.0.0.0:5000 for production
  - Resolved "connection refused" errors in deployment proxy by fixing server binding configuration
  - **FIXED**: Paystack payment failures in production by updating Content Security Policy to allow js.paystack.co and checkout.paystack.com domains
  - Enhanced payment script loading with multiple fallback strategies and comprehensive debug logging
  - Removed duplicate payment initialization code causing conflicts in modal
  - Added proper cleanup for payment modal states and better timeout management
  - Production server build optimized to 133.8kb bundle with working API endpoints and proper CSP headers
  - Fixed server configuration to properly serve both development and production environments
- **2025-06-24**: Enhanced animations with dynamic hero text rotation and refined user experience
  - Removed entrance animations from hero section for immediate content visibility
  - Added dynamic text rotation for hero subtitle cycling through: "Complete Security", "Complete Confidence", "Complete Trust"
  - Retained hover effects with scale transforms, rotations, and color transitions on interactive elements
  - Maintained animated live market data with real-time rate updates and trader count changes
  - Kept card hover animations with lift effects (-translate-y-2) and enhanced shadows
  - Preserved icon rotation and scale animations on hover for visual feedback
  - Maintained arrow translation effects on button hover for directional guidance
  - Kept animated FAQ expansion with smooth slide-in-from-top transitions
  - Retained animated pulse effects on security indicators and online status
  - All animations use smooth duration-300 to duration-700 timing for professional feel
  - Fixed header button spacing between Sign In and Get Started buttons
  - Hero buttons are w-auto width instead of full width on mobile
- **2025-06-24**: Enhanced rating system with dynamic button behavior and edit functionality
  - Rating button shows "Rate this trade" initially for unrated completed trades
  - After rating submission, button changes to "Edit this rating" for 30 seconds
  - After 30 seconds, button reverts to "Rate this" allowing future edits
  - Added rating edit functionality with API endpoint PUT /api/ratings/:id
  - Rating form supports both creation and editing modes with pre-filled values
  - User profile ratings automatically recalculate when ratings are updated
  - Enhanced rating display with conditional button text based on edit window status
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
  - **NEW**: Dashboard improvements - removed problematic messaging section, made Recent Trading Activity clickable with usernames
  - **NEW**: Individual offer detail modals on dashboard with comprehensive information display
  - **NEW**: Manage-offers page filters out completed offers and shows latest first with scroll-to-top functionality
  - **NEW**: Edit protection - offers with active trades cannot be modified to prevent conflicts during trading
  - **NEW**: Admin-configurable exchange rates - USDT_TO_NGN_RATE and NGN_TO_USD_RATE now stored in database with admin UI for updates
  - **NEW**: Exchange rate management page at /admin/exchange-rates for real-time rate configuration
  - **NEW**: All wallet calculations and trading now use database-stored exchange rates instead of hardcoded values
  - **NEW**: General Settings page at /admin/settings consolidating exchange rates and future platform configuration options
  - **NEW**: Improved admin navigation with centralized settings management accessible from main admin dashboard
  - **NEW**: Auto-calculation feature - when updating one exchange rate, the system automatically calculates and stores the inverse rate (USDT_TO_NGN ↔ NGN_TO_USD)
  - **ENHANCED**: Exchange rate management with real-time inverse calculation, modern mobile-optimized UI, and proper API endpoints
  - **NEW**: Consistent portfolio display across dashboard and wallet - same calculation logic, currency toggle, and visual design for unified user experience
  - **NEW**: Smart Buy/Sell buttons in navbar - redirect to marketplace with auto-filter selection and scroll to top for better UX

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