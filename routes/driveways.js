const express = require('express');
const router = express.Router();
const Driveway = require('../models/Driveway');
const auth = require('../middleware/auth');
const geocoder = require('../utils/geocoder');

// Middleware to check if user is an owner
const isOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ msg: 'Access denied. Only owners can perform this action.' });
  }
  next();
};

// @route   POST api/driveways
// @desc    Create a driveway listing
// @access  Private (Owner only)
router.post('/', auth, isOwner, async (req, res, next) => {
  try {
    const { address, description, images, availability, carSizeCompatibility, drivewaySize } = req.body;

    const loc = await geocoder.geocode(address);
    if (!loc || loc.length === 0) {
      return next(new Error('Could not geocode address. Please check the address or the API key.', { statusCode: 400 }));
    }
    const location = {
      type: 'Point',
      coordinates: [loc[0].longitude, loc[0].latitude]
    };

    const newDriveway = new Driveway({
      owner: req.user.id,
      address,
      location,
      description,
      images,
      availability,
      carSizeCompatibility: carSizeCompatibility || ['small', 'medium'],
      drivewaySize: drivewaySize || 'medium',
      isAvailable: true
    });

    const driveway = await newDriveway.save();
    res.status(201).json(driveway);
  } catch (err) {
    next(err);
  }
});

// @route   GET api/driveways
// @desc    Get all driveway listings for the authenticated owner
// @access  Private (Owner only)
router.get('/', auth, isOwner, async (req, res, next) => {
  try {
    const driveways = await Driveway.find({ owner: req.user.id });
    res.json(driveways);
  } catch (err) {
    next(err);
  }
});

// @route   GET api/driveways/search
// @desc    Search for available driveways by location, date, and time
// @access  Public
router.get('/search', async (req, res, next) => {
  const {
    latitude,
    longitude,
    radius = 5000,
    date,
    startTime,
    endTime
  } = req.query;

  try {
    let query = {};

    if (latitude && longitude) {
      const parsedLatitude = parseFloat(latitude);
      const parsedLongitude = parseFloat(longitude);
      const parsedRadius = parseFloat(radius) / 6378.1;

      if (isNaN(parsedLatitude) || isNaN(parsedLongitude) || isNaN(parsedRadius)) {
        return next(new Error('Invalid geographic coordinates or radius provided.', { statusCode: 400 }));
      }

      query.location = {
        $geoWithin: {
          $centerSphere: [
            [parsedLongitude, parsedLatitude],
            parsedRadius
          ]
        }
      };
    }

    let driveways = await Driveway.find(query);

    if (date && startTime && endTime) {
      const searchDate = new Date(date);
      if (isNaN(searchDate.getTime())) {
        return next(new Error('Invalid date provided for search.', { statusCode: 400 }));
      }

      const searchYear = searchDate.getUTCFullYear();
      const searchMonth = searchDate.getUTCMonth();
      const searchDay = searchDate.getUTCDate();

      driveways = driveways.filter(driveway => {
        const matchingAvailability = driveway.availability.find(avail => {
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

        driveway.pricePerHour = matchingAvailability.pricePerHour;

        const newSearchStartTime = new Date(`${date}T${startTime}:00Z`);
        const newSearchEndTime = new Date(`${date}T${endTime}:00Z`);

        if (isNaN(newSearchStartTime.getTime()) || isNaN(newSearchEndTime.getTime())) {
          return false;
        }

        const isConflicting = driveway.bookedSlots.some(slot => {
          const existingStartTime = new Date(slot.startTime);
          const existingEndTime = new Date(slot.endTime);

          if (isNaN(existingStartTime.getTime()) || isNaN(existingEndTime.getTime())) {
            return false;
          }

          const conflictResult = newSearchStartTime.getTime() < existingEndTime.getTime() &&
            existingStartTime.getTime() < newSearchEndTime.getTime();

          return conflictResult;
        });

        if (isConflicting) {
        }
        return !isConflicting;
      });
    }
    res.json(driveways);

  } catch (err) {
    next(err);
  }
});

// @route   GET api/driveways/:id
// @desc    Get a single driveway listing by ID
// @access  Public (for now, will restrict later)
router.get('/:id', async (req, res, next) => {
  try {
    const driveway = await Driveway.findById(req.params.id);
    if (!driveway) {
      return next(new Error('Driveway not found', { statusCode: 404 }));
    }
    res.json(driveway);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return next(new Error('Driveway not found', { statusCode: 404 }));
    }
    next(err);
  }
});

// @route   PUT api/driveways/:id
// @desc    Update a driveway listing
// @access  Private (will add auth middleware later)
router.put('/:id', auth, async (req, res, next) => {
  try {
    let driveway = await Driveway.findById(req.params.id);
    if (!driveway) {
      return next(new Error('Driveway not found', { statusCode: 404 }));
    }

    if (driveway.owner.toString() !== req.user.id) {
      return next(new Error('User not authorized', { statusCode: 401 }));
    }

    const { address, description, images, availability, isAvailable, carSizeCompatibility, drivewaySize } = req.body;
    const updatedFields = { description, images, availability, isAvailable, carSizeCompatibility, drivewaySize };

    if (address) {
      const loc = await geocoder.geocode(address);
      if (!loc || loc.length === 0) {
        return next(new Error('Could not geocode address during update. Please check the address or the API key.', { statusCode: 400 }));
      }
      updatedFields.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude]
      };
      updatedFields.address = address;
    }

    driveway = await Driveway.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
    );
    res.json(driveway);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return next(new Error('Driveway not found', { statusCode: 404 }));
    }
    next(err);
  }
});

// @route   DELETE api/driveways/:id
// @desc    Delete a driveway listing
// @access  Private (Owner only)
router.delete('/:id', auth, isOwner, async (req, res) => {
  try {
    const driveway = await Driveway.findById(req.params.id);
    if (!driveway) {
      return res.status(404).json({ msg: 'Driveway not found' });
    }

    // Ensure owner of the listing is the one deleting it (redundant with isOwner middleware but good for safety)
    if (driveway.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Driveway.findByIdAndDelete(req.params.id); // Changed to findByIdAndDelete
    res.json({ msg: 'Driveway removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Driveway not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
