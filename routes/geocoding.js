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
  const { query, lat, lng, radius = 50 } = req.query;

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

    // Helper function to calculate distance between two points (Haversine formula)
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in kilometers
    };

    // Filter results to US only and format for autocomplete
    let suggestions = results
      .filter(result => {
        const country = result.country || '';
        const countryCode = result.countryCode || '';
        return country === 'United States' || 
               country === 'United States of America' ||
               countryCode === 'US' ||
               countryCode === 'USA';
      })
      .map(result => {
        // Create a clean, consistent address format
        const streetNumber = result.streetNumber || '';
        const streetName = result.streetName || '';
        const city = result.city || '';
        const state = result.state || '';
        const zipcode = result.zipcode || '';
        
        // Build address parts
        const streetAddress = [streetNumber, streetName].filter(Boolean).join(' ');
        const fullAddress = [streetAddress, city, state, zipcode].filter(Boolean).join(', ');
        
        // Calculate distance if user location is provided
        let distance = null;
        if (lat && lng && result.latitude && result.longitude) {
          distance = calculateDistance(parseFloat(lat), parseFloat(lng), result.latitude, result.longitude);
        }
        
        return {
          address: fullAddress || result.formattedAddress || query,
          latitude: result.latitude,
          longitude: result.longitude,
          city: city,
          state: state,
          country: result.country,
          zipcode: zipcode,
          distance: distance,
          formattedAddress: result.formattedAddress
        };
      })
      // Remove duplicates based on address
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.address === suggestion.address)
      );

    // Sort suggestions by relevance and distance
    suggestions = suggestions.sort((a, b) => {
      // If user location is provided, prioritize by distance
      if (lat && lng) {
        // First, filter by radius if specified
        if (radius && a.distance !== null && b.distance !== null) {
          const radiusKm = parseFloat(radius);
          const aInRadius = a.distance <= radiusKm;
          const bInRadius = b.distance <= radiusKm;
          
          if (aInRadius && !bInRadius) return -1;
          if (!aInRadius && bInRadius) return 1;
        }
        
        // Then sort by distance
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        if (a.distance !== null) return -1;
        if (b.distance !== null) return 1;
      }
      
      // Fallback: prioritize exact matches and shorter addresses
      const queryLower = query.toLowerCase();
      const aExactMatch = a.address.toLowerCase().includes(queryLower);
      const bExactMatch = b.address.toLowerCase().includes(queryLower);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then by address length (shorter is usually more specific)
      return a.address.length - b.address.length;
    })
    .slice(0, 8); // Limit to 8 results

    res.json(suggestions);

  } catch (err) {
    console.error('Autocomplete error:', err.message);
    res.status(500).json({ msg: 'Server Error during autocomplete' });
  }
});

// @route   POST api/geocoding/reverse
// @desc    Reverse geocode coordinates to address
// @access  Public
router.post('/reverse', async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ msg: 'Latitude and longitude are required for reverse geocoding' });
  }

  if (!geocoder) {
    return res.status(503).json({ msg: 'Geocoding service not configured' });
  }

  try {
    // Use OpenCage's reverse geocoding
    const results = await geocoder.reverse({ lat: latitude, lng: longitude });

    if (!results || results.length === 0) {
      return res.status(400).json({ msg: 'Could not reverse geocode coordinates' });
    }

    const result = results[0];
    
    // Create a clean, consistent address format
    const streetNumber = result.streetNumber || '';
    const streetName = result.streetName || '';
    const city = result.city || '';
    const state = result.state || '';
    const zipcode = result.zipcode || '';
    
    // Build address parts
    const streetAddress = [streetNumber, streetName].filter(Boolean).join(' ');
    const fullAddress = [streetAddress, city, state, zipcode].filter(Boolean).join(', ');
    
    res.json({ 
      address: fullAddress || result.formattedAddress || `${latitude}, ${longitude}`,
      formattedAddress: result.formattedAddress,
      city: city,
      state: state,
      zipcode: zipcode,
      country: result.country
    });

  } catch (err) {
    console.error('Reverse geocoding error:', err.message);
    res.status(500).json({ msg: 'Server Error during reverse geocoding' });
  }
});

module.exports = router;
