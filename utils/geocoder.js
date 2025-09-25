const NodeGeocoder = require('node-geocoder');

const options = {
  provider: 'opencage',
  apiKey: process.env.OPENCAGE_API_KEY, // for Opencage
  formatter: null // 'gpx', 'string', ...
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
