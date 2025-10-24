/**
 * Simple Test API Route
 * Tests basic Vercel serverless function functionality
 */

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  res.status(200).json({
    success: true,
    message: 'Test API route is working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  })
}
