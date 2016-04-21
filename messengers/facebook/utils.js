'use strict';

/**
 * See the Webhook reference
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference
 *
 * @param  {Object} body       facebook Webhook POST request body
 * @param  {String} FB_PAGE_ID facebook PAGE_ID
 * @return {Object|null} User message contents or null
 */
const getFirstMessagingEntry = (body, FB_PAGE_ID) => {
  // this one is faulty;
  // does not let postback further
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

/**
 * Switching attached coordinates format for further processing
 * @param  {Object} response User message contents
 * @return {Object} Coordinates of attached location in common format
 */
const getCoordinates = (response) => {
  return {
    coordinates: {
      lat: response.payload.coordinates.lat,
      lng: response.payload.coordinates.long
    }
  };
};

/**
 * Doing some attachments preprocessing
 * @param  {Array} atts Attachments from user message
 * @return {Object} Prepered attachment or contents of first one
 */
const processAttachments = (atts) => {
  const firstAttachment = atts[0];

  // we are able to process locations only for now
  if (firstAttachment.type == 'location') {
    return {
      // return something to bot
      msg: `near ${firstAttachment.title}`,
      // set something for session
      outOfContext: getCoordinates(firstAttachment)
    };
  }

  return atts;
};

/**
 * Generates message either for bot
 * or for sender based on user input
 * @param  {Object} messaging - object from Facebook webhook
 * @return {Object} preformatted object for further processing
 */
const prepareBotMessage = (messaging) => {
  // We retrieve the message content
  const atts = messaging.message && messaging.message.attachments;
  let msg = messaging.message && messaging.message.text;
  let postback = messaging.postback;
  let outOfContext = null;

  if (postback) {
    // do not forward anything to bot
    // handle here
    console.log(postback);
    // send message to user
    let text = JSON.stringify(postback);
    return {
      msg: `Ok, got you, ${text.substring(0, 200)}`,
      recepient: 'sender',
      outOfContext,
      type: 'text'
    };
  }

  if (atts) {
    let processedAttachment = processAttachments(atts);

    if (processedAttachment.msg) {
      // override user input if any
      msg = processedAttachment.msg;
      outOfContext = processedAttachment.outOfContext;
    } else {
      return {
        msg: 'Sorry I can only process text messages or location attachments for now.',
        recepient: 'sender',
        outOfContext,
        type: 'text'
      };
    }
  }

  if (msg) {
    // We received a text message
    // Let's forward the message to the Wit.ai Bot Engine
    // This will run all actions until our bot has nothing left to do
    if (msg == 'generic') {
      return {
        outOfContext,
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
        outOfContext,
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
        outOfContext,
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
      recepient: 'bot',
      outOfContext,
      type: 'text'
    };
  }
};


module.exports = {
  getFirstMessagingEntry: getFirstMessagingEntry,
  prepareBotMessage: prepareBotMessage
};
