# DigiPay - P2P Cryptocurrency Trading Platform

## Overview

DigiPay is a full-stack peer-to-peer (P2P) cryptocurrency trading platform built with modern web technologies. It enables users to trade USDT/Naira with built-in escrow functionality, KYC verification, and real-time messaging. The application follows a monorepo structure with clear separation between client, server, and shared components.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Radix UI components with Tailwind CSS
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **API Design**: RESTful APIs with consistent error handling

### Database Architecture
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Neon Database serverless PostgreSQL
- **Session Store**: PostgreSQL-backed session storage

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Password hashing with Node.js crypto (scrypt)
- Protected routes with authentication middleware
- User roles (regular users and administrators)

### P2P Trading System (Binance-style)
- Offer creation and management (buy/sell USDT)
- Escrow-based trade execution with USDT locking
- 15-minute payment windows with automatic expiration
- Multi-step trade flow: pending → payment_pending → payment_made → completed
- Real-time trade messaging system
- Rating and reputation system for users

### Financial Management
- Multi-currency wallet (USDT and Naira balances)
- Deposit/withdrawal functionality
- Transaction history and tracking
- KYC verification system

### Admin Panel
- Trade dispute resolution
- User management and verification
- Withdrawal/deposit approval system with admin notes
- Transaction tracking and audit trail
- Real-time approval dashboard with notifications
- System-wide monitoring and controls

## Data Flow

1. **User Registration/Login**: Users authenticate through Passport.js, sessions stored in PostgreSQL
2. **Offer Management**: Users create buy/sell offers stored in the offers table
3. **Trade Execution**: When offers are accepted, trades are created with escrow functionality
4. **Messaging**: Real-time communication through the messages system
5. **Financial Operations**: Balance updates and transaction logging for all financial activities

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **drizzle-orm**: Type-safe ORM for database operations
- **bcrypt**: Additional password hashing (alongside crypto)
- **passport**: Authentication middleware
- **express-session**: Session management

### UI Dependencies
- **@radix-ui/***: Comprehensive UI component library
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form handling and validation

### Development Dependencies
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- tsx for running TypeScript server code
- PostgreSQL database provisioned through Replit
- Session-based development workflow

### Production Build
- Frontend: Vite build process generating optimized static assets
- Backend: esbuild bundling server code for Node.js deployment
- Database: Production PostgreSQL with connection pooling
- Deployment: Autoscale deployment target on Replit

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session secrets and security configuration
- Port configuration (5000 for development, 80 for production)

## Changelog

```
Changelog:
- June 21, 2025. Initial setup
- June 21, 2025. Upgraded to PostgreSQL database with complete schema
- June 21, 2025. Implemented external service integrations (YouVerify, Paystack, TRON, Notifications)
- June 21, 2025. Created smart contract for escrow functionality
- June 21, 2025. Added modern landing page with trust elements and social proof
- June 21, 2025. Enhanced auth page for mobile responsiveness
- June 21, 2025. Implemented real-time WebSocket chat functionality
- June 21, 2025. Added KYC verification system with BVN integration
- June 21, 2025. Migrated project to Replit environment with full functionality
- June 21, 2025. Fixed authentication endpoints and dashboard display issues
- June 21, 2025. Configured database tables and resolved CSP conflicts in development
- June 21, 2025. Fixed authentication system with JWT cookies and proper API routing separation
- June 21, 2025. Enhanced UI/UX with mobile-first responsive design, modern gradients, and compact layouts
- June 21, 2025. Completed project migration to Replit with fixed authentication and 3-step withdrawal process
- June 21, 2025. Implemented Binance-style P2P trading with escrow, payment timeouts, and admin approval system
- June 21, 2025. Added comprehensive admin panel for withdrawal/deposit approvals with transaction tracking
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```