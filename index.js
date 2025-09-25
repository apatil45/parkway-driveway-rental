const express = require('express');
const mongoose = require('mongoose');
const sequelize = require('./models/database'); // PostgreSQL connection
require('dotenv').config();
const mongoSanitize = require('express-mongo-sanitize'); // Import mongoSanitize
const xss = require('xss-clean'); // Import xss-clean

const app = express();
const PORT = process.env.PORT || 3000;
const errorHandler = require('./middleware/error'); // Import the error handler

// Connect Database (MongoDB for local, PostgreSQL for production)
if (process.env.DATABASE_URL) {
  // Production: Use PostgreSQL
  sequelize.authenticate()
    .then(() => {
      console.log('PostgreSQL connected...');
      return sequelize.sync({ alter: true }); // Create/update tables
    })
    .then(() => console.log('Database synchronized'))
    .catch(err => console.error('PostgreSQL connection error:', err));
} else {
  // Local: Use MongoDB
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error(err));
}

// Init Middleware
app.use(express.json({ extended: false }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
}

// Define Routes
app.use('/api/driveways', require('./routes/driveways'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/geocoding', require('./routes/geocoding')); // New geocoding route

// Sanitize data (after routes to ensure req.query is writable)
app.use(mongoSanitize());
app.use(xss());

// Error handling middleware (should be last middleware)
app.use(errorHandler);

// Serve frontend for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
