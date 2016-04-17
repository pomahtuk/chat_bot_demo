/* global describe, it */

'use strict';

const request = require('supertest');
const app = require('../../../server.js');
const envConfig = require('../../../env.json');
const agent = request.agent(app);

const validSubscribeParams = {
  'hub.mode': 'subscribe',
  'hub.verify_token': envConfig.FACEBOOK_VERIFY_TOKEN || process.env.FACEBOOK_VERIFY_TOKEN,
  'hub.challenge': 'horay'
};

const FB_PAGE_ID = envConfig.FACEBOOK_PAGE_ID && Number(envConfig.FACEBOOK_PAGE_ID) || process.env.FACEBOOK_PAGE_ID && Number(process.env.FACEBOOK_PAGE_ID);

const validMessageParams = {
  'object': 'page',
  'entry': [
    {
      id: FB_PAGE_ID,
      messaging: [
        {
          message: {
            text: 'hello!',
            attachments: null
          },
          recipient: {
            id: FB_PAGE_ID
          },
          sender: {
            id: 1
          }
        }
      ]
    }
  ]
};

describe('Facebook messenger routes', function () {

  describe('Subscribtion endpoint GET /webhook', function () {
    it('responds with 400 request without propper params', function (done) {
      agent.get('/webhook').expect(400, done);
    });

    it('responds with valid answer to request with propper params', function (done) {
      agent.get('/webhook').query(validSubscribeParams).expect(200, validSubscribeParams['hub.challenge'], done);
    });
  });

  describe('Messaging endpoint POST /webhook', function () {
    it('responds with 200 for empty request', function (done) {
      agent.post('/webhook').expect(200, done);
    });

    it('responds with 200 for valid request', function (done) {
      agent.post('/webhook').send(validMessageParams).expect(200, done);
    });

    it('responds with 200 for valid request with images', function (done) {
      validMessageParams.entry[0].messaging[0].message.attachments = [{}];
      agent.post('/webhook').send(validMessageParams).expect(200, done);
    });
  });

});