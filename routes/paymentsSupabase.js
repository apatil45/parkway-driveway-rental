const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authSupabase');
const { db } = require('../models/supabase');

// Initialize Stripe only if API key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key_here') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe configured successfully');
} else {
  console.warn('⚠️  Stripe not configured - payment functionality will be disabled');
  console.warn('Please set STRIPE_SECRET_KEY in your .env file');
}

// @route   POST api/payments/create-payment-intent-direct
// @desc    Create a Stripe Payment Intent directly (before booking creation)
// @access  Private (Driver only)
router.post('/create-payment-intent-direct', authenticateToken, async (req, res) => {
  console.log('Direct payment intent request:', req.body);
  console.log('User:', req.user.id);
  
  if (!stripe) {
    console.log('Stripe not configured');
    return res.status(503).json({ 
      success: false,
      error: 'Payment service not configured',
      message: 'Please contact support to enable payments'
    });
  }
  
  const { amount, currency = 'usd', description } = req.body;

  try {
    // Validate amount
    if (!amount || amount <= 0) {
      console.log('Invalid amount:', amount);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid amount' 
      });
    }

    console.log('Creating payment intent for amount:', amount);

    // Create payment intent with enhanced metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      description: description || 'Driveway booking payment',
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email,
        timestamp: new Date().toISOString(),
        source: 'direct_payment'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency
    });

  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment processing failed',
      message: error.message
    });
  }
});

// @route   POST api/payments/create-payment-intent
// @desc    Create a Stripe Payment Intent for a booking
// @access  Private (Driver only)
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  console.log('Payment intent request:', req.body);
  console.log('User:', req.user.id);
  
  if (!stripe) {
    console.log('Stripe not configured');
    return res.status(503).json({ 
      success: false,
      error: 'Payment service not configured',
      message: 'Please contact support to enable payments'
    });
  }
  
  const { bookingId, drivewayId, amount, currency = 'usd' } = req.body;

  try {
    // Validate required fields
    if (!bookingId || !drivewayId || !amount) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: bookingId, drivewayId, amount' 
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid amount' 
      });
    }

    // Get booking and driveway details for metadata
    const booking = await db.getBookingById(bookingId);
    const driveway = await db.getDrivewayById(drivewayId);

    if (!booking || !driveway) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking or driveway not found' 
      });
    }

    // Verify booking belongs to user
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized access to booking' 
      });
    }

    console.log('Creating payment intent for booking:', bookingId);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      description: `Driveway booking - ${driveway.address}`,
      metadata: {
        bookingId: bookingId,
        drivewayId: drivewayId,
        userId: req.user.id,
        userEmail: req.user.email,
        drivewayAddress: driveway.address,
        bookingStartTime: booking.start_time,
        bookingEndTime: booking.end_time,
        timestamp: new Date().toISOString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency,
      booking: {
        id: booking.id,
        drivewayAddress: driveway.address,
        startTime: booking.start_time,
        endTime: booking.end_time
      }
    });

  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment processing failed',
      message: error.message
    });
  }
});

// @route   POST api/payments/confirm-payment
// @desc    Confirm a payment and update booking status
// @access  Private (Driver only)
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  console.log('Payment confirmation request:', req.body);
  console.log('User:', req.user.id);
  
  const { paymentIntentId, bookingId } = req.body;

  try {
    // Validate required fields
    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: paymentIntentId, bookingId' 
      });
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment intent not found' 
      });
    }

    // Verify payment belongs to user
    if (paymentIntent.metadata.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized access to payment' 
      });
    }

    // Check payment status
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        success: false,
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }

    // Update booking status to confirmed
    const updatedBooking = await db.updateBooking(bookingId, {
      status: 'confirmed',
      payment_intent_id: paymentIntentId,
      payment_status: 'completed',
      payment_amount: paymentIntent.amount / 100, // Convert from cents
      payment_currency: paymentIntent.currency,
      payment_completed_at: new Date().toISOString()
    });

    console.log('Booking confirmed:', bookingId);

    res.json({
      success: true,
      message: 'Payment confirmed and booking updated',
      booking: updatedBooking,
      payment: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment confirmation failed',
      message: error.message
    });
  }
});

// @route   POST api/payments/cancel-payment
// @desc    Cancel a payment intent
// @access  Private (Driver only)
router.post('/cancel-payment', authenticateToken, async (req, res) => {
  console.log('Payment cancellation request:', req.body);
  console.log('User:', req.user.id);
  
  const { paymentIntentId } = req.body;

  try {
    // Validate required fields
    if (!paymentIntentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required field: paymentIntentId' 
      });
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({ 
        success: false,
        error: 'Payment intent not found' 
      });
    }

    // Verify payment belongs to user
    if (paymentIntent.metadata.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized access to payment' 
      });
    }

    // Cancel payment intent if it's still in a cancellable state
    if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_confirmation') {
      const cancelledPayment = await stripe.paymentIntents.cancel(paymentIntentId);
      
      console.log('Payment cancelled:', paymentIntentId);

      res.json({
        success: true,
        message: 'Payment cancelled successfully',
        payment: {
          id: cancelledPayment.id,
          status: cancelledPayment.status
        }
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: 'Payment cannot be cancelled',
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Payment cancellation error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment cancellation failed',
      message: error.message
    });
  }
});

// @route   GET api/payments/payment-methods
// @desc    Get user's saved payment methods
// @access  Private (Driver only)
router.get('/payment-methods', authenticateToken, async (req, res) => {
  console.log('Get payment methods request for user:', req.user.id);
  
  if (!stripe) {
    console.log('Stripe not configured');
    return res.status(503).json({ 
      success: false,
      error: 'Payment service not configured',
      message: 'Please contact support to enable payments'
    });
  }

  try {
    // Get user's payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: req.user.stripe_customer_id,
      type: 'card',
    });

    console.log('Found payment methods:', paymentMethods.data.length);

    res.json({
      success: true,
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year
        },
        isDefault: pm.id === req.user.default_payment_method_id
      }))
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment methods',
      message: error.message
    });
  }
});

module.exports = router;
