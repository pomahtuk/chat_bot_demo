/* global describe, it */

'use strict';

const validationFunction = require('../../../messengers/facebook/messages.js').validateTemplateMessage;
const expect = require('chai').expect;

const fbMessages = {
  invalid: {

  },
  valid: [
    {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [{
          title: 'First card',
          subtitle: 'Element #1 of an hscroll',
          image_url: 'http://messengerdemo.parseapp.com/img/rift.png',
          buttons: [{
            type: 'web_url',
            url: 'https://www.messenger.com/',
            title: 'Web url'
          }, {
            type: 'postback',
            title: 'Postback',
            payload: 'Payload for first element in a generic bubble'
          }]
        }, {
          title: 'Second card',
          subtitle: 'Element #2 of an hscroll',
          image_url: 'http://messengerdemo.parseapp.com/img/gearvr.png',
          buttons: [{
            type: 'postback',
            title: 'Postback',
            payload: 'Payload for second element in a generic bubble'
          }]
        }]
      }
    }, {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'look maa, i have buttons',
        buttons: [{
          type: 'web_url',
          url: 'https://www.messenger.com/',
          title: 'Web url'
        }, {
          type: 'postback',
          title: 'Postback',
          payload: 'Payload for first element in a generic bubble'
        }]
      }
    }, {
      type: 'template',
      payload: {
        template_type: 'receipt',
        recipient_name: 'John Doe',
        order_number: parseInt(new Date().getTime() / 1000, 10),
        currency: 'EUR',
        payment_method: 'Visa 1234',
        timestamp: parseInt(new Date().getTime() / 1000, 10),
        order_url: 'https://example.com/order',
        elements: [{
          title: 'First card',
          subtitle: 'Element #1 of an hscroll',
          quantity: 1,
          price: 100,
          currency: 'EUR',
          image_url: 'http://messengerdemo.parseapp.com/img/rift.png'
        }],
        address: {
          street_1: 'Julius Pergerstraat',
          street_2: '244',
          city: 'Amsterdam',
          postal_code: '1087KP',
          state: 'NL',
          country: 'Netherlands'
        },
        summary: {
          subtotal: 100,
          shipping_cost: 10,
          total_tax: 0,
          total_cost: 110
        },
        adjustments: [{
          name: 'empty',
          amount: 0
        }]
      }
    }
  ]
};

describe('Facebook messages validation', function () {

  describe('Positive path', function () {
    fbMessages.valid.forEach((msg) => {
      it(`Returns a sucess status to a valid message with template: ${msg.payload.template_type}`, function (done) {
        let testResult = validationFunction(msg);

        expect(testResult.status).to.be.equal('success');
        expect(testResult).not.to.have.property('errors');

        done();
      });
    });
  });

  describe('Valiidation of message type', function () {
    it('Returns an error if message type is not supported', function (done) {
      let testResult = validationFunction({
        payload: {
          template_type: 'sticker'
        }
      });

      expect(testResult.status).to.be.equal('failure');
      expect(testResult).to.have.property('errors')
        .that.is.an('array')
        .with.deep.property('[0]')
          .that.is.a('string');

      done();
    });

  });

});