/**
 * Vercel Serverless Function - User Login
 * Handles user authentication with Supabase
 */

import { auth } from '../../lib/supabase.js'

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
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      })
    }

    // Authenticate with Supabase
    const { user, session, error } = await auth.signIn(email, password)

    if (error) {
      console.error('Login error:', error)
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      })
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        roles: user.user_metadata?.roles || ['driver']
      },
      token: session.access_token,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    })

  } catch (error) {
    console.error('Login handler error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    })
  }
}
