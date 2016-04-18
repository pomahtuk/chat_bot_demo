'use strict';

// See the Webhook reference
// https://developers.facebook.com/docs/messenger-platform/webhook-reference
const getFirstMessagingEntry = (body, FB_PAGE_ID) => {
  const val = body.object == 'page' &&
    body.entry &&
    Array.isArray(body.entry) &&
    body.entry.length > 0 &&
    body.entry[0] &&
    body.entry[0].id == FB_PAGE_ID &&
    body.entry[0].messaging &&
    Array.isArray(body.entry[0].messaging) &&
    body.entry[0].messaging.length > 0 &&
    body.entry[0].messaging[0];

  return val || null;
};

const prepareBotMessage = (messaging) => {
  // We retrieve the message content
  const msg = messaging.message.text;
  const atts = messaging.message.attachments;

  if (atts) {
    // console.log('got mesage with attachment', atts);
    // We received an attachment
    // Let's reply with an automatic message
    return {
      msg: 'Sorry I can only process text messages for now.',
      recepient: 'sender'
    };
  } else if (msg) {
    // We received a text message
    // Let's forward the message to the Wit.ai Bot Engine
    // This will run all actions until our bot has nothing left to do
    if (msg == 'generic') {
      return {
        msg: 'look what i have for you',
        recepient: 'sender',
        type: 'templated',
        templatedMsg: {
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
        }
      };
    } else if (msg == 'button') {
      return {
        recepient: 'sender',
        type: 'templated',
        templatedMsg: {
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
        }
      };
    } else if (msg == 'receipt') {
      return {
        recepient: 'sender',
        type: 'templated',
        templatedMsg: {
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
      };
    }

    return {
      msg,
      recepient: 'bot'
    };
  }
};


module.exports = {
  getFirstMessagingEntry: getFirstMessagingEntry,
  prepareBotMessage: prepareBotMessage
};
