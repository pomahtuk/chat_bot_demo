'use strict';

const request = require('request');

//  Full API documentation:
//  https://api-docs.izi.travel/

// api key: 05010cf4-3151-475d-a7ae-5d8ba057424f
class IZIClient {
  constructor (apiKey, messenger) {
    /* istanbul ignore if: no need to check for missing keys */
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
        limit: 11,
        // 10 km... need to be more specific about this
        radius: 10000,
        // should be passed
        sort_by: 'popularity:asc'
      }
    });

    this.apiKey = apiKey;
    this.messenger = messenger || 'default';
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
    const image = guide.images && guide.images[0];
    const DEFAULT_IMG = 'https://scontent-amt2-1.xx.fbcdn.net/hphotos-ash2/v/t1.0-9/10391011_889037011141062_5245176271614526794_n.png?oh=47c423d4c2447d7448cc7d9561230ed3&oe=57C0D2CE';

    return image ? MEDIA_BASE + '/' + guide.content_provider.uuid + '/' + image.uuid + '_240x180.jpg' : DEFAULT_IMG;
  }

  ellipsisOverflow (longString) {
    const STR_LENGTH = 45;

    if (longString.length > STR_LENGTH) {
      return longString.slice(0, 42) + '...';
    } else {
      return longString;
    }
  }

  transformResponseFB (transformedRequest, data, resolve, reject) {
    if (data) {
      let transformedData = data.map((respItem) => {
        return {
          image_url: this.buildMediaUrl(respItem),
          title: this.ellipsisOverflow(respItem.title),
          subtitle: respItem.summary,
          buttons: [
            {
              type: 'web_url',
              url: `https://izi.travel/en/browse/${respItem.uuid}`,
              title: 'Check in app'
            }
          ]
        };
      });
      // if we have more than 10 entities in search
      let nextParams = null;
      if (transformedData.length >= transformedRequest.limit) {
        let nextOffsetRaw = Number(transformedRequest.offset);
        nextOffsetRaw = isNaN(nextOffsetRaw) ? 0 : nextOffsetRaw;

        nextParams = {
          offset: nextOffsetRaw + (transformedRequest.limit - 1)
        };
      }

      return resolve({
        next: nextParams,
        data: transformedData.splice(0, 10)
      });
    }
    /* istanbul ignore next */
    reject('No data received');
  }

  getObjects (requestParams) {
    try {
      let transformedRequest = {
        lat_lon: `${requestParams.location.lat},${requestParams.location.lng}`
      };

      delete requestParams.location;
      let requestToSend = Object.assign({}, requestParams, transformedRequest, {
        limit: requestParams.limit ? requestParams.limit + 1 : 1
      });

      return new Promise((resolve, reject) => {
        this.fetchObjectsRequest({
          qs: requestToSend
        }, (err, resp, data) => {
          /* istanbul ignore if */
          if (err) {
            return reject(err);
          }

          switch (this.messenger) {
            case 'FB':
              this.transformResponseFB(requestToSend, data, resolve, reject);
              break;
            default:
              resolve({
                next: null,
                data
              });
          }
        });
      });
    }
    /* istanbul ignore next */
    catch (err) {
       console.error('Got an error in API request', err);
       console.log(requestParams);
       return new Promise((resolve, reject) => {
         // create promise and reject it right away
         reject(err);
       });
    }
  }
}

module.exports = IZIClient;
