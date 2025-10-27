const express = require('express');
const router = express.Router();
const { supabase, db } = require('../models/supabase');
const { authenticateToken: auth } = require('../middleware/authSupabase');

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        driveways (
          id,
          address,
          description,
          price_per_hour,
          images,
          users!driveways_owner_id_fkey (
            id,
            name,
            phone_number
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Get bookings error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch bookings'
      });
    }

    res.json({
      success: true,
      bookings: bookings || [],
      total: bookings?.length || 0
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        driveways (
          id,
          address,
          description,
          price_per_hour,
          images,
          access_instructions,
          house_rules,
          users!driveways_owner_id_fkey (
            id,
            name,
            phone_number,
            email
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Get booking error:', error);
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      driveway_id,
      start_time,
      end_time,
      vehicle_info,
      special_requests
    } = req.body;

    // Validate required fields
    if (!driveway_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Driveway ID, start time, and end time are required'
      });
    }

    // Check if driveway exists and is available
    const { data: driveway, error: drivewayError } = await supabase
      .from('driveways')
      .select('price_per_hour, is_active, is_available')
      .eq('id', driveway_id)
      .single();

    if (drivewayError || !driveway) {
      return res.status(404).json({
        success: false,
        error: 'Driveway not found'
      });
    }

    if (!driveway.is_active || !driveway.is_available) {
      return res.status(400).json({
        success: false,
        error: 'Driveway is not available'
      });
    }

    // Calculate total price
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);
    const hours = (endTime - startTime) / (1000 * 60 * 60);
    const totalPrice = hours * driveway.price_per_hour;

    // Check for overlapping bookings
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('driveway_id', driveway_id)
      .eq('status', 'confirmed')
      .or(`start_time.lt.${end_time.toISOString()},end_time.gt.${start_time.toISOString()}`);

    if (overlapError) {
      console.error('Check overlap error:', overlapError);
    } else if (overlappingBookings && overlappingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Time slot is already booked'
      });
    }

    const bookingData = {
      user_id: userId,
      driveway_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'pending',
      total_price: totalPrice,
      payment_status: 'pending',
      vehicle_info: vehicle_info || {},
      special_requests
    };

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select(`
        *,
        driveways (
          id,
          address,
          description,
          price_per_hour,
          users!driveways_owner_id_fkey (
            id,
            name,
            email
          )
        )
      `)
      .single();

    if (error) {
      console.error('Create booking error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create booking'
      });
    }

    // Create notification for driveway owner
    await supabase
      .from('notifications')
      .insert([{
        user_id: booking.driveways.users.id,
        title: 'New Booking Request',
        message: `You have a new booking request for ${booking.driveways.address}`,
        type: 'booking',
        priority: 'high',
        action_url: '/owner-dashboard',
        action_text: 'View Booking',
        metadata: { booking_id: booking.id }
      }]);

    res.status(201).json({
      success: true,
      booking,
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, cancellation_reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Check if user owns this booking
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('user_id, status, driveways!inner(owner_id)')
      .eq('id', id)
      .single();

    if (checkError || !existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Allow user to cancel their own booking or owner to confirm/cancel
    const isOwner = existingBooking.driveways.owner_id === userId;
    const isUser = existingBooking.user_id === userId;

    if (!isOwner && !isUser) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this booking'
      });
    }

    const updateData = { status };
    if (cancellation_reason) {
      updateData.cancellation_reason = cancellation_reason;
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        driveways (
          id,
          address,
          users!driveways_owner_id_fkey (
            id,
            name,
            email
          )
        )
      `)
      .single();

    if (error) {
      console.error('Update booking error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking'
      });
    }

    // Create notification for the other party
    const notificationUserId = isOwner ? booking.user_id : booking.driveways.users.id;
    const notificationTitle = status === 'confirmed' ? 'Booking Confirmed' : 
                             status === 'cancelled' ? 'Booking Cancelled' : 'Booking Updated';
    const notificationMessage = status === 'confirmed' ? 
      `Your booking at ${booking.driveways.address} has been confirmed!` :
      status === 'cancelled' ? 
      `Your booking at ${booking.driveways.address} has been cancelled.` :
      `Your booking at ${booking.driveways.address} has been updated.`;

    await supabase
      .from('notifications')
      .insert([{
        user_id: notificationUserId,
        title: notificationTitle,
        message: notificationMessage,
        type: 'booking',
        priority: 'medium',
        action_url: '/driver-dashboard',
        action_text: 'View Booking',
        metadata: { booking_id: booking.id, status }
      }]);

    res.json({
      success: true,
      booking,
      message: 'Booking status updated successfully'
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking'
    });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel/delete booking
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user owns this booking
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (checkError || !existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (existingBooking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this booking'
      });
    }

    // Only allow cancellation of pending bookings
    if (existingBooking.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete confirmed booking. Please cancel instead.'
      });
    }

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete booking error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete booking'
      });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking'
    });
  }
});

module.exports = router;
