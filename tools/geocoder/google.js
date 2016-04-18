'use strict';

const request = require('request');

class GoogleGeocoder {
  constructor (apiKey) {
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
  
  // this has strict limits
  // do not overuse it
  getUserGeolocation () {
    return new Promise((resolve, reject) => {
      this.geoLocationRequest({}, (err, resp, data) => {
        if (err) {
          return reject(err);
        }
        if (resp.statusCode !== 200) {
          return reject({
            status: data,
            code: resp.statusCode
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
    const result = geoResponse.results[0];
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
        if (err) {
          return reject(err);
        }
        return this.processResponse(data, resolve, reject);
      });
    });
  }
}

module.exports = GoogleGeocoder;
 