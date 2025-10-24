/**
 * Vercel Serverless Function - Driveways API
 * Handles driveway listing and creation
 */

const { db, auth } = require('../lib/supabase.js')

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    if (req.method === 'GET') {
      // Get driveways with optional filters
      const { location, priceMin, priceMax, size, ownerId } = req.query
      
      const filters = {}
      if (location) filters.location = location
      if (priceMin) filters.priceMin = parseFloat(priceMin)
      if (priceMax) filters.priceMax = parseFloat(priceMax)
      if (size) filters.size = size

      let driveways
      if (ownerId) {
        // Get driveways by owner
        const { data, error } = await db.supabase
          .from('driveways')
          .select(`
            *,
            owner:users(name, email),
            bookings:bookings(*)
          `)
          .eq('ownerId', ownerId)
          .eq('isActive', true)
          .order('createdAt', { ascending: false })

        if (error) throw error
        driveways = data
      } else {
        // Get all public driveways
        driveways = await db.getDriveways(filters)
      }

      res.status(200).json({
        success: true,
        driveways,
        count: driveways.length
      })

    } else if (req.method === 'POST') {
      // Create new driveway
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization required' })
      }

      // Verify user authentication
      const token = authHeader.replace('Bearer ', '')
      const { user, error: authError } = await db.supabase.auth.getUser(token)
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const {
        address,
        description,
        drivewaySize,
        carSizeCompatibility,
        pricePerHour,
        availability,
        amenities,
        images = []
      } = req.body

      // Validate required fields
      if (!address || !description || !pricePerHour) {
        return res.status(400).json({
          error: 'Address, description, and price are required'
        })
      }

      // Create driveway
      const drivewayData = {
        id: `driveway-${Date.now()}`,
        ownerId: user.id,
        address,
        description,
        drivewaySize: drivewaySize || 'Medium',
        carSizeCompatibility: carSizeCompatibility || 'All',
        pricePerHour: parseFloat(pricePerHour),
        availability: availability || '24/7',
        amenities: amenities || '',
        images: JSON.stringify(images),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const driveway = await db.createDriveway(drivewayData)

      res.status(201).json({
        success: true,
        message: 'Driveway created successfully',
        driveway
      })

    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Driveways API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
}
