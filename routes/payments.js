const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');

// @route   POST api/payments/create-payment-intent
// @desc    Create a Stripe Payment Intent
// @access  Private (Driver only)
router.post('/create-payment-intent', auth, async (req, res, next) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      return next(error);
    }

    if (booking.driver.toString() !== req.user.id) {
      const error = new Error('Not authorized to make payment for this booking');
      error.statusCode = 401;
      return next(error);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100),
      currency: 'usd',
      metadata: { booking_id: booking._id.toString() },
    });

    booking.paymentIntentId = paymentIntent.id;
    booking.clientSecret = paymentIntent.client_secret;
    await booking.save();

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
