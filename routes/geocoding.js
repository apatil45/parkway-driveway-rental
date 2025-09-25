const express = require('express');
const router = express.Router();
const geocoder = require('../utils/geocoder');

// @route   POST api/geocoding
// @desc    Geocode an address to latitude and longitude
// @access  Public
router.post('/', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ msg: 'Address is required for geocoding' });
  }

  try {
    const loc = await geocoder.geocode(address);

    if (!loc || loc.length === 0) {
      return res.status(400).json({ msg: 'Could not geocode address. Please check the address.' });
    }

    const { latitude, longitude } = loc[0];
    res.json({ latitude, longitude });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error during geocoding');
  }
});

module.exports = router;
