const NodeGeocoder = require('node-geocoder');

// Initialize geocoder only if API key is available
let geocoder = null;
if (process.env.OPENCAGE_API_KEY) {
  const options = {
    provider: 'opencage',
    apiKey: process.env.OPENCAGE_API_KEY, // for Opencage
    formatter: null // 'gpx', 'string', ...
  };
  geocoder = NodeGeocoder(options);
} else {
  console.warn('⚠️  OpenCage API key not configured - geocoding functionality will be disabled');
}

module.exports = geocoder;
