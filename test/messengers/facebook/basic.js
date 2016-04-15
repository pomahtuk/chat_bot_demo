/* global describe, beforeEach, afterEach, it */

'use strict'

const request = require('supertest')

describe('Facebook messenger routes', function () {
  let server

  const validSubscribeParams = {
    'hub.mode': 'subscribe',
    'hub.verify_token': process.env.FACEBOOK_VERIFY_TOKEN,
    'hub.challenge': 'horay'
  }

  const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID && Number(process.env.FACEBOOK_PAGE_ID)

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
  }


  beforeEach(function () {
    server = require('../../../server.js')
  })

  afterEach(function () {
    server.close()
  })

  describe('Subscribtion endpoint GET /webhook', function () {
    it('responds with 400 request without propper params', function (done) {
      request(server).get('/webhook').expect(400, done)
    })

    it('responds with valid answer to request with propper params', function (done) {
      request(server).get('/webhook').query(validSubscribeParams).expect(200, validSubscribeParams['hub.challenge'], done)
    })
  })

  describe('Messaging endpoint POST /webhook', function () {
    it('responds with 200 for empty request', function (done) {
      request(server).post('/webhook').expect(200, done)
    })

    it('responds with 200 for valid request', function (done) {
      request(server).post('/webhook').send(validMessageParams).expect(200, done)
    })
  })

})