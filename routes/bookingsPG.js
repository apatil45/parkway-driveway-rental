const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Booking = require('../models/BookingPG');
const Driveway = require('../models/DrivewayPG');
const User = require('../models/UserPG');
const { authenticateToken: auth } = require('../middleware/auth');

// Middleware to check if user is a driver
const isDriver = (req, res, next) => {
  if (!req.user.roles || !req.user.roles.includes('driver')) {
    return res.status(403).json({ msg: 'Access denied. Only drivers can perform this action.' });
  }
  next();
};

// @route   POST api/bookings
// @desc    Create a new booking
// @access  Private (Driver only)
router.post('/', auth, isDriver, async (req, res) => {
  const { 
    driveway, 
    startTime, 
    endTime, 
    totalAmount, 
    driverLocation, 
    specialRequests,
    stripePaymentId 
  } = req.body;

  console.log('Booking request body:', req.body);
  const driverId = req.user.id;

  try {
    console.log('Validating booking data:', { driveway, startTime, endTime, totalAmount });
    
    // Validate required fields
    if (!driveway || !startTime || !endTime || !totalAmount) {
      console.log('Missing required fields:', { driveway, startTime, endTime, totalAmount });
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Driveway, start time, end time, and total amount are required'
      });
    }

    const drivewayFound = await Driveway.findByPk(driveway);
    if (!drivewayFound) {
      return res.status(404).json({ error: 'Driveway not found' });
    }

    // Prevent users from booking their own driveways
    if (drivewayFound.owner === driverId) {
      return res.status(400).json({ 
        error: 'Cannot book your own driveway',
        message: 'You cannot book a driveway that you own. Please select a different driveway.'
      });
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);

    // Validate date/time logic
    if (newStartTime >= newEndTime) {
      return res.status(400).json({ 
        error: 'Invalid time range',
        message: 'End time must be after start time'
      });
    }

    // Check if booking is in the past
    if (newStartTime < new Date()) {
      return res.status(400).json({ 
        error: 'Cannot book in the past',
        message: 'Booking start time cannot be in the past'
      });
    }

    // Check if booking is too far in the future (6 months)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    if (newStartTime > maxDate) {
      return res.status(400).json({ 
        error: 'Booking too far in advance',
        message: 'Cannot book more than 6 months in advance'
      });
    }

    // Check driveway availability for the requested day/time
    const requestedDate = new Date(startTime);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayAvailability = drivewayFound.availability.find(av => av.dayOfWeek === dayOfWeek);

    if (!dayAvailability || !dayAvailability.isAvailable) {
      return res.status(400).json({ 
        error: 'Driveway not available',
        message: 'Driveway is not available on this day'
      });
    }

    // Check if requested time is within driveway availability hours
    const startTimeStr = newStartTime.toTimeString().slice(0, 5);
    const endTimeStr = newEndTime.toTimeString().slice(0, 5);
    
    if (startTimeStr < dayAvailability.startTime || endTimeStr > dayAvailability.endTime) {
      return res.status(400).json({ 
        error: 'Outside availability hours',
        message: `Driveway is only available from ${dayAvailability.startTime} to ${dayAvailability.endTime}`
      });
    }

    // Check for conflicts with existing bookings
    const existingBookings = await Booking.findAll({
      where: {
        driveway: driveway,
        status: ['pending', 'confirmed'],
        [Op.or]: [
          {
            startDate: {
              [Op.lte]: newEndTime
            },
            endDate: {
              [Op.gte]: newStartTime
            }
          }
        ]
      }
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({ 
        error: 'Time slot conflict',
        message: 'This time slot is already booked by another user',
        conflicts: existingBookings.map(booking => ({
          id: booking.id,
          startTime: booking.startDate,
          endTime: booking.endDate,
          status: booking.status
        }))
      });
    }

    // Determine booking status based on payment
    const bookingStatus = stripePaymentId ? 'confirmed' : 'pending';
    const paymentStatus = stripePaymentId ? 'paid' : 'pending';

    const newBooking = await Booking.create({
      driver: driverId,
      driveway: driveway,
      startDate: newStartTime,
      endDate: newEndTime,
      startTime: startTimeStr,
      endTime: endTimeStr,
      totalAmount: totalAmount,
      status: bookingStatus,
      paymentStatus: paymentStatus,
      stripePaymentId: stripePaymentId || null,
      driverLocation: driverLocation || null,
      specialRequests: specialRequests || null
    });

    // Send real-time notification to driveway owner
    if (global.socketService) {
      const notificationTitle = stripePaymentId ? 'New Confirmed Booking' : 'New Booking Request';
      const notificationMessage = stripePaymentId 
        ? `You have a new confirmed booking for your driveway at ${drivewayFound.address} - Payment received!`
        : `You have a new booking request for your driveway at ${drivewayFound.address}`;

      global.socketService.sendNotification(drivewayFound.owner, {
        type: 'booking_created',
        title: notificationTitle,
        message: notificationMessage,
        data: { bookingId: newBooking.id, drivewayId: driveway }
      });

      // Send booking update to booking room
      global.socketService.sendBookingUpdate(newBooking.id, {
        type: 'status_change',
        status: bookingStatus
      });
    }

    res.status(201).json({
      success: true,
      booking: {
        id: newBooking.id,
        driver: newBooking.driver,
        driveway: newBooking.driveway,
        startDate: newBooking.startDate,
        endDate: newBooking.endDate,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        totalAmount: newBooking.totalAmount,
        status: newBooking.status,
        paymentStatus: newBooking.paymentStatus,
        stripePaymentId: newBooking.stripePaymentId,
        driverLocation: newBooking.driverLocation,
        specialRequests: newBooking.specialRequests
      }
    });
  } catch (err) {
    console.error('Create Booking Error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to create booking',
      error: err.message 
    });
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

    // Send real-time notifications
    if (global.socketService) {
      if (status === 'confirmed') {
        // Notify driveway owner about confirmed booking
        const driveway = await Driveway.findByPk(booking.driveway);
        if (driveway) {
          global.socketService.sendNotification(driveway.owner, {
            type: 'booking_confirmed',
            title: 'Booking Confirmed',
            message: `Your driveway booking has been confirmed and payment received`,
            data: { bookingId: booking.id, drivewayId: driveway.id }
          });
        }

        // Notify driver about confirmation
        global.socketService.sendNotification(booking.driver, {
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: `Your booking has been confirmed and payment processed`,
          data: { bookingId: booking.id }
        });
      }

      // Send booking update to booking room
      global.socketService.sendBookingUpdate(booking.id, {
        type: 'status_change',
        status: status
      });
    }

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

    // Send real-time notifications
    if (global.socketService) {
      // Notify driveway owner about cancelled booking
      if (driveway) {
        global.socketService.sendNotification(driveway.owner, {
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          message: `A booking for your driveway has been cancelled`,
          data: { bookingId: booking.id, drivewayId: driveway.id }
        });
      }

      // Notify driver about cancellation
      global.socketService.sendNotification(booking.driver, {
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Your booking has been cancelled`,
        data: { bookingId: booking.id }
      });

      // Send booking update to booking room
      global.socketService.sendBookingUpdate(booking.id, {
        type: 'status_change',
        status: 'cancelled'
      });
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

// @route   GET /api/bookings/owner/:owner_id
// @desc    Get all bookings for a driveway owner
// @access  Private (Owner only)
router.get('/owner/:owner_id', auth, async (req, res) => {
  try {
    const ownerId = req.params.owner_id;
    
    // Verify the requesting user is the owner
    if (req.user.id !== ownerId) {
      return res.status(403).json({ error: 'Not authorized to view these bookings' });
    }
    
    const bookings = await Booking.findAll({
      where: {},
      include: [
        {
          model: Driveway,
          as: 'drivewayInfo',
          where: { owner: ownerId },
          attributes: ['id', 'address', 'description']
        },
        {
          model: User,
          as: 'driverInfo',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json(bookings);
  } catch (err) {
    console.error('Get Owner Bookings Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch owner bookings' });
  }
});

// @route   GET /api/bookings/stats
// @desc    Get booking statistics for user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];
    
    let stats = {};
    
    if (userRoles.includes('driver')) {
      const driverBookings = await Booking.count({
        where: { driver: userId }
      });
      
      const confirmedBookings = await Booking.count({
        where: { driver: userId, status: 'confirmed' }
      });
      
      const pendingBookings = await Booking.count({
        where: { driver: userId, status: 'pending' }
      });
      
      stats.driver = {
        totalBookings: driverBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings: driverBookings - confirmedBookings - pendingBookings
      };
    }
    
    if (userRoles.includes('owner')) {
      const ownerBookings = await Booking.count({
        include: [{
          model: Driveway,
          as: 'drivewayInfo',
          where: { owner: userId }
        }]
      });
      
      const confirmedOwnerBookings = await Booking.count({
        where: { status: 'confirmed' },
        include: [{
          model: Driveway,
          as: 'drivewayInfo',
          where: { owner: userId }
        }]
      });
      
      stats.owner = {
        totalBookings: ownerBookings,
        confirmedBookings: confirmedOwnerBookings,
        pendingBookings: ownerBookings - confirmedOwnerBookings
      };
    }
    
    res.json(stats);
  } catch (err) {
    console.error('Get Booking Stats Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch booking statistics' });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel a booking (Driver only)
// @access  Private
router.delete('/:id', auth, isDriver, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const driverId = req.user.id;

    // Find the booking and verify ownership
    const booking = await Booking.findOne({
      where: { 
        id: bookingId, 
        driver: driverId 
      },
      include: [
        {
          model: Driveway,
          as: 'drivewayInfo',
          attributes: ['id', 'address', 'owner']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ 
        error: 'Booking not found',
        message: 'Booking not found or you do not have permission to cancel it'
      });
    }

    // Check if booking can be cancelled (only pending bookings can be cancelled)
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot cancel booking',
        message: 'Only pending bookings can be cancelled'
      });
    }

    // Update booking status to cancelled
    await booking.update({ 
      status: 'cancelled',
      updated_at: new Date()
    });

    // Send notification to owner via socket
    const io = req.app.get('io');
    if (io) {
      io.to(booking.drivewayInfo.owner).emit('booking_update', {
        type: 'booking_cancelled',
        bookingId: booking.id,
        driverId: driverId,
        drivewayId: booking.driveway,
        message: 'A booking has been cancelled'
      });
    }

    res.json({ 
      message: 'Booking cancelled successfully',
      booking: {
        id: booking.id,
        status: booking.status
      }
    });

  } catch (err) {
    console.error('Cancel Booking Error:', err.message);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'Failed to cancel booking' 
    });
  }
});

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm a booking (Owner only)
// @access  Private
router.put('/:id/confirm', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const ownerId = req.user.id;

    // Find the booking and verify ownership of the driveway
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        {
          model: Driveway,
          as: 'drivewayInfo',
          where: { owner: ownerId },
          attributes: ['id', 'address', 'owner']
        },
        {
          model: User,
          as: 'driverInfo',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ 
        error: 'Booking not found',
        message: 'Booking not found or you do not have permission to confirm it'
      });
    }

    // Check if booking can be confirmed (only pending bookings can be confirmed)
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot confirm booking',
        message: 'Only pending bookings can be confirmed'
      });
    }

    // Update booking status to confirmed
    await booking.update({ 
      status: 'confirmed',
      updated_at: new Date()
    });

    // Send notification to driver via socket
    const io = req.app.get('io');
    if (io) {
      io.to(booking.driver).emit('booking_update', {
        type: 'booking_confirmed',
        bookingId: booking.id,
        ownerId: ownerId,
        drivewayId: booking.driveway,
        message: 'Your booking has been confirmed'
      });
    }

    res.json({ 
      message: 'Booking confirmed successfully',
      booking: {
        id: booking.id,
        status: booking.status
      }
    });

  } catch (err) {
    console.error('Confirm Booking Error:', err.message);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'Failed to confirm booking' 
    });
  }
});

// @route   PUT /api/bookings/:id/reject
// @desc    Reject a booking (Owner only)
// @access  Private
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const ownerId = req.user.id;

    // Find the booking and verify ownership of the driveway
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        {
          model: Driveway,
          as: 'drivewayInfo',
          where: { owner: ownerId },
          attributes: ['id', 'address', 'owner']
        },
        {
          model: User,
          as: 'driverInfo',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ 
        error: 'Booking not found',
        message: 'Booking not found or you do not have permission to reject it'
      });
    }

    // Check if booking can be rejected (only pending bookings can be rejected)
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot reject booking',
        message: 'Only pending bookings can be rejected'
      });
    }

    // Update booking status to rejected
    await booking.update({ 
      status: 'rejected',
      updated_at: new Date()
    });

    // Send notification to driver via socket
    const io = req.app.get('io');
    if (io) {
      io.to(booking.driver).emit('booking_update', {
        type: 'booking_rejected',
        bookingId: booking.id,
        ownerId: ownerId,
        drivewayId: booking.driveway,
        message: 'Your booking has been rejected'
      });
    }

    res.json({ 
      message: 'Booking rejected successfully',
      booking: {
        id: booking.id,
        status: booking.status
      }
    });

  } catch (err) {
    console.error('Reject Booking Error:', err.message);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'Failed to reject booking' 
    });
  }
});

module.exports = router;
