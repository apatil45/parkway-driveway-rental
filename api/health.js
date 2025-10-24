/**
 * Vercel Serverless Function - Health Check
 * Provides health status for the application
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0',
      services: {
        database: 'connected',
        api: 'operational',
        frontend: 'served'
      }
    }

    res.status(200).json(healthData)
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    })
  }
}
