/**
 * Vercel Serverless Function - User Registration
 * Handles user registration with Supabase
 */

import { auth, db } from '../../lib/supabase.js'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, password, roles = ['driver'] } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, email, and password are required' 
      })
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 6 characters' 
      })
    }

    // Check if user already exists
    try {
      await db.getUserByEmail(email)
      return res.status(400).json({ 
        success: false,
        error: 'User with this email already exists' 
      })
    } catch (error) {
      // User doesn't exist, continue with registration
    }

    // Register with Supabase Auth
    const { user, session, error: authError } = await auth.signUp(
      email, 
      password, 
      { 
        name, 
        roles,
        created_at: new Date().toISOString()
      }
    )

    if (authError) {
      console.error('Registration error:', authError)
      return res.status(400).json({ 
        success: false,
        error: authError.message 
      })
    }

    // Create user profile in database
    try {
      const userProfile = await db.createUser({
        id: user.id,
        name,
        email,
        roles,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // Return success response
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: userProfile.name,
          roles: userProfile.roles
        },
        token: session?.access_token,
        session: session ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        } : null
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      res.status(500).json({ 
        success: false,
        error: 'Failed to create user profile' 
      })
    }

  } catch (error) {
    console.error('Registration handler error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    })
  }
}
