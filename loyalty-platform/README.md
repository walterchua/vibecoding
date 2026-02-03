# F&B Loyalty Platform

A comprehensive loyalty rewards platform for F&B businesses enabling members to earn points, upgrade tiers, collect vouchers, and redeem via QR codes at 3rd party POS systems.

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
                    │    Backend API          │
                    │  (Node.js + Express)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      PostgreSQL         │
                    └─────────────────────────┘
```

## Tech Stack

- **Mobile App**: React Native (Expo)
- **Backend API**: Node.js + Express + TypeScript
- **Admin Portal**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL + Sequelize ORM

## Project Structure

```
/loyalty-platform
├── /backend             # Node.js Express API
├── /mobile-app          # React Native Expo app
├── /admin-portal        # React admin dashboard
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Expo CLI (for mobile app)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Start PostgreSQL and create database
createdb loyalty_platform

# Run development server
npm run dev
```

The API will be available at `http://localhost:3000`

### 2. Mobile App Setup

```bash
cd mobile-app

# Install dependencies
npm install

# Start Expo
npm start
```

Scan the QR code with Expo Go app on your phone.

### 3. Admin Portal Setup

```bash
cd admin-portal

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

## API Endpoints

### Authentication
- `POST /api/auth/otp/send` - Send OTP to phone
- `POST /api/auth/otp/verify` - Verify OTP
- `POST /api/auth/register` - Complete registration
- `POST /api/auth/refresh` - Refresh tokens

### Members
- `GET /api/members/me` - Get profile
- `PUT /api/members/me` - Update profile
- `GET /api/members/me/points` - Points history
- `GET /api/members/me/tier` - Tier progress

### Vouchers
- `GET /api/vouchers` - List available vouchers
- `POST /api/vouchers/:id/claim` - Claim voucher
- `GET /api/vouchers/member/list` - My vouchers

### QR Codes
- `POST /api/qr/generate/points` - Generate points QR
- `POST /api/qr/generate/voucher` - Generate voucher QR
- `POST /api/qr/validate` - Validate QR (POS)
- `POST /api/qr/consume` - Consume QR (POS)

### Transactions (3rd Party POS)
- `POST /api/transactions` - Submit transaction
- `GET /api/transactions/:id` - Get status

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET/POST /api/admin/campaigns` - Manage campaigns
- `GET/POST /api/admin/vouchers` - Manage vouchers
- `GET /api/admin/members` - List members
- `GET /api/admin/reports/*` - Reports

## Features

### Member Features
- Phone + OTP authentication
- View points balance and history
- Tier progression (Bronze → Silver → Gold → Platinum)
- Claim and redeem vouchers
- Generate QR codes for redemption

### Admin Features
- Dashboard with key metrics
- Campaign management with flexible rules
- Voucher template management
- Member management and search
- Transaction history
- Revenue and member reports

### 3rd Party Integration
- API for POS systems to submit transactions
- Real-time points/voucher awarding
- QR code validation and consumption

## Tier System

| Tier     | Points Required | Multiplier |
|----------|----------------|------------|
| Bronze   | 0 - 499        | 1.0x       |
| Silver   | 500 - 1,999    | 1.25x      |
| Gold     | 2,000 - 4,999  | 1.5x       |
| Platinum | 5,000+         | 2.0x       |

## Campaign Types

1. **Points Earn** - Award bonus points
2. **Points Multiplier** - Multiply base points
3. **Voucher Distribution** - Award vouchers
4. **Tier Bonus** - Special tier rewards

## Security

- JWT authentication with refresh tokens
- HMAC-signed QR codes
- Rate limiting on API endpoints
- API key authentication for POS systems

## Environment Variables

```env
# Backend
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loyalty_platform
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
QR_SECRET=your-qr-secret
POS_API_KEYS=key1,key2,key3
```

## License

MIT
