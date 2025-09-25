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

  try {
    const driveway = await Driveway.findByPk(req.params.id);
    
    if (!driveway) {
      return res.status(404).json({ msg: 'Driveway not found' });
    }

    // Check if user owns this driveway
    if (driveway.owner !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update driveway
    await driveway.update({
      address: address || driveway.address,
      description: description || driveway.description,
      images: images || driveway.images,
      availability: availability || driveway.availability,
      carSizeCompatibility: carSizeCompatibility || driveway.carSizeCompatibility,
      drivewaySize: drivewaySize || driveway.drivewaySize,
      isAvailable: isAvailable !== undefined ? isAvailable : driveway.isAvailable
    });

    res.json(driveway);
  } catch (err) {
    console.error('Update Driveway Error:', err.message);
    res.status(500).send('Server error');
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
