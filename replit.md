# DigiPay P2P Cryptocurrency Trading Platform

## Project Overview
DigiPay is a peer-to-peer cryptocurrency trading platform that enables direct trading between users without intermediaries. The platform includes user authentication, trading functionality, escrow services, and comprehensive security features.

## Recent Changes
- **2025-01-22**: Successfully migrated project from Replit Agent to Replit environment
- **2025-01-22**: Fixed BarChart3 import issue in trading dashboard
- **2025-01-22**: Updated Buy/Sell tab buttons with improved styling (red outline for Buy, green filled for Sell)
- **2025-01-22**: Set up PostgreSQL database with complete schema
- **2025-01-22**: Installed missing dependencies (tsx)

## Project Architecture
- **Frontend**: React with TypeScript, Vite, TailwindCSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with session management
- **Real-time**: WebSocket connections for live updates
- **Styling**: TailwindCSS with Radix UI components

## Key Features
- User registration and authentication
- KYC verification system
- P2P trading marketplace
- Escrow service for secure transactions
- Real-time notifications via WebSocket
- Mobile-responsive design
- Admin dashboard functionality

## User Preferences
- User prefers clear, obvious button styling with color coding
- Buy buttons should be red-themed
- Sell buttons should be green-themed
- Mobile-first responsive design approach

## Current Status
- Application successfully running on port 5000
- Database schema deployed and seeded
- All core functionality operational
- Ready for further development and feature additions

## Environment Variables
- DATABASE_URL: Configured via Replit's built-in PostgreSQL
- TronWeb in demo mode for development