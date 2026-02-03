# F&B Loyalty Platform - Implementation Plan

## Overview
A comprehensive loyalty rewards platform for F&B businesses (like Starbucks) enabling members to earn points, upgrade tiers, collect vouchers, and redeem via QR codes at 3rd party POS systems.

## Tech Stack
- **Mobile App**: React Native (Expo)
- **Backend API**: Node.js + Express + TypeScript
- **Admin Portal**: React + Vite + TypeScript
- **Database**: PostgreSQL
- **Deployment**: AWS (ECS, RDS, S3, API Gateway)

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │  Admin Portal   │     │   3rd Party     │
│  (React Native) │     │    (React)      │     │   POS Systems   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      API Gateway        │
                    │   (Rate Limiting, Auth) │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Backend API          │
                    │  (Node.js + Express)    │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐   ┌─────────▼─────────┐   ┌────────▼────────┐
│   PostgreSQL    │   │   Campaign Engine │   │   Redis Cache   │
│   (RDS)         │   │   (Rules Engine)  │   │   (ElastiCache) │
└─────────────────┘   └───────────────────┘   └─────────────────┘
```

---

## Database Schema

### Core Tables

1. **members** - User accounts and profiles
2. **tiers** - Membership tier definitions (Bronze, Silver, Gold, Platinum)
3. **member_points** - Points balance and transactions
4. **vouchers** - Voucher templates
5. **member_vouchers** - Vouchers owned by members
6. **campaigns** - Campaign definitions with criteria
7. **campaign_rules** - Rules for awarding points/vouchers
8. **transactions** - POS transactions from 3rd parties
9. **qr_codes** - Generated QR codes for redemption

---

## Project Structure

```
/loyalty-platform
├── /mobile-app          # React Native Expo app
│   ├── /src
│   │   ├── /screens     # Login, Home, Vouchers, QR, Profile
│   │   ├── /components  # Reusable UI components
│   │   ├── /services    # API calls
│   │   ├── /store       # State management (Zustand)
│   │   └── /utils       # Helpers
│   └── app.json
│
├── /backend             # Node.js Express API
│   ├── /src
│   │   ├── /controllers # Route handlers
│   │   ├── /services    # Business logic
│   │   ├── /models      # Sequelize models
│   │   ├── /middleware  # Auth, validation
│   │   ├── /routes      # API routes
│   │   └── /engine      # Campaign rules engine
│   └── package.json
│
├── /admin-portal        # React admin dashboard
│   ├── /src
│   │   ├── /pages       # Dashboard, Campaigns, Members, Reports
│   │   ├── /components  # Tables, Forms, Charts
│   │   └── /services    # API calls
│   └── package.json
│
└── /infrastructure      # AWS CDK/Terraform
```

---

## Implementation Phases

### Phase 1: Foundation (Backend Core)
1. Initialize Node.js + Express + TypeScript project
2. Set up PostgreSQL with Sequelize ORM
3. Create database migrations for all tables
4. Implement authentication (JWT with refresh tokens)
5. Create member CRUD endpoints

### Phase 2: Points & Tiers System
1. Implement tier definitions and progression logic
2. Create points earning/spending logic
3. Build tier upgrade calculations
4. Add points transaction history

### Phase 3: Voucher System
1. Create voucher templates management
2. Implement voucher distribution logic
3. Build voucher redemption flow
4. Add expiry and usage tracking

### Phase 4: QR Code System
1. Generate secure QR codes with encrypted payload
2. Create QR validation endpoint for POS
3. Implement one-time use tokens
4. Add QR expiry mechanism

### Phase 5: Campaign Engine
1. Design campaign rule schema (JSON-based)
2. Build rules evaluation engine
3. Implement automatic reward distribution
4. Create campaign scheduling

### Phase 6: 3rd Party API
1. Create transaction ingestion endpoint
2. Implement webhook/callback system
3. Build real-time reward processing
4. Add transaction reconciliation

### Phase 7: Mobile App
1. Set up React Native Expo project
2. Implement auth screens (Register, Login, OTP)
3. Build home dashboard (points, tier, vouchers)
4. Create QR code display screen
5. Add voucher list and details
6. Implement profile and settings

### Phase 8: Admin Portal
1. Set up React + Vite project
2. Build authentication and dashboard
3. Create campaign management UI
4. Implement member management
5. Add voucher template editor
6. Build reports and analytics

### Phase 9: Testing & Deployment
1. Write unit and integration tests
2. Set up CI/CD pipeline
3. Configure AWS infrastructure
4. Deploy to staging/production

---

## API Endpoints

### Authentication (Phone + OTP)
- `POST /api/auth/otp/send` - Send OTP to phone number
- `POST /api/auth/otp/verify` - Verify OTP and get tokens
- `POST /api/auth/register` - Complete registration with profile
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate tokens

### Members
- `GET /api/members/me` - Get current member profile
- `PUT /api/members/me` - Update profile
- `GET /api/members/me/points` - Get points balance and history
- `GET /api/members/me/tier` - Get tier status and progress

### Vouchers
- `GET /api/vouchers` - List available vouchers
- `GET /api/members/me/vouchers` - List owned vouchers
- `POST /api/vouchers/:id/claim` - Claim a voucher
- `POST /api/vouchers/:id/redeem` - Redeem a voucher

### QR Codes
- `POST /api/qr/generate` - Generate redemption QR
- `POST /api/qr/validate` - Validate QR (for POS)
- `POST /api/qr/consume` - Consume QR (for POS)

### Transactions (3rd Party)
- `POST /api/transactions` - Submit transaction from POS
- `GET /api/transactions/:id` - Get transaction status

### Admin
- `GET /api/admin/campaigns` - List campaigns
- `POST /api/admin/campaigns` - Create campaign
- `PUT /api/admin/campaigns/:id` - Update campaign
- `GET /api/admin/members` - List/search members
- `GET /api/admin/reports/*` - Various reports

---

## Key Features Detail

### Campaign Rules Engine
Campaigns support flexible criteria:
```json
{
  "name": "Weekend Double Points",
  "type": "points_multiplier",
  "criteria": {
    "days": ["saturday", "sunday"],
    "minAmount": 10,
    "categories": ["beverages"]
  },
  "reward": {
    "type": "points",
    "multiplier": 2
  },
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### QR Code Payload (Supports Points & Vouchers)
Secure, time-limited token with two redemption modes:

**Points Redemption:**
```json
{
  "type": "points",
  "memberId": "uuid",
  "points": 100,
  "exp": 1234567890,
  "signature": "hmac-sha256"
}
```

**Voucher Redemption:**
```json
{
  "type": "voucher",
  "memberId": "uuid",
  "voucherId": "uuid",
  "exp": 1234567890,
  "signature": "hmac-sha256"
}
```

### Tier Progression
- Bronze: 0 - 499 points
- Silver: 500 - 1999 points
- Gold: 2000 - 4999 points
- Platinum: 5000+ points

---

## Files to Create

### Backend
- `/backend/package.json`
- `/backend/tsconfig.json`
- `/backend/src/index.ts`
- `/backend/src/config/database.ts`
- `/backend/src/models/*.ts` (Member, Tier, Points, Voucher, Campaign, Transaction)
- `/backend/src/routes/*.ts`
- `/backend/src/controllers/*.ts`
- `/backend/src/services/*.ts`
- `/backend/src/middleware/auth.ts`
- `/backend/src/engine/campaign.ts`

### Mobile App
- `/mobile-app/package.json`
- `/mobile-app/app.json`
- `/mobile-app/App.tsx`
- `/mobile-app/src/screens/*.tsx`
- `/mobile-app/src/services/api.ts`
- `/mobile-app/src/store/index.ts`

### Admin Portal
- `/admin-portal/package.json`
- `/admin-portal/src/App.tsx`
- `/admin-portal/src/pages/*.tsx`

---

## Verification Plan

1. **Backend API Testing**
   - Run `npm test` for unit tests
   - Use Postman/curl to test endpoints
   - Verify database transactions

2. **Mobile App Testing**
   - Run on iOS/Android simulator
   - Test registration and login flow
   - Verify QR code generation and display

3. **Integration Testing**
   - Simulate POS transaction submission
   - Verify points awarded correctly
   - Test voucher redemption flow

4. **End-to-End Flow**
   - Register new member → Earn points → Check tier → Generate QR → Validate at POS
