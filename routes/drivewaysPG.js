const express = require('express');
const { Op } = require('sequelize');
const Driveway = require('../models/DrivewayPG');
const User = require('../models/UserPG');
const { authenticateToken: auth } = require('../middleware/auth');
const cacheService = require('../services/cacheService');
// const { validateDriveway } = require('../middleware/validation'); // Not used anymore

const router = express.Router();

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Helper function to geocode an address using OpenCage API
async function geocodeAddress(address) {
  try {
    // Use the existing geocoding service
    const geocoder = require('../utils/geocoder');
    
    if (!geocoder) {
      console.warn('Geocoding service not available, using fallback coordinates');
      return { lat: 40.7178, lng: -74.0431 }; // Default to Jersey City
    }
    
    const results = await geocoder.geocode(address);
    
    if (results && results.length > 0) {
      const { latitude, longitude } = results[0];
      return { lat: latitude, lng: longitude };
    } else {
      console.warn(`No geocoding results for address: ${address}`);
      return { lat: 40.7178, lng: -74.0431 }; // Default fallback
    }
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return { lat: 40.7178, lng: -74.0431 }; // Default fallback
  }
}

// @route   GET /api/driveways
// @desc    Get all available driveways
// @access  Public
router.get('/', cacheService.cacheMiddleware(300, () => 'driveways:all'), async (req, res) => {
  try {
    const driveways = await Driveway.findAll({
      where: { isAvailable: true },
      include: [{
        model: User,
        as: 'ownerInfo',
        attributes: ['name', 'email']
      }],
      order: [['created_at', 'DESC']],
      raw: false
    });

    // Process driveways to ensure they have coordinates
    const processedDriveways = await Promise.all(driveways.map(async (driveway) => {
      const drivewayData = driveway.toJSON();
      
      // If no coordinates, try to geocode the address
      if (!drivewayData.latitude || !drivewayData.longitude) {
        try {
          const coordinates = await geocodeAddress(drivewayData.address);
          drivewayData.coordinates = coordinates;
          
          // Update the database with the new coordinates
          await driveway.update({
            latitude: coordinates.lat,
            longitude: coordinates.lng
          });
        } catch (error) {
          console.error(`Failed to geocode address for driveway ${drivewayData.id}:`, error);
          // Use fallback coordinates
          drivewayData.coordinates = { lat: 40.7178, lng: -74.0431 };
        }
      } else {
        // Convert database coordinates to the expected format
        drivewayData.coordinates = {
          lat: parseFloat(drivewayData.latitude),
          lng: parseFloat(drivewayData.longitude)
        };
      }
      
      return drivewayData;
    }));

    res.json(processedDriveways);
  } catch (err) {
    console.error('Get Driveways Error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch driveways' });
  }
});

// @route   POST /api/driveways/:id/availability
// @desc    Check availability for a specific driveway on a given date/time
// @access  Public
router.post('/:id/availability', async (req, res) => {
  const { id } = req.params;
  const { date, startTime, endTime } = req.body;

  try {
    const driveway = await Driveway.findByPk(id);
    if (!driveway) {
      return res.status(404).json({ error: 'Driveway not found' });
    }

    // Check if the requested time slot conflicts with existing bookings
    const Booking = require('../models/BookingPG');
    const conflictingBookings = await Booking.findAll({
      where: {
        driveway: id,
        status: ['pending', 'confirmed'],
        [Op.or]: [
          {
            startDate: {
              [Op.lte]: new Date(`${date}T${endTime}:00.000Z`)
            },
            endDate: {
              [Op.gte]: new Date(`${date}T${startTime}:00.000Z`)
            }
          }
        ]
      }
    });

    // Check if the requested day/time is within driveway availability
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const dayAvailability = driveway.availability.find(av => av.dayOfWeek === dayOfWeek);

    const isAvailable = dayAvailability && dayAvailability.isAvailable && 
      startTime >= dayAvailability.startTime && 
      endTime <= dayAvailability.endTime;

    res.json({
      isAvailable,
      conflicts: conflictingBookings,
      dayAvailability: dayAvailability || null,
      message: isAvailable ? 'Time slot is available' : 'Time slot is not available'
    });
  } catch (err) {
    console.error('Availability Check Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to check availability' });
  }
});

// @route   GET /api/driveways/search
// @desc    Search for available driveways by location, date, and time
// @access  Public
router.get('/search', cacheService.cacheMiddleware(180, cacheService.generateDrivewaySearchKey), async (req, res) => {
  const {
    latitude,
    longitude,
    radius = 1000, // 1km radius - very local parking
    date,
    startTime,
    endTime,
    searchMode = 'later', // 'now' or 'later'
    duration // in minutes for 'now' mode
  } = req.query;

  try {
    let whereClause = { isAvailable: true };

    // Handle search mode and time calculations
    let searchDate, searchStartTime, searchEndTime;
    
    if (searchMode === 'now') {
      // For "Park Now" mode, use current US time + duration
      const now = new Date();
      const durationMinutes = parseInt(duration) || 120; // Default 2 hours
      const endTime = new Date(now.getTime() + (durationMinutes * 60 * 1000));
      
      // Format times for search using US timezone
      searchDate = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD format
      searchStartTime = now.toLocaleTimeString('en-US', { 
        timeZone: 'America/New_York', 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }); // HH:MM format
      searchEndTime = endTime.toLocaleTimeString('en-US', { 
        timeZone: 'America/New_York', 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }); // HH:MM format
      
      console.log('Park Now mode:', { 
        searchDate, 
        searchStartTime, 
        searchEndTime, 
        durationMinutes 
      });
    } else {
      // For "Schedule for Later" mode, use provided date/time
      searchDate = date;
      searchStartTime = startTime;
      searchEndTime = endTime;
      
      console.log('Schedule mode:', { searchDate, searchStartTime, searchEndTime });
    }

    // If location parameters are provided, we'll filter by distance
    let userLatitude, userLongitude;
    if (latitude && longitude) {
      userLatitude = parseFloat(latitude);
      userLongitude = parseFloat(longitude);
      
      if (isNaN(userLatitude) || isNaN(userLongitude)) {
        return res.status(400).json({ error: 'Invalid geographic coordinates provided.' });
      }
    }

    let driveways = await Driveway.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'ownerInfo',
        attributes: ['name', 'email']
      }],
      order: [['created_at', 'DESC']],
      raw: false
    });

    // Filter out driveways that don't have valid coordinates or are too far
    driveways = driveways.filter(driveway => {
      // Only include driveways with valid addresses
      return driveway.address && driveway.address.trim().length > 0;
    });

    // Add coordinates and distance to each driveway (optimized)
    const geocodePromises = driveways.map(async (driveway) => {
      const coordinates = await geocodeAddress(driveway.address);
      driveway.coordinates = coordinates;
      
      if (userLatitude && userLongitude) {
        const distance = calculateDistance(
          userLatitude, 
          userLongitude, 
          coordinates.lat, 
          coordinates.lng
        );
        driveway.distance = Math.round(distance * 1000); // Convert to meters and round
        
        console.log(`Driveway: ${driveway.address}`);
        console.log(`  Coordinates: ${coordinates.lat}, ${coordinates.lng}`);
        console.log(`  Distance: ${driveway.distance}m`);
        console.log(`  User location: ${userLatitude}, ${userLongitude}`);
      }
      return driveway;
    });
    
    // Wait for all geocoding to complete
    await Promise.all(geocodePromises);

    // Filter by radius if location is provided
    if (userLatitude && userLongitude && radius) {
      const radiusInMeters = parseFloat(radius);
      const beforeFilter = driveways.length;
      driveways = driveways.filter(driveway => {
        // Only include driveways within the specified radius and with valid distance
        return driveway.distance && driveway.distance <= radiusInMeters;
      });
      console.log(`Filtered driveways: ${beforeFilter} -> ${driveways.length} (radius: ${radius}m)`);
    }

    // Additional filter: Only show driveways that are actually available for booking
    const beforeAvailabilityFilter = driveways.length;
    driveways = driveways.filter(driveway => {
      // For Park Now mode, be more lenient - show all generally available driveways
      if (searchMode === 'now') {
        return driveway.isAvailable === true;
      }
      
      // For scheduled mode, check if driveway has availability data
      return driveway.isAvailable === true && 
             (driveway.availability || driveway.availability === null);
    });
    console.log(`Availability filtered: ${beforeAvailabilityFilter} -> ${driveways.length}`);

    // Sort by distance if location is provided
    if (userLatitude && userLongitude) {
      driveways.sort((a, b) => a.distance - b.distance);
    }

    // Limit results to prevent overwhelming the user
    const maxResults = 20;
    if (driveways.length > maxResults) {
      driveways = driveways.slice(0, maxResults);
      console.log(`Limited results to ${maxResults} driveways`);
    }

    // Filter by date and time if provided
    if (searchDate && searchStartTime && searchEndTime) {
      const searchDateObj = new Date(searchDate);
      if (isNaN(searchDateObj.getTime())) {
        return res.status(400).json({ error: 'Invalid date provided for search.' });
      }

      const searchYear = searchDateObj.getUTCFullYear();
      const searchMonth = searchDateObj.getUTCMonth();
      const searchDay = searchDateObj.getUTCDate();

      driveways = driveways.filter(driveway => {
        // For Park Now mode, be much more lenient - show all available driveways
        if (searchMode === 'now') {
          // Just check if driveway is generally available and has some availability
          return driveway.isAvailable === true && 
                 driveway.availability && 
                 Array.isArray(driveway.availability) && 
                 driveway.availability.length > 0;
        }

        // For scheduled mode, use exact time matching
        if (!driveway.availability || !Array.isArray(driveway.availability)) {
          return false;
        }

        const matchingAvailability = driveway.availability.find(avail => {
          // Check if availability is for day of week (legacy format) or specific date
          if (avail.dayOfWeek) {
            // Legacy format: day of week based availability
            const searchDayOfWeek = searchDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const isDayMatch = avail.dayOfWeek === searchDayOfWeek;
            
            // For scheduled mode, use exact time matching
            const isTimeMatch = searchStartTime >= avail.startTime && searchEndTime <= avail.endTime;
            return isDayMatch && isTimeMatch && avail.isAvailable;
          } else if (avail.date) {
            // New format: specific date based availability
            const availDate = new Date(avail.date);
            if (isNaN(availDate.getTime())) {
              return false;
            }

            const availYear = availDate.getUTCFullYear();
            const availMonth = availDate.getUTCMonth();
            const availDay = availDate.getUTCDate();

            const isDateMatch = (availYear === searchYear && availMonth === searchMonth && availDay === searchDay);
            
            // For scheduled mode, use exact time matching
            const isTimeMatch = searchStartTime >= avail.startTime && searchEndTime <= avail.endTime;
            return isDateMatch && isTimeMatch;
          }
          
          return false;
        });

        if (!matchingAvailability) {
          return false;
        }

        // Add price information to the driveway object
        driveway.pricePerHour = matchingAvailability.pricePerHour;

        // Check for booking conflicts
        const newSearchStartTime = new Date(`${searchDate}T${searchStartTime}:00Z`);
        const newSearchEndTime = new Date(`${searchDate}T${searchEndTime}:00Z`);

        if (isNaN(newSearchStartTime.getTime()) || isNaN(newSearchEndTime.getTime())) {
          return false;
        }

        // Check if there are any conflicting bookings
        if (driveway.bookedSlots && Array.isArray(driveway.bookedSlots)) {
          const isConflicting = driveway.bookedSlots.some(slot => {
            const existingStartTime = new Date(slot.startTime);
            const existingEndTime = new Date(slot.endTime);

            if (isNaN(existingStartTime.getTime()) || isNaN(existingEndTime.getTime())) {
              return false;
            }

            return newSearchStartTime.getTime() < existingEndTime.getTime() &&
              existingStartTime.getTime() < newSearchEndTime.getTime();
          });

          if (isConflicting) {
            return false;
          }
        }

        return true;
      });
    }

    // Enhanced response with search mode information
    const now = new Date();
    const response = {
      driveways,
      searchMode,
      searchDate,
      searchStartTime,
      searchEndTime,
      currentTime: now.toISOString(),
      currentUSTime: now.toLocaleString('en-US', { 
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      timezone: 'America/New_York',
      totalResults: driveways.length,
      userLocation: userLatitude && userLongitude ? { lat: userLatitude, lng: userLongitude } : null,
      radius: radius,
      debug: {
        searchMode,
        duration: duration,
        hasUserLocation: !!(userLatitude && userLongitude),
        drivewaysWithCoordinates: driveways.filter(d => d.coordinates).length,
        drivewaysWithDistance: driveways.filter(d => d.distance).length
      }
    };
    
    res.json(response);

  } catch (err) {
    console.error('Search Driveways Error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ error: 'Server error', message: 'Failed to search driveways' });
  }
});

// @route   GET /api/driveways/owner
// @desc    Get driveways by owner
// @access  Private
router.get('/owner', auth, async (req, res) => {
  try {
    console.log('Owner endpoint - User ID:', req.user.id);
    console.log('Owner endpoint - User ID type:', typeof req.user.id);
    console.log('Owner endpoint - User:', req.user);
    
    // Check if user.id exists and is valid
    if (!req.user.id) {
      return res.status(400).json({ error: 'User ID not found' });
    }
    
    // Try a simpler query first
    const driveways = await Driveway.findAll({
      where: { owner: req.user.id }
    });
    
    console.log('Owner endpoint - Found driveways:', driveways.length);
    res.json(driveways);
  } catch (err) {
    console.error('Get Owner Driveways Error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch owner driveways' });
  }
});

// @route   GET /api/driveways/:id
// @desc    Get a single driveway by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const driveway = await Driveway.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'ownerInfo',
        attributes: ['name', 'email']
      }]
    });
    
    if (!driveway) {
      return res.status(404).json({ msg: 'Driveway not found' });
    }
    
    res.json(driveway);
  } catch (err) {
    console.error('Get Driveway Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch driveway' });
  }
});

// @route   POST /api/driveways
// @desc    Add a new driveway
// @access  Private (Owner only)
router.post('/', auth, async (req, res) => {
  const { 
    address, 
    description, 
    images, 
    availability, 
    carSizeCompatibility, 
    drivewaySize,
    amenities,
    pricePerHour,
    isAvailable,
    specificSlots
  } = req.body;

  console.log('POST /api/driveways - User:', req.user);
  console.log('POST /api/driveways - Body:', req.body);

  try {
    // Basic validation
    if (!address) {
      return res.status(400).json({ 
        success: false,
        msg: 'Address is required' 
      });
    }

    const driveway = await Driveway.create({
      owner: req.user.id,
      address,
      description: description || '',
      images: images || [],
      availability: availability || [],
      carSizeCompatibility: carSizeCompatibility || ['small', 'medium'],
      drivewaySize: drivewaySize || 'medium',
      amenities: amenities || [],
      pricePerHour: pricePerHour || 5,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      specificSlots: specificSlots || []
    });

    res.json({
      success: true,
      driveway: {
        id: driveway.id,
        address: driveway.address,
        description: driveway.description,
        images: driveway.images,
        availability: driveway.availability,
        carSizeCompatibility: driveway.carSizeCompatibility,
        drivewaySize: driveway.drivewaySize,
        amenities: driveway.amenities,
        pricePerHour: driveway.pricePerHour,
        isAvailable: driveway.isAvailable,
        specificSlots: driveway.specificSlots,
        owner: driveway.owner
      }
    });
  } catch (err) {
    console.error('Add Driveway Error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to create driveway' 
    });
  }
});

// @route   PUT /api/driveways/:id
// @desc    Update a driveway
// @access  Private (Owner only)
router.put('/:id', auth, async (req, res) => {
  const { address, description, images, availability, carSizeCompatibility, drivewaySize, isAvailable, specificSlots, amenities, pricePerHour } = req.body;

  console.log('PUT /api/driveways/:id - User:', req.user);
  console.log('PUT /api/driveways/:id - Params:', req.params);
  console.log('PUT /api/driveways/:id - Body:', req.body);

  try {
    // Validate required fields
    if (!req.params.id) {
      return res.status(400).json({ 
        error: 'Driveway ID is required',
        message: 'Please provide a valid driveway ID'
      });
    }

    const driveway = await Driveway.findByPk(req.params.id);
    
    if (!driveway) {
      console.log('Driveway not found:', req.params.id);
      return res.status(404).json({ 
        error: 'Driveway not found',
        message: 'The driveway you are trying to update does not exist'
      });
    }

    // Check if user owns this driveway
    if (driveway.owner !== req.user.id) {
      console.log('Unauthorized access attempt:', {
        drivewayOwner: driveway.owner,
        requestingUser: req.user.id
      });
      return res.status(403).json({ 
        error: 'Not authorized',
        message: 'You can only update driveways that you own'
      });
    }

    // Validate input data
    const updateData = {};
    
    if (address !== undefined) {
      if (!address || address.trim().length < 5) {
        return res.status(400).json({
          error: 'Invalid address',
          message: 'Address must be at least 5 characters long'
        });
      }
      updateData.address = address.trim();
    }

    if (description !== undefined) {
      if (!description || description.trim().length < 10) {
        return res.status(400).json({
          error: 'Invalid description',
          message: 'Description must be at least 10 characters long'
        });
      }
      updateData.description = description.trim();
    }

    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return res.status(400).json({
          error: 'Invalid images',
          message: 'Images must be an array'
        });
      }
      updateData.images = images;
    }

    if (availability !== undefined) {
      if (!Array.isArray(availability)) {
        return res.status(400).json({
          error: 'Invalid availability',
          message: 'Availability must be an array'
        });
      }
      updateData.availability = availability;
    }

    if (carSizeCompatibility !== undefined) {
      if (!Array.isArray(carSizeCompatibility)) {
        return res.status(400).json({
          error: 'Invalid car size compatibility',
          message: 'Car size compatibility must be an array'
        });
      }
      updateData.carSizeCompatibility = carSizeCompatibility;
    }

    if (drivewaySize !== undefined) {
      const validSizes = ['small', 'medium', 'large', 'extra-large'];
      if (!validSizes.includes(drivewaySize)) {
        return res.status(400).json({
          error: 'Invalid driveway size',
          message: 'Driveway size must be one of: small, medium, large, extra-large'
        });
      }
      updateData.drivewaySize = drivewaySize;
    }

    if (isAvailable !== undefined) {
      updateData.isAvailable = Boolean(isAvailable);
    }

    if (specificSlots !== undefined) {
      if (!Array.isArray(specificSlots)) {
        return res.status(400).json({
          error: 'Invalid specific slots',
          message: 'Specific slots must be an array'
        });
      }
      updateData.specificSlots = specificSlots;
    }

    if (amenities !== undefined) {
      if (!Array.isArray(amenities)) {
        return res.status(400).json({
          error: 'Invalid amenities',
          message: 'Amenities must be an array'
        });
      }
      updateData.amenities = amenities;
    }

    if (pricePerHour !== undefined) {
      if (typeof pricePerHour !== 'number' || pricePerHour <= 0) {
        return res.status(400).json({
          error: 'Invalid price per hour',
          message: 'Price per hour must be a positive number'
        });
      }
      updateData.pricePerHour = pricePerHour;
    }

    console.log('Updating driveway with data:', updateData);

    // Update driveway
    await driveway.update(updateData);

    // Fetch updated driveway
    const updatedDriveway = await Driveway.findByPk(req.params.id);
    
    console.log('Driveway updated successfully:', updatedDriveway.id);
    res.json(updatedDriveway);
  } catch (err) {
    console.error('Update Driveway Error:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      code: err.code,
      constraint: err.constraint,
      table: err.table,
      column: err.column
    });
    
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to update driveway. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   DELETE /api/driveways/:id
// @desc    Delete a driveway
// @access  Private (Owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const driveway = await Driveway.findByPk(req.params.id);
    
    if (!driveway) {
      return res.status(404).json({ msg: 'Driveway not found' });
    }

    // Check if user owns this driveway
    if (driveway.owner !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await driveway.destroy();
    res.json({ msg: 'Driveway deleted' });
  } catch (err) {
    console.error('Delete Driveway Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/driveways/stats
// @desc    Get driveway statistics for owner
// @access  Private (Owner only)
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const totalDriveways = await Driveway.count({
      where: { owner: userId }
    });
    
    const availableDriveways = await Driveway.count({
      where: { owner: userId, isAvailable: true }
    });
    
    const totalBookings = await Driveway.count({
      where: { owner: userId },
      include: [{
        model: require('../models/BookingPG'),
        as: 'bookings',
        required: true
      }]
    });
    
    res.json({
      totalDriveways,
      availableDriveways,
      totalBookings,
      unavailableDriveways: totalDriveways - availableDriveways
    });
  } catch (err) {
    console.error('Get Driveway Stats Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch driveway statistics' });
  }
});

// @route   PUT /api/driveways/:id/availability
// @desc    Toggle driveway availability
// @access  Private (Owner only)
router.put('/:id/availability', auth, async (req, res) => {
  try {
    const driveway = await Driveway.findByPk(req.params.id);
    
    if (!driveway) {
      return res.status(404).json({ error: 'Driveway not found' });
    }
    
    if (driveway.owner !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await driveway.update({ isAvailable: !driveway.isAvailable });
    
    res.json({ 
      message: `Driveway ${driveway.isAvailable ? 'made available' : 'made unavailable'}`,
      isAvailable: driveway.isAvailable 
    });
  } catch (err) {
    console.error('Toggle Availability Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to toggle availability' });
  }
});

module.exports = router;
