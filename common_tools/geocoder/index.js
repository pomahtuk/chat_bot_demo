'use strict';

const bingGeocoder = require('./bing.js');
const googleGeocoder = require('./google.js');

module.export = {
  bingGeocoder: bingGeocoder,
  googleGeocoder: googleGeocoder.getCoordinates
};
