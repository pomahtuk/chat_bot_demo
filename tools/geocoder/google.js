'use strict';

const request = require('request');

class GoogleGeocoder {
  constructor (apiKey) {
    /* istanbul ignore if: no need to check for missing keys */
    if (!apiKey) {
      throw new Error('no API key provided for google geocoder');
    }

    this.geoCodeRequest = request.defaults({
      uri: 'https://maps.googleapis.com/maps/api/geocode/json',
      method: 'GET',
      json: true,
      qs: { key: apiKey },
      headers: { 'Content-Type': 'application/json' }
    });

    this.geoLocationRequest = request.defaults({
      uri: 'https://www.googleapis.com/geolocation/v1/geolocate',
      method: 'GET',
      json: true,
      qs: { key: apiKey },
      headers: { 'Content-Type': 'application/json' }
    });
  }

  processResponse (geoResponse, resolve, reject) {
    // one fine day this will be available in NodeJS
    // let { status: statusCode , results } = geoResponse;
    const statusCode = geoResponse.status;
    const result = geoResponse.results[0];

    switch (statusCode) {
      case 'OK':
        // do unified formatting
        return resolve({
          locationName: result.formatted_address,
          coordinates: result.geometry.location
        });
      default:
        return reject({
          status: statusCode
        });
    }
  }

  getCoordinates (locationString) {
    return new Promise((resolve, reject) => {
      this.geoCodeRequest({
        qs: {
          address: locationString
        }
      }, (err, resp, data) => {
        /* istanbul ignore if: no need to check for network errors */
        if (err) {
          return reject(err);
        }
        return this.processResponse(data, resolve, reject);
      });
    });
  }
}

module.exports = GoogleGeocoder;
