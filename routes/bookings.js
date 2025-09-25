const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Driveway = require('../models/Driveway');
const auth = require('../middleware/auth');

// Middleware to check if user is a driver
const isDriver = (req, res, next) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ msg: 'Access denied. Only drivers can perform this action.' });
  }
  next();
};

// @route   POST api/bookings
// @desc    Create a new booking
// @access  Private (Driver only)
router.post('/', auth, isDriver, async (req, res, next) => {
  const { driveway, startTime, endTime, totalPrice } = req.body;
  const driverId = req.user.id;


  try {
    const drivewayFound = await Driveway.findById(driveway);
    if (!drivewayFound) {
      return next(new Error('Driveway not found', { statusCode: 404 }));
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    const isConflicting = drivewayFound.bookedSlots.some(slot => {
      const existingStartTime = new Date(slot.startTime);
      const existingEndTime = new Date(slot.endTime);
      return (
        (newStartTime < existingEndTime && newEndTime > existingStartTime)
      );
    });

    if (isConflicting) {
      return next(new Error('Driveway already booked for this time slot', { statusCode: 400 }));
    }

    const newBooking = new Booking({
      driver: driverId,
      driveway: driveway,
      startTime: newStartTime,
      endTime: newEndTime,
      totalPrice,
      status: 'pending'
    });

    const booking = await newBooking.save();


    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

// @route   GET api/bookings/:id
// @desc    Get a single booking by ID
// @access  Private (will add auth middleware later)
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('driveway', ['address', 'pricePerHour']);
    if (!booking) {
      return next(new Error('Booking not found', { statusCode: 404 }));
    }
    res.json(booking);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return next(new Error('Booking not found', { statusCode: 404 }));
    }
    next(err);
  }
});

// @route   PUT api/bookings/:id
// @desc    Update a booking status (e.g., to confirmed after payment)
// @access  Private (Driver only - for payment confirmation)
router.put('/:id', auth, isDriver, async (req, res, next) => {
  const { status, paymentIntentId } = req.body;

  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new Error('Booking not found', { statusCode: 404 }));
    }

    if (booking.driver.toString() !== req.user.id) {
      return next(new Error('User not authorized', { statusCode: 401 }));
    }

    if (status) booking.status = status;
    if (paymentIntentId) booking.paymentIntentId = paymentIntentId;

    if (status === 'confirmed' && booking.isModified('status')) {
      const driveway = await Driveway.findById(booking.driveway);
      if (driveway) {
        const isAlreadyBooked = driveway.bookedSlots.some(
          (slot) => slot.bookingId && slot.bookingId.toString() === booking._id.toString()
        );

        if (!isAlreadyBooked) {
          driveway.bookedSlots.push({
            driver: booking.driver,
            startTime: booking.startTime,
            endTime: booking.endTime,
            bookingId: booking._id,
          });
          await driveway.save();
        } else {
          // console.log('Booking already exists in driveway bookedSlots, skipping update.'); // Removed console.log
        }
      }
    }

    booking = await booking.save();
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// @route   PUT api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private (Driver only)
router.put('/:id/cancel', auth, isDriver, async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);
    if (!booking) {
      return next(new Error('Booking not found', { statusCode: 404 }));
    }

    const driverId = req.user.id;
    if (booking.driver.toString() !== driverId) {
      return next(new Error('User not authorized', { statusCode: 401 }));
    }

    booking.status = 'cancelled';
    await booking.save();

    const driveway = await Driveway.findById(booking.driveway);
    if (driveway) {
      driveway.bookedSlots = driveway.bookedSlots.filter(
        slot => slot.bookingId.toString() !== booking._id.toString()
      );
      await driveway.save();
    }

    res.json(booking);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return next(new Error('Booking not found', { statusCode: 404 }));
    }
    next(err);
  }
});

// @route   GET api/bookings/driver/:driver_id
// @desc    Get all bookings for a specific driver
// @access  Private (Driver only)
router.get('/driver/:driver_id', auth, isDriver, async (req, res, next) => {
  try {
    if (req.user.id !== req.params.driver_id) {
      return next(new Error('User not authorized to view these bookings', { statusCode: 401 }));
    }
    const bookings = await Booking.find({ driver: req.user.id }).populate('driveway', ['address', 'pricePerHour']);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
