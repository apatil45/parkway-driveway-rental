/**
 * Vercel Serverless Function - Bookings API
 * Handles booking creation and management
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
      // Get bookings
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization required' })
      }

      const token = authHeader.replace('Bearer ', '')
      const { user, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const bookings = await db.getBookings(user.id)

      res.status(200).json({
        success: true,
        bookings,
        count: bookings.length
      })

    } else if (req.method === 'POST') {
      // Create new booking
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization required' })
      }

      const token = authHeader.replace('Bearer ', '')
      const { user, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const {
        drivewayId,
        startTime,
        endTime,
        totalAmount,
        specialRequests = ''
      } = req.body

      // Validate required fields
      if (!drivewayId || !startTime || !endTime || !totalAmount) {
        return res.status(400).json({
          error: 'Driveway ID, start time, end time, and total amount are required'
        })
      }

      // Validate dates
      const start = new Date(startTime)
      const end = new Date(endTime)
      const now = new Date()

      if (start <= now) {
        return res.status(400).json({
          error: 'Start time must be in the future'
        })
      }

      if (end <= start) {
        return res.status(400).json({
          error: 'End time must be after start time'
        })
      }

      // Check for overlapping bookings
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('*')
        .eq('drivewayId', drivewayId)
        .in('status', ['pending', 'confirmed'])
        .or(`and(startTime.lt.${end.toISOString()},endTime.gt.${start.toISOString()})`)

      if (checkError) throw checkError

      if (existingBookings && existingBookings.length > 0) {
        return res.status(400).json({
          error: 'Time slot is already booked'
        })
      }

      // Create booking
      const bookingData = {
        id: `booking-${Date.now()}`,
        userId: user.id,
        drivewayId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        totalAmount: parseFloat(totalAmount),
        status: 'pending',
        specialRequests,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const booking = await db.createBooking(bookingData)

      // Get driveway details for response
      const driveway = await db.getDrivewayById(drivewayId)

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking: {
          ...booking,
          driveway: {
            id: driveway.id,
            address: driveway.address,
            pricePerHour: driveway.pricePerHour
          }
        }
      })

    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('Bookings API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
}
