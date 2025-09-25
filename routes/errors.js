const express = require('express');
const router = express.Router();

// @route   POST /api/errors/report
// @desc    Report client-side errors
// @access  Public
router.post('/report', async (req, res) => {
  const { type, message, timestamp, userAgent, url } = req.body;

  try {
    // Log the error for monitoring
    console.error('Client Error Report:', {
      type,
      message,
      timestamp,
      userAgent,
      url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // In a production environment, you would:
    // 1. Send to error monitoring service (Sentry, Bugsnag, etc.)
    // 2. Store in database for analysis
    // 3. Send alerts for critical errors
    // 4. Track error trends and patterns

    res.status(200).json({ 
      success: true, 
      message: 'Error reported successfully' 
    });
  } catch (err) {
    console.error('Error reporting failed:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to report error' 
    });
  }
});

module.exports = router;
