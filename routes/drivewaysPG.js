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
