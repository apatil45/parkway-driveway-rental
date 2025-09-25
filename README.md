# 🚗 Parkway.com - Premium Driveway Rental Platform

A modern, full-stack web application for renting and listing private driveway parking spaces. Built with React, Node.js, and PostgreSQL.

![Parkway.com](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/Frontend-React%2018-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)

## ✨ Features

### 🎯 Core Functionality
- **User Authentication** - Secure login/logout with persistent sessions
- **Role-Based Access** - Separate interfaces for drivers and driveway owners
- **Advanced Search** - Filter by location, car size, availability, and price
- **Interactive Maps** - Visual driveway locations with click-to-book functionality
- **Smart Booking System** - Real-time availability and instant booking
- **Payment Integration** - Secure payments powered by Stripe

### 🎨 User Experience
- **Professional UI/UX** - Modern design with glassmorphism effects
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Real-time Validation** - Instant feedback on forms and inputs
- **Contextual Navigation** - Smart navigation based on user role and status
- **Personalized Dashboard** - Tailored experience for each user type

### 🔧 Technical Features
- **Car Size Compatibility** - Match vehicles to appropriate driveway sizes
- **Multi-step Forms** - Intuitive driveway listing with progress indicators
- **Error Boundaries** - Graceful error handling throughout the application
- **Help System** - Built-in tooltips and user guidance
- **Progressive Enhancement** - Works with or without JavaScript

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Axios** for API communication
- **Leaflet** for interactive maps
- **Stripe Elements** for payments
- **Custom CSS** with modern design patterns

### Backend
- **Node.js** with Express.js
- **PostgreSQL** with Sequelize ORM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Stripe** for payment processing
- **Express Validator** for input validation
- **Security middleware** (XSS protection, sanitization)

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (local or cloud)
- Stripe account for payments

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/parkway-driveway-rental.git
cd parkway-driveway-rental
```

### 2. Install dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://username:password@localhost:5432/driveway_rental

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=3000

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here

# Environment
NODE_ENV=development
```

### 4. Start the application
```bash
# Start backend server
npm run dev

# In a new terminal, start frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 🏗️ Project Structure

```
parkway-driveway-rental/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   └── package.json
├── routes/                  # Express API routes
├── models/                  # PostgreSQL models
├── middleware/              # Express middleware
├── utils/                   # Utility functions
├── index.js                 # Server entry point
└── package.json
```

## 🎭 User Roles

### 🚗 Drivers
- Search for available parking spots
- Filter by location, price, and car size compatibility
- Book driveways instantly with secure payments
- Manage booking history and preferences
- Rate and review driveway experiences

### 🏠 Driveway Owners
- List driveways with detailed information
- Set pricing, availability, and car size restrictions
- Manage multiple driveway listings
- Track earnings and booking analytics
- Communicate with drivers

## 🔐 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcryptjs
- **Input Sanitization** to prevent XSS attacks
- **SQL Injection Protection** with Sequelize ORM
- **Rate Limiting** to prevent abuse
- **HTTPS Enforcement** in production

## 🎨 Design System

- **Custom CSS** with modern design patterns
- **Glassmorphism** effects for premium feel
- **Gradient Animations** for visual appeal
- **Responsive Grid System** for all screen sizes
- **Accessibility** features throughout
- **Dark Mode** support (system preference)

## 📱 Mobile Experience

- **Touch-friendly** interface design
- **Responsive navigation** with mobile menu
- **Optimized forms** for mobile input
- **Fast loading** with optimized assets
- **PWA-ready** architecture

## 🚀 Deployment

### Frontend (Vercel)
The frontend is optimized for deployment on Vercel with automatic builds and deployments.

### Backend (Railway/Heroku)
The backend can be deployed to Railway, Heroku, or any Node.js hosting platform.

### Database (PostgreSQL)
Recommended to use PostgreSQL cloud hosting (Render, Heroku, AWS RDS) for production database hosting.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Stripe** for secure payment processing
- **PostgreSQL** for robust relational database solutions
- **Leaflet** for interactive mapping
- **Vercel** for seamless deployment

## 📞 Support

For support, email support@parkway.com or create an issue on GitHub.

---

**Built with ❤️ by the Parkway.com Team**
