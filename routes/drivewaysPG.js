const express = require('express');
const Driveway = require('../models/DrivewayPG');
const User = require('../models/UserPG');
const auth = require('../middleware/auth');
const { validateDriveway } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/driveways
// @desc    Get all available driveways
// @access  Public
router.get('/', async (req, res) => {
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
    res.json(driveways);
  } catch (err) {
    console.error('Get Driveways Error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch driveways' });
  }
});

// @route   GET /api/driveways/search
// @desc    Search for available driveways by location, date, and time
// @access  Public
router.get('/search', async (req, res) => {
  const {
    latitude,
    longitude,
    radius = 5000,
    date,
    startTime,
    endTime
  } = req.query;

  try {
    let whereClause = { isAvailable: true };

    // If location parameters are provided, we'll filter by distance
    // Note: For PostgreSQL, we'd need PostGIS for proper geographic queries
    // For now, we'll do basic filtering and can enhance later
    if (latitude && longitude) {
      const parsedLatitude = parseFloat(latitude);
      const parsedLongitude = parseFloat(longitude);
      
      if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
        return res.status(400).json({ error: 'Invalid geographic coordinates provided.' });
      }
      
      // For now, we'll get all available driveways and filter by date/time
      // In a production app, you'd want to use PostGIS for proper geographic queries
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

    // Filter by date and time if provided
    if (date && startTime && endTime) {
      const searchDate = new Date(date);
      if (isNaN(searchDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date provided for search.' });
      }

      const searchYear = searchDate.getUTCFullYear();
      const searchMonth = searchDate.getUTCMonth();
      const searchDay = searchDate.getUTCDate();

      driveways = driveways.filter(driveway => {
        // Check if driveway has availability for the requested date/time
        if (!driveway.availability || !Array.isArray(driveway.availability)) {
          return false;
        }

        const matchingAvailability = driveway.availability.find(avail => {
          if (!avail.date) return false;
          
          const availDate = new Date(avail.date);
          if (isNaN(availDate.getTime())) {
            return false;
          }

          const availYear = availDate.getUTCFullYear();
          const availMonth = availDate.getUTCMonth();
          const availDay = availDate.getUTCDate();

          const isDateMatch = (availYear === searchYear && availMonth === searchMonth && availDay === searchDay);
          const isTimeMatch = startTime >= avail.startTime && endTime <= avail.endTime;

          return isDateMatch && isTimeMatch;
        });

        if (!matchingAvailability) {
          return false;
        }

        // Add price information to the driveway object
        driveway.pricePerHour = matchingAvailability.pricePerHour;

        // Check for booking conflicts
        const newSearchStartTime = new Date(`${date}T${startTime}:00Z`);
        const newSearchEndTime = new Date(`${date}T${endTime}:00Z`);

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

    res.json(driveways);

  } catch (err) {
    console.error('Search Driveways Error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ error: 'Server error', message: 'Failed to search driveways' });
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

// @route   GET /api/driveways/owner
// @desc    Get driveways by owner
// @access  Private
router.get('/owner', auth, async (req, res) => {
  try {
    const driveways = await Driveway.findAll({
      where: { owner: req.user.id },
      order: [['created_at', 'DESC']],
      raw: false
    });
    res.json(driveways);
  } catch (err) {
    console.error('Get Owner Driveways Error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch owner driveways' });
  }
});

// @route   POST /api/driveways
// @desc    Add a new driveway
// @access  Private (Owner only)
router.post('/', auth, validateDriveway, async (req, res) => {
  const { address, description, images, availability, carSizeCompatibility, drivewaySize } = req.body;

  console.log('POST /api/driveways - User:', req.user);
  console.log('POST /api/driveways - Body:', req.body);

  try {
    const driveway = await Driveway.create({
      owner: req.user.id,
      address,
      description,
      images: images || [],
      availability: availability || [],
      carSizeCompatibility: carSizeCompatibility || ['small', 'medium'],
      drivewaySize: drivewaySize || 'medium'
    });

    res.json(driveway);
  } catch (err) {
    console.error('Add Driveway Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/driveways/:id
// @desc    Update a driveway
// @access  Private (Owner only)
router.put('/:id', auth, async (req, res) => {
  const { address, description, images, availability, carSizeCompatibility, drivewaySize, isAvailable } = req.body;

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

module.exports = router;
