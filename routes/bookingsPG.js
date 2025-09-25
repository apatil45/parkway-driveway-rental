const express = require('express');
const router = express.Router();
const Booking = require('../models/BookingPG');
const Driveway = require('../models/DrivewayPG');
const User = require('../models/UserPG');
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
router.post('/', auth, isDriver, async (req, res) => {
  const { driveway, startTime, endTime, totalPrice } = req.body;
  const driverId = req.user.id;

  try {
    const drivewayFound = await Driveway.findByPk(driveway);
    if (!drivewayFound) {
      return res.status(404).json({ error: 'Driveway not found' });
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    // Check for conflicts in booked slots
    if (drivewayFound.bookedSlots && Array.isArray(drivewayFound.bookedSlots)) {
      const isConflicting = drivewayFound.bookedSlots.some(slot => {
        const existingStartTime = new Date(slot.startTime);
        const existingEndTime = new Date(slot.endTime);
        return (
          (newStartTime < existingEndTime && newEndTime > existingStartTime)
        );
      });

      if (isConflicting) {
        return res.status(400).json({ error: 'Driveway already booked for this time slot' });
      }
    }

    const newBooking = await Booking.create({
      driver: driverId,
      driveway: driveway,
      startTime: newStartTime,
      endTime: newEndTime,
      totalAmount: totalPrice,
      status: 'pending'
    });

    res.status(201).json(newBooking);
  } catch (err) {
    console.error('Create Booking Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to create booking' });
  }
});

// @route   GET api/bookings/:id
// @desc    Get a single booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{
        model: Driveway,
        as: 'drivewayInfo',
        attributes: ['address', 'pricePerHour']
      }]
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (err) {
    console.error('Get Booking Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch booking' });
  }
});

// @route   PUT api/bookings/:id
// @desc    Update a booking status (e.g., to confirmed after payment)
// @access  Private (Driver only - for payment confirmation)
router.put('/:id', auth, isDriver, async (req, res) => {
  const { status, paymentIntentId } = req.body;

  try {
    let booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.driver !== req.user.id) {
      return res.status(401).json({ error: 'User not authorized' });
    }

    // Update booking fields
    const updateData = {};
    if (status) updateData.status = status;
    if (paymentIntentId) updateData.stripePaymentId = paymentIntentId;

    await booking.update(updateData);

    // If status is confirmed, add to driveway booked slots
    if (status === 'confirmed') {
      const driveway = await Driveway.findByPk(booking.driveway);
      if (driveway) {
        const bookedSlots = driveway.bookedSlots || [];
        const isAlreadyBooked = bookedSlots.some(
          (slot) => slot.bookingId && slot.bookingId === booking.id
        );

        if (!isAlreadyBooked) {
          bookedSlots.push({
            driver: booking.driver,
            startTime: booking.startTime,
            endTime: booking.endTime,
            bookingId: booking.id,
          });
          await driveway.update({ bookedSlots });
        }
      }
    }

    res.json(booking);
  } catch (err) {
    console.error('Update Booking Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to update booking' });
  }
});

// @route   PUT api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private (Driver only)
router.put('/:id/cancel', auth, isDriver, async (req, res) => {
  try {
    let booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const driverId = req.user.id;
    if (booking.driver !== driverId) {
      return res.status(401).json({ error: 'User not authorized' });
    }

    await booking.update({ status: 'cancelled' });

    // Remove from driveway booked slots
    const driveway = await Driveway.findByPk(booking.driveway);
    if (driveway && driveway.bookedSlots) {
      const updatedSlots = driveway.bookedSlots.filter(
        slot => slot.bookingId !== booking.id
      );
      await driveway.update({ bookedSlots: updatedSlots });
    }

    res.json(booking);
  } catch (err) {
    console.error('Cancel Booking Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to cancel booking' });
  }
});

// @route   GET api/bookings/driver/:driver_id
// @desc    Get all bookings for a specific driver
// @access  Private (Driver only)
router.get('/driver/:driver_id', auth, isDriver, async (req, res) => {
  try {
    if (req.user.id !== req.params.driver_id) {
      return res.status(401).json({ error: 'User not authorized to view these bookings' });
    }
    
    const bookings = await Booking.findAll({
      where: { driver: req.user.id },
      include: [{
        model: Driveway,
        as: 'drivewayInfo',
        attributes: ['address', 'pricePerHour']
      }],
      order: [['created_at', 'DESC']]
    });
    
    res.json(bookings);
  } catch (err) {
    console.error('Get Driver Bookings Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch driver bookings' });
  }
});

module.exports = router;
