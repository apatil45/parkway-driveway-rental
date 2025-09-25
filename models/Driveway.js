const mongoose = require('mongoose');

const DrivewaySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // We will create a User model later
    required: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  description: {
    type: String
  },
  images: [
    {
      type: String
    }
  ],
  pricePerHour: {
    type: Number,
    required: true,
    default: 0
  },
  availability: [
    {
      date: { type: Date, required: true },
      startTime: { type: String, required: true }, // e.g., "09:00"
      endTime: { type: String, required: true },   // e.g., "17:00"
      pricePerHour: { type: Number, required: true, default: 0 } // New field for dynamic pricing
    }
  ],
  isAvailable: {
    type: Boolean,
    default: true
  },
  carSizeCompatibility: [{
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
    default: ['small', 'medium']
  }],
  drivewaySize: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
    default: 'medium'
  },
  bookedSlots: [
    {
      driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      startTime: { type: Date, required: true },
      endTime: { type: Date, required: true },
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

DrivewaySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Driveway', DrivewaySchema);
