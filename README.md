# Parkway - Driveway Rental Platform

A marketplace platform connecting drivers with available parking spaces. Property owners can list their driveways and earn passive income, while drivers can find convenient parking near their destination.

## Overview

Parkway enables property owners to monetize unused parking spaces and helps drivers find affordable, convenient parking. The platform features real-time availability, secure payments, and an intuitive booking system.

## Features

### For Property Owners
- List driveways with photos and availability
- Set custom pricing and schedules
- Manage bookings and earnings
- View analytics and performance metrics

### For Drivers
- Search available parking by location
- Interactive map with real-time availability
- Secure payment processing
- Mobile-responsive booking experience

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 8 or higher

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd driveway-rental
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp env.template .env.local
```

Update `.env.local` with your configuration values.

4. Set up the database
```bash
npm run db:generate
npm run db:migrate
```

5. Start the development server
```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

## Project Structure

```
driveway-rental/
├── apps/
│   └── web/              # Next.js application
├── packages/
│   ├── database/         # Database schema and client
│   └── shared/           # Shared utilities and types
└── docs/                 # Documentation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run db:generate` - Generate database client
- `npm run db:migrate` - Run database migrations

## Environment Variables

Required environment variables are documented in `env.template`. Key variables include:

- Database connection string
- Authentication secrets
- Payment processing keys
- File storage configuration
