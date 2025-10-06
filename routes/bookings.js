const express = require('express');
const { Booking, Driveway, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get user's bookings
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Driveway,
          as: 'driveway',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName', 'phone']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { bookings }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings'
    });
  }
});

// Create booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { drivewayId, startTime, endTime, specialInstructions } = req.body;

    // Validation
    if (!drivewayId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Driveway ID, start time, and end time are required'
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    if (start <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be in the future'
      });
    }

    // Check if driveway exists and is available
    const driveway = await Driveway.findOne({
      where: { id: drivewayId, isActive: true, isAvailable: true }
    });

    if (!driveway) {
      return res.status(404).json({
        success: false,
        message: 'Driveway not found or not available'
      });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      where: {
        drivewayId,
        status: ['pending', 'confirmed'],
        [Op.or]: [
          {
            startTime: { [Op.lt]: end },
            endTime: { [Op.gt]: start }
          }
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Calculate total price (simplified - in real app, consider duration, pricing rules, etc.)
    const duration = (end - start) / (1000 * 60 * 60); // hours
    const totalPrice = driveway.price * duration;

    // Create booking
    const booking = await Booking.create({
      drivewayId,
      userId: req.user.id,
      startTime: start,
      endTime: end,
      totalPrice,
      specialInstructions,
      status: 'pending'
    });

    // Fetch booking with related data
    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        {
          model: Driveway,
          as: 'driveway',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName', 'phone']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking: bookingWithDetails }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
});

// Update booking status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await Booking.findOne({
      where: { id, userId: req.user.id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await booking.update({ status });

    if (status === 'cancelled') {
      await booking.update({ 
        cancelledAt: new Date(),
        cancellationReason: req.body.reason || 'Cancelled by user'
      });
    }

    if (status === 'completed') {
      await booking.update({ completedAt: new Date() });
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

// Get owner's bookings
router.get('/owner', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        {
          model: Driveway,
          as: 'driveway',
          where: { ownerId: req.user.id },
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { bookings }
    });
  } catch (error) {
    console.error('Get owner bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get owner bookings'
    });
  }
});

// Cancel booking
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const { id } = req.params;

    const booking = await Booking.findOne({
      where: { id, userId: req.user.id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    await booking.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason || 'Cancelled by user'
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
});

module.exports = router;
