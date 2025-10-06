const express = require('express');
const { Driveway, User } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all driveways (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, minPrice, maxPrice, carSize } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { isActive: true, isAvailable: true };

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Price filter
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = minPrice;
      if (maxPrice) whereClause.price[Op.lte] = maxPrice;
    }

    // Car size filter
    if (carSize) {
      whereClause.carSize = carSize;
    }

    const driveways = await Driveway.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        driveways: driveways.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: driveways.count,
          pages: Math.ceil(driveways.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get driveways error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get driveways'
    });
  }
});

// Get single driveway
router.get('/:id', async (req, res) => {
  try {
    const driveway = await Driveway.findOne({
      where: { id: req.params.id, isActive: true },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'profileImage', 'phone']
        }
      ]
    });

    if (!driveway) {
      return res.status(404).json({
        success: false,
        message: 'Driveway not found'
      });
    }

    res.json({
      success: true,
      data: { driveway }
    });
  } catch (error) {
    console.error('Get driveway error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get driveway'
    });
  }
});

// Create driveway (owner only)
router.post('/', authenticateToken, authorize('owner', 'admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      latitude,
      longitude,
      price,
      capacity,
      amenities = [],
      carSize = 'medium',
      accessInstructions,
      restrictions
    } = req.body;

    // Validation
    if (!title || !description || !address || !price || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, address, price, and capacity are required'
      });
    }

    const driveway = await Driveway.create({
      title,
      description,
      address,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      price: parseFloat(price),
      capacity: parseInt(capacity),
      amenities,
      carSize,
      accessInstructions,
      restrictions,
      ownerId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Driveway created successfully',
      data: { driveway }
    });
  } catch (error) {
    console.error('Create driveway error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create driveway'
    });
  }
});

// Update driveway (owner only)
router.put('/:id', authenticateToken, authorize('owner', 'admin'), async (req, res) => {
  try {
    const driveway = await Driveway.findOne({
      where: { id: req.params.id, ownerId: req.user.id }
    });

    if (!driveway) {
      return res.status(404).json({
        success: false,
        message: 'Driveway not found or you do not have permission to update it'
      });
    }

    const {
      title,
      description,
      address,
      latitude,
      longitude,
      price,
      capacity,
      amenities,
      carSize,
      accessInstructions,
      restrictions,
      isAvailable
    } = req.body;

    await driveway.update({
      ...(title && { title }),
      ...(description && { description }),
      ...(address && { address }),
      ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
      ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(capacity !== undefined && { capacity: parseInt(capacity) }),
      ...(amenities && { amenities }),
      ...(carSize && { carSize }),
      ...(accessInstructions !== undefined && { accessInstructions }),
      ...(restrictions !== undefined && { restrictions }),
      ...(isAvailable !== undefined && { isAvailable })
    });

    res.json({
      success: true,
      message: 'Driveway updated successfully',
      data: { driveway }
    });
  } catch (error) {
    console.error('Update driveway error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driveway'
    });
  }
});

// Delete driveway (owner only)
router.delete('/:id', authenticateToken, authorize('owner', 'admin'), async (req, res) => {
  try {
    const driveway = await Driveway.findOne({
      where: { id: req.params.id, ownerId: req.user.id }
    });

    if (!driveway) {
      return res.status(404).json({
        success: false,
        message: 'Driveway not found or you do not have permission to delete it'
      });
    }

    await driveway.update({ isActive: false });

    res.json({
      success: true,
      message: 'Driveway deleted successfully'
    });
  } catch (error) {
    console.error('Delete driveway error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete driveway'
    });
  }
});

// Get user's driveways
router.get('/my/driveways', authenticateToken, authorize('owner', 'admin'), async (req, res) => {
  try {
    const driveways = await Driveway.findAll({
      where: { ownerId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { driveways }
    });
  } catch (error) {
    console.error('Get my driveways error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get your driveways'
    });
  }
});

module.exports = router;
