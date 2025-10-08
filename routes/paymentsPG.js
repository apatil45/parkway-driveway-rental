const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const Booking = require('../models/BookingPG');
const Driveway = require('../models/DrivewayPG');
const User = require('../models/UserPG');

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
router.post('/create-payment-intent-direct', auth, async (req, res) => {
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
      currency: currency,
      metadata: { 
        user_id: req.user.id,
        user_name: req.user.name || 'Unknown',
        description: description || 'Parkway.com driveway booking'
      },
      description: description || `Parkway.com booking - $${amount}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);
    console.log('Client secret:', paymentIntent.client_secret);

    res.json({ 
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      currency: currency,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error('Create Direct Payment Intent Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error', 
      message: 'Failed to create payment intent' 
    });
  }
});

// @route   POST api/payments/create-payment-intent
// @desc    Create a Stripe Payment Intent
// @access  Private (Driver only)
router.post('/create-payment-intent', auth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ 
      success: false,
      error: 'Payment service not configured',
      message: 'Please contact support to enable payments'
    });
  }
  
  const { bookingId } = req.body;

  try {
    // Validate booking exists and belongs to user
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Driveway, as: 'drivewayInfo' },
        { model: User, as: 'driverInfo' }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking not found' 
      });
    }

    if (booking.driver !== req.user.id) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authorized to make payment for this booking' 
      });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ 
        success: false,
        error: 'Booking already paid' 
      });
    }

    // Create payment intent with enhanced metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: { 
        booking_id: booking.id,
        driver_id: booking.driver,
        driveway_id: booking.driveway,
        driver_name: booking.driverInfo?.name || 'Unknown',
        driveway_address: booking.drivewayInfo?.address || 'Unknown'
      },
      description: `Parkway.com booking for ${booking.drivewayInfo?.address || 'driveway'}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update booking with payment intent ID
    await booking.update({
      stripePaymentId: paymentIntent.id,
      paymentStatus: 'pending'
    });

    res.json({ 
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: booking.totalAmount,
      currency: 'usd'
    });
  } catch (err) {
    console.error('Create Payment Intent Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error', 
      message: 'Failed to create payment intent' 
    });
  }
});

// @route   POST api/payments/confirm-payment
// @desc    Confirm payment and update booking status
// @access  Private (Driver only)
router.post('/confirm-payment', auth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ 
      success: false,
      error: 'Payment service not configured' 
    });
  }
  
  const { bookingId, paymentIntentId } = req.body;

  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Driveway, as: 'drivewayInfo' },
        { model: User, as: 'driverInfo' }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking not found' 
      });
    }

    if (booking.driver !== req.user.id) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authorized to confirm payment for this booking' 
      });
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      await booking.update({
        status: 'confirmed',
        paymentStatus: 'paid',
        stripePaymentId: paymentIntentId
      });

      res.json({ 
        success: true, 
        message: 'Payment confirmed successfully',
        booking: {
          id: booking.id,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.totalAmount,
          startDate: booking.startDate,
          endDate: booking.endDate
        }
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }
  } catch (err) {
    console.error('Confirm Payment Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error', 
      message: 'Failed to confirm payment' 
    });
  }
});

// @route   GET api/payments/status/:bookingId
// @desc    Get payment status for a booking
// @access  Private
router.get('/status/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Driveway, as: 'drivewayInfo' },
        { model: User, as: 'driverInfo' }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking not found' 
      });
    }

    // Check if user has access to this booking
    if (booking.driver !== req.user.id && booking.drivewayInfo?.owner !== req.user.id) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authorized to view this booking' 
      });
    }

    let paymentStatus = booking.paymentStatus;
    let stripeStatus = null;

    // If we have a Stripe payment ID, get the latest status
    if (booking.stripePaymentId && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentId);
        stripeStatus = paymentIntent.status;
      } catch (stripeErr) {
        console.warn('Could not retrieve Stripe payment status:', stripeErr.message);
      }
    }

    res.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        stripeStatus: stripeStatus,
        totalAmount: booking.totalAmount,
        stripePaymentId: booking.stripePaymentId
      }
    });
  } catch (err) {
    console.error('Get Payment Status Error:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error', 
      message: 'Failed to get payment status' 
    });
  }
});

// @route   POST api/payments/webhook
// @desc    Handle Stripe webhooks for payment events
// @access  Public (Stripe webhook)
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment service not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update booking status
      try {
        const booking = await Booking.findOne({
          where: { stripePaymentId: paymentIntent.id }
        });
        
        if (booking) {
          await booking.update({
            status: 'confirmed',
            paymentStatus: 'paid'
          });
          console.log('Booking updated:', booking.id);
        }
      } catch (updateErr) {
        console.error('Failed to update booking:', updateErr.message);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Update booking status
      try {
        const booking = await Booking.findOne({
          where: { stripePaymentId: failedPayment.id }
        });
        
        if (booking) {
          await booking.update({
            paymentStatus: 'failed'
          });
          console.log('Booking payment status updated to failed:', booking.id);
        }
      } catch (updateErr) {
        console.error('Failed to update booking payment status:', updateErr.message);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

module.exports = router;
