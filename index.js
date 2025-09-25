const express = require('express');
const mongoose = require('mongoose');
const sequelize = require('./models/database'); // PostgreSQL connection
require('dotenv').config();
// Security middleware removed due to compatibility issues with Express 5

const app = express();
const PORT = process.env.PORT || 3000;
const errorHandler = require('./middleware/error'); // Import the error handler

// Connect Database (MongoDB for local, PostgreSQL for production)
if (process.env.DATABASE_URL) {
  // Production: Use PostgreSQL
  console.log('Using PostgreSQL for production...');
  sequelize.authenticate()
    .then(() => {
      console.log('PostgreSQL connected...');
      return sequelize.sync({ alter: true }); // Create/update tables
    })
    .then(() => console.log('Database synchronized'))
    .catch(err => console.error('PostgreSQL connection error:', err));
} else if (process.env.MONGO_URI) {
  // Local: Use MongoDB
  console.log('Using MongoDB for local development...');
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.log('No database connection configured. Please set DATABASE_URL or MONGO_URI.');
}

// Init Middleware
app.use(express.json({ extended: false }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
}

// Define Routes (use PostgreSQL routes in production)
app.use('/api/driveways', process.env.DATABASE_URL ? require('./routes/drivewaysPG') : require('./routes/driveways'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/auth', process.env.DATABASE_URL ? require('./routes/authPG') : require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/geocoding', require('./routes/geocoding')); // New geocoding route

// Security middleware disabled for compatibility with Express 5

// Error handling middleware (should be last middleware)
app.use(errorHandler);

// Serve frontend for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
