/**
 * Vercel Serverless Function - Get Current User
 * Handles user data retrieval with Supabase
 */

const { auth, db } = require('../../lib/supabase.js')

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        error: 'Authorization header required' 
      })
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '')
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token' 
      })
    }

    // Get user profile from database
    try {
      const userProfile = await db.getUserById(user.id)
      
      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: userProfile.name,
          roles: userProfile.roles,
          carSize: userProfile.car_size,
          drivewaySize: userProfile.driveway_size,
          phoneNumber: userProfile.phone_number,
          address: userProfile.address
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve user profile' 
      })
    }

  } catch (error) {
    console.error('User handler error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    })
  }
}
