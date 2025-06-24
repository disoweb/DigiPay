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
- **2025-01-22**: Modernized trade management page with mobile-optimized responsive design
- **2025-01-22**: Added auto-removal of canceled trades after 9 minutes
- **2025-01-22**: Enhanced trade list with search functionality and improved filters
- **2025-01-22**: Fixed dashboard Active Trades navigation (chat button vs card click)
- **2025-01-22**: Fixed trade creation flow to redirect to trade detail page instead of chat
- **2025-01-22**: Added chat button in trade detail page for contacting counterparty
- **2025-01-22**: Fixed database schema mismatch for messages table (receiver_id vs recipient_id)

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