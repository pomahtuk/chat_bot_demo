'use strict';

const BingGeocoder = require('./bing.js');
const GoogleGeocoder = require('./google.js');
const envConfig = require('../../env.json');  

const gCoder = new GoogleGeocoder(envConfig.GOOGLE_KEY);

module.export = {
  bingGeocoder: BingGeocoder,
  googleGeocoder: gCoder
};
