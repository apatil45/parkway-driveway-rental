const express = require('express');
const router = express.Router();
const { supabase, db } = require('../models/supabase');
const { authenticateToken: auth } = require('../middleware/authSupabase');

// @route   GET /api/driveways
// @desc    Get all active driveways with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      radius = 10, 
      min_price, 
      max_price, 
      car_size, 
      limit = 50,
      offset = 0 
    } = req.query;

    let query = supabase
      .from('driveways')
      .select(`
        *,
        users!driveways_owner_id_fkey (
          id,
          name,
          rating,
          total_reviews
        )
      `)
      .eq('is_active', true)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Apply filters
    if (min_price) {
      query = query.gte('price_per_hour', parseFloat(min_price));
    }
    if (max_price) {
      query = query.lte('price_per_hour', parseFloat(max_price));
    }
    if (car_size) {
      query = query.contains('car_size_compatibility', [car_size]);
    }

    const { data: driveways, error } = await query;

    if (error) {
      console.error('Get driveways error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch driveways'
      });
    }

    // Calculate distance if coordinates provided
    let processedDriveways = driveways || [];
    if (lat && lng) {
      processedDriveways = processedDriveways.map(driveway => {
        if (driveway.latitude && driveway.longitude) {
          const distance = calculateDistance(
            parseFloat(lat), 
            parseFloat(lng), 
            driveway.latitude, 
            driveway.longitude
          );
          return { ...driveway, distance };
        }
        return driveway;
      });

      // Filter by radius
      processedDriveways = processedDriveways.filter(driveway => 
        !driveway.distance || driveway.distance <= parseFloat(radius)
      );

      // Sort by distance
      processedDriveways.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    res.json({
      success: true,
      driveways: processedDriveways,
      total: processedDriveways.length
    });

  } catch (error) {
    console.error('Get driveways error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driveways'
    });
  }
});

// @route   GET /api/driveways/:id
// @desc    Get single driveway by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: driveway, error } = await supabase
      .from('driveways')
      .select(`
        *,
        users!driveways_owner_id_fkey (
          id,
          name,
          rating,
          total_reviews,
          phone_number
        ),
        reviews (
          id,
          rating,
          comment,
          reviewer_id,
          users!reviews_reviewer_id_fkey (name)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Get driveway error:', error);
      return res.status(404).json({
        success: false,
        error: 'Driveway not found'
      });
    }

    res.json({
      success: true,
      driveway
    });

  } catch (error) {
    console.error('Get driveway error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driveway'
    });
  }
});

// @route   POST /api/driveways
// @desc    Create new driveway
// @access  Private (Owner)
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      address,
      description,
      driveway_size,
      car_size_compatibility,
      price_per_hour,
      amenities,
      features,
      images,
      latitude,
      longitude,
      access_instructions,
      house_rules,
      neighborhood_info
    } = req.body;

    // Validate required fields
    if (!address || !price_per_hour) {
      return res.status(400).json({
        success: false,
        error: 'Address and price per hour are required'
      });
    }

    const drivewayData = {
      owner_id: userId,
      address,
      description,
      driveway_size,
      car_size_compatibility: car_size_compatibility || 'all',
      price_per_hour: parseFloat(price_per_hour),
      amenities: amenities || [],
      features: features || [],
      images: images || [],
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      access_instructions,
      house_rules,
      neighborhood_info,
      is_active: true,
      is_available: true
    };

    const { data: driveway, error } = await supabase
      .from('driveways')
      .insert([drivewayData])
      .select()
      .single();

    if (error) {
      console.error('Create driveway error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create driveway'
      });
    }

    res.status(201).json({
      success: true,
      driveway,
      message: 'Driveway created successfully'
    });

  } catch (error) {
    console.error('Create driveway error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create driveway'
    });
  }
});

// @route   PUT /api/driveways/:id
// @desc    Update driveway
// @access  Private (Owner)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Check if user owns this driveway
    const { data: existingDriveway, error: checkError } = await supabase
      .from('driveways')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (checkError || !existingDriveway) {
      return res.status(404).json({
        success: false,
        error: 'Driveway not found'
      });
    }

    if (existingDriveway.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this driveway'
      });
    }

    const { data: driveway, error } = await supabase
      .from('driveways')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update driveway error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update driveway'
      });
    }

    res.json({
      success: true,
      driveway,
      message: 'Driveway updated successfully'
    });

  } catch (error) {
    console.error('Update driveway error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driveway'
    });
  }
});

// @route   DELETE /api/driveways/:id
// @desc    Delete driveway
// @access  Private (Owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user owns this driveway
    const { data: existingDriveway, error: checkError } = await supabase
      .from('driveways')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (checkError || !existingDriveway) {
      return res.status(404).json({
        success: false,
        error: 'Driveway not found'
      });
    }

    if (existingDriveway.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this driveway'
      });
    }

    const { error } = await supabase
      .from('driveways')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete driveway error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete driveway'
      });
    }

    res.json({
      success: true,
      message: 'Driveway deleted successfully'
    });

  } catch (error) {
    console.error('Delete driveway error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete driveway'
    });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

module.exports = router;
