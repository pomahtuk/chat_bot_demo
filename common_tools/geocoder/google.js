'use strict';

const request = require('request');
const envConfig = require('../../env.json');  

class googleGeocoder {
  constructor () {
    this.geoCodeRequest = request.defaults({
      uri: 'https://maps.googleapis.com/maps/api/geocode/json',
      method: 'GET',
      json: true,
      qs: { key: envConfig.GOOGLE_KEY },
      headers: { 'Content-Type': 'application/json' }
    });
    
    this.geoLocationRequest = request.defaults({
      uri: 'https://www.googleapis.com/geolocation/v1/geolocate',
      method: 'GET',
      json: true,
      qs: { key: envConfig.GOOGLE_KEY },
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // this has strict limits
  // do not overuse it
  getUserGeolocation () {
    return new Promise((resolve, reject) => {
      this.geoLocationRequest({}, (err, resp, data) => {
        if (err) {
          return reject(err);
        }
        if (data.error) {
          return reject({
            status: data.message,
            code: data.code
          });
        }
        if (data.status !== 'OK') {
          return reject({
            status: data.status
          });
        }
        return resolve(data);
      });
    });
  }
  
  processResponse (geoResponse, resolve, reject) {
    // one fine day this will be available in NodeJS
    // let { status: statusCode , results } = geoResponse;
    const statusCode = geoResponse.status;
    const results = geoResponse.results;
    let geolocationResult = null;
    
    switch (statusCode) {
      case 'ZERO_RESULTS':
        // do a call to a geolocation api
        geolocationResult = this.getUserGeolocation();
        geolocationResult.then((data) => {
          resolve({
            locationName: 'name',
            coordinates: data.location
          });
        }, (err) => {
          reject(err);
        });
        break;
      case 'OK':
        return resolve(results);
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
        if (err) {
          return reject(err);
        }
        return this.processResponse(data, resolve, reject);
      });
    });
  }
}

module.exports = new googleGeocoder();
 