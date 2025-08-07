# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional online raffle system for Brazil, designed to support multiple simultaneous campaigns with full regulatory compliance and modern features.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS + shadcn/ui
- **State**: Zustand / React Context
- **Forms**: React Hook Form + Zod

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Custom Phone Auth
- **API**: Next.js API Routes
- **Queue**: BullMQ (Redis)

### Integrations
- **Payment**: PIX via Partner Gateway API
- **SMS/WhatsApp**: Twilio / Amazon SNS
- **Lottery**: Federal Lottery APIs (Lotodicas, etc)
- **Analytics**: Google Analytics 4 + Facebook Pixel

## Essential Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm run test
npm run test:e2e

# Generate Supabase types
npm run generate-types

# Database migrations
npx supabase db push
npx supabase migration new <name>

# Add shadcn/ui components
npx shadcn-ui@latest add <component>
```

## Project Architecture

### Directory Structure
```
src/
   app/                    # Next.js App Router
      (auth)/            # Authentication pages
      (dashboard)/       # User dashboard
      (admin)/           # Admin panel
      rifas/             # Public raffle pages
      api/               # API routes
   components/            # React components
      ui/               # shadcn/ui base components
      features/         # Feature-specific components
      layout/           # Layout components
   lib/                   # Core libraries
      supabase/         # Database clients
      api/              # External API integrations
      utils/            # Utility functions
      services/         # Business logic services
   hooks/                 # Custom React hooks
   stores/               # Zustand state stores
   types/                # TypeScript definitions
```

### Key Architecture Patterns

1. **Authentication Flow**: Phone-based OTP authentication with SMS/WhatsApp verification
2. **Payment Processing**: Asynchronous PIX payment with webhook confirmation
3. **Real-time Updates**: Supabase Realtime for ticket availability and payment status
4. **Lottery Integration**: Automated draw processing using Federal Lottery results
5. **Queue System**: BullMQ for async jobs (notifications, payment processing)

## Database Schema

The system uses Supabase PostgreSQL with the following core tables:
- `profiles`: User profiles with phone verification
- `raffles`: Raffle campaigns with lottery integration
- `tickets`: Individual raffle numbers with status tracking
- `transactions`: Payment records with PIX integration
- `winners`: Draw results and prize delivery tracking
- `notifications`: Multi-channel notification system

## Critical Business Rules

1. **Age Restriction**: Users must be 18+ (validated via CPF and birth date)
2. **Payment Window**: PIX payments expire after 30 minutes
3. **Ticket Reservation**: Reserved tickets are released after 10 minutes
4. **Draw Rules**: Winners determined by Federal Lottery results
5. **Commission System**: Affiliate commissions calculated per transaction

## Security Considerations

- LGPD compliance with data export/deletion capabilities
- CPF validation for fraud prevention
- Rate limiting on all public endpoints
- Webhook signature validation for payment confirmations
- RLS (Row Level Security) enabled on all Supabase tables

## Environment Variables

Required environment variables:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payment Gateway
PAYMENT_API_URL=
PAYMENT_API_KEY=
WEBHOOK_SECRET=

# SMS/WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Security
JWT_SECRET=

# Application
NEXT_PUBLIC_APP_URL=
```

## Development Workflow

1. Always check existing patterns in neighboring files before implementing new features
2. Use TypeScript strict mode and validate all external data with Zod
3. Implement real-time updates for critical user-facing features
4. Test payment flows in sandbox environment before production
5. Ensure mobile-first responsive design for all new components

## Important Notes

- The system is designed for the Brazilian market with PIX as the primary payment method
- All monetary values are in BRL (Brazilian Real)
- Phone numbers must be Brazilian format (+55)
- Lottery integration is specific to Brazilian Federal Lottery
- All user communications default to Portuguese (pt-BR)

## Personal Preferences

- Sempre falo comigo no chat em portugues