// Test API route in pages directory (Next.js style)
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Pages API route is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  })
}
