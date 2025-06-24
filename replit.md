# DigiPay P2P Cryptocurrency Trading Platform

## Project Overview
DigiPay is a peer-to-peer cryptocurrency trading platform that enables direct trading between users without intermediaries. The platform supports USDT/NGN trading with escrow services, KYC verification, real-time chat, and integrated payment systems.

## Architecture
- **Frontend**: React with TypeScript, Vite, TailwindCSS, Radix UI components
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with sessions
- **Real-time**: WebSocket for chat and live updates
- **Payment**: Paystack integration for NGN, TronWeb for USDT
- **Security**: Helmet for security headers, rate limiting, input validation

## Recent Changes
- **2025-01-24**: Enhanced trade detail page with total amount and role moved to overview card
- **2025-01-24**: Added online/offline status indicators for trading partners
- **2025-01-24**: Implemented completion rate display with color-coded progress bars
- **2025-01-24**: Improved partner card layout with better status information
- **2025-01-22**: Completely redesigned /trades page with modern mobile-first UI
- **2025-01-22**: Added sticky mobile header with back navigation and refresh
- **2025-01-22**: Implemented horizontal scrolling filter pills for better mobile UX

## Key Features
- User registration and KYC verification
- P2P USDT trading with escrow
- Real-time messaging between traders
- Admin panel for dispute resolution
- Wallet management with deposit/withdrawal
- Rating and review system
- Mobile-responsive design

## User Preferences
- Language: English
- Communication style: Professional, concise, no emojis
- Error handling: Prefer explicit error messages over silent fallbacks
- Security: Client/server separation, proper validation

## Technical Notes
- Server binds to 0.0.0.0 for Replit compatibility
- Uses Neon PostgreSQL database service
- TronWeb runs in demo mode without API keys
- Paystack integration requires PAYSTACK_SECRET_KEY environment variable
- Admin user created: admin@digipay.com / admin123