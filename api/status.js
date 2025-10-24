// Minimal API route to test Vercel detection
module.exports = function handler(req, res) {
  res.status(200).json({ 
    message: 'Vercel API route is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  })
}
