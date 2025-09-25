const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const Booking = require('../models/BookingPG');

// @route   POST api/payments/create-payment-intent
// @desc    Create a Stripe Payment Intent
// @access  Private (Driver only)
router.post('/create-payment-intent', auth, async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.driver !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized to make payment for this booking' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: 'usd',
      metadata: { booking_id: booking.id },
    });

    await booking.update({
      stripePaymentId: paymentIntent.id
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Create Payment Intent Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to create payment intent' });
  }
});

// @route   POST api/payments/confirm-payment
// @desc    Confirm payment and update booking status
// @access  Private (Driver only)
router.post('/confirm-payment', auth, async (req, res) => {
  const { bookingId, paymentIntentId } = req.body;

  try {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.driver !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized to confirm payment for this booking' });
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
        booking: booking
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (err) {
    console.error('Confirm Payment Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to confirm payment' });
  }
});

module.exports = router;
