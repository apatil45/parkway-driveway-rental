const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const mongoSanitize = require('express-mongo-sanitize'); // Import mongoSanitize
const xss = require('xss-clean'); // Import xss-clean

const app = express();
const PORT = process.env.PORT || 3000;
const errorHandler = require('./middleware/error'); // Import the error handler

// Connect Database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error(err));

// Init Middleware
app.use(express.json({ extended: false }));

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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
