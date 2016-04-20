'use strict';

const request = require('request');

//  Full API documentation:
//  https://api-docs.izi.travel/

// api key: 05010cf4-3151-475d-a7ae-5d8ba057424f
class IZIClient {
  constructor (apiKey) {
    if (!apiKey) {
      throw new Error('no API key provided for IZI.travel API client');
    }

    this.fetchObjectsRequest = request.defaults({
      uri: 'https://api.izi.travel/mtg/objects/search',
      method: 'GET',
      json: true,
      headers: {
        'X-IZI-API-KEY': apiKey
      },
      qs: {
        // for now hardcoded
        languages: 'en',
        // need to pass as a parameter
        // type: ['tour', 'museum'],
        // for now
        // cost: 'free',
        // as we do have a limit for cards in fb
        limit: 10,
        radius: 5000
        // should be passed
        // lat_lon: center.join(','),
      }
    });

    this.apiKey = apiKey;
  }

  buildMediaUrl (guide) {
    /* Building image url:

    {MEDIA_BASE_URL}/{CONTENT_PROVIDER_UUID}/{IMAGE_UUID}_{IMAGE_SIZE}.jpg

    Image size in "WIDTHxHEIGHT" format. E.g., "800x600".

    Available image sizes are:

    high quality:
    800 х 600
    240 х 180

    low quality:
    480 х 360
    120 х 90

    Media files access URL: http://media.dev.izi.travel/
    */

    const MEDIA_BASE = 'https://media.izi.travel';
    const image = guide.content.images[0];

    return MEDIA_BASE + '/' + guide.content_provider.uuid + '/' + image.uuid + '_240x180.jpg';
  }

  getDistance (fromPoint, toPoint) {
    function rad (x) {
      return x * Math.PI / 180;
    }

    let R = 6378137, // Earth’s mean radius in meter
      dLat = rad(toPoint.lat - fromPoint.lat),
      dLong = rad(toPoint.lng - fromPoint.lng),
      a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(fromPoint.lat)) * Math.cos(rad(toPoint.lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2),
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
      distance = R * c;

    return distance; // returns the distance in meter
  }

  transformResponse (data, resolve, reject) {
    if (data) {
      return resolve(data);
    }
    reject('just because');
  }

  getObjects (requestParams) {
    let transformedRequest = {
      lat_lon: `${requestParams.location.lat},${requestParams.location.lng}`
    };

    delete requestParams.location;
    Object.assign(transformedRequest, requestParams);

    return new Promise((resolve, reject) => {
      this.fetchObjectsRequest({
        qs: transformedRequest
      }, (err, resp, data) => {
        console.log(data);

        if (err) {
          return reject(err);
        }

        this.transformResponse(data, resolve, reject);
      });
    });
  }
}

module.exports = IZIClient;
