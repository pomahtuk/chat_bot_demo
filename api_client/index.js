'use strict';

const request = require('request');

//  Full API documentation:
//  https://api-docs.izi.travel/

// api key: 05010cf4-3151-475d-a7ae-5d8ba057424f
class IZIClient {
  constructor (apiKey, messenger) {
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
        radius: 20000
        // should be passed
        // lat_lon: center.join(','),
      }
    });

    this.apiKey = apiKey;
    this.messenger = messenger;
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
    const image = guide.images[0];

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

  ellipsisOverflow (longString) {
    const STR_LENGTH = 45;

    if (longString.length > STR_LENGTH) {
      return longString.slice(0, 42) + '...';
    } else {
      return longString;
    }
  }

  transformResponseFB (data, resolve, reject) {
    if (data) {
      let transformedData = data.map((respItem) => {
        return {
          image_url: this.buildMediaUrl(respItem),
          title: this.ellipsisOverflow(respItem.title),
          subtitle: respItem.summary,
          buttons: [
            {
              type: 'web_url',
              url: `https://izi.travel/ru/app?content_lang=en&content_uuid=${respItem.uuid}`,
              title: 'Check in app'
            }
          ]
        };
      });
      return resolve(transformedData);
    }
    reject('No data received');
  }

  getObjects (requestParams) {
    try {
      let transformedRequest = {
        lat_lon: `${requestParams.location.lat},${requestParams.location.lng}`
      };

      delete requestParams.location;
      Object.assign(transformedRequest, requestParams);

      return new Promise((resolve, reject) => {
        this.fetchObjectsRequest({
          qs: transformedRequest
        }, (err, resp, data) => {
          if (err) {
            return reject(err);
          }

          switch (this.messenger) {
            case 'FB':
              this.transformResponseFB(data, resolve, reject);
              break;
            default:
              resolve(data);
          }
        });
      });
    }
    catch (err) {
       console.log('Got an error in API request', err);
       return new Promise((resolve, reject) => {
         // create promise and reject it right away
         reject(err);
       });
    }
  }
}

module.exports = IZIClient;
