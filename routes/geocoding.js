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

  if (!geocoder) {
    return res.status(503).json({ msg: 'Geocoding service not configured' });
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

// @route   GET api/geocoding/autocomplete
// @desc    Get address suggestions for autocomplete
// @access  Public
router.get('/autocomplete', async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ msg: 'Query must be at least 2 characters long' });
  }

  if (!geocoder) {
    return res.status(503).json({ msg: 'Geocoding service not configured' });
  }

  try {
    // Use OpenCage's forward geocoding with limit for autocomplete
    const results = await geocoder.geocode(query.trim(), { 
      limit: 20 // Get more results to filter from
    });

    if (!results || results.length === 0) {
      return res.json([]);
    }

    // Filter results to US only and format for autocomplete
    const suggestions = results
      .filter(result => {
        const country = result.country || '';
        const countryCode = result.countryCode || '';
        return country === 'United States' || 
               country === 'United States of America' ||
               countryCode === 'US' ||
               countryCode === 'USA';
      })
      .slice(0, 5) // Limit to 5 results
      .map(result => ({
        address: result.formattedAddress || `${result.streetNumber || ''} ${result.streetName || ''} ${result.city || ''} ${result.state || ''} ${result.zipcode || ''}`.trim(),
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        state: result.state,
        country: result.country,
        zipcode: result.zipcode
      }));

    res.json(suggestions);

  } catch (err) {
    console.error('Autocomplete error:', err.message);
    res.status(500).json({ msg: 'Server Error during autocomplete' });
  }
});

module.exports = router;
