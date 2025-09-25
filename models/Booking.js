const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driveway: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driveway',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String
  },
  clientSecret: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', BookingSchema);
