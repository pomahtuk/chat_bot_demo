'use strict';

const fbUtils = require('./utils.js');
const fbMessages = require('./messages.js');
const Session = require('../../models/session.js');
const fbWit = require('./bot.js');
const envConfig = require('../../env.json');

// Parameters required for app
const FB_PAGE_ID = envConfig.FACEBOOK_PAGE_ID && Number(envConfig.FACEBOOK_PAGE_ID);
const FB_VERIFY_TOKEN = envConfig.FACEBOOK_VERIFY_TOKEN;

function facebookVerification (req, res) {
  if (!FB_VERIFY_TOKEN) {
    throw new Error('missing FB_VERIFY_TOKEN');
  }
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
}

function mainSessionCallback (sessionData, messaging) {
  let processedMessaging = fbUtils.prepareBotMessage(messaging);
  let userPayloadString =  processedMessaging.postback && processedMessaging.postback.payload;
  let userPayload = userPayloadString && JSON.parse(userPayloadString);

  switch (processedMessaging.recepient) {
    case 'sender':
      switch (processedMessaging.type) {
        case 'templated':
          fbMessages.sendTemplatedMessage(sessionData.senderId, processedMessaging.templatedMsg);
          break;
        default:
          fbMessages.sendTextMessage(sessionData.senderId, processedMessaging.msg);
      }
      break;
    case 'server':
      console.log('got this from user', userPayload);
      switch (userPayload.type) {
        case 'loadMore':
          // indicate loading state for user
          fbMessages.sendTextMessage(sessionData.senderId, 'One moment, please...');
          // and grab all data
          fbUtils.makeApiCall(Object.assign({}, userPayload.requestParams, {
            cb: (context) => {
              fbMessages.sendTemplatedMessage(sessionData.senderId, {
                type: 'template',
                payload: {
                  template_type: 'generic',
                  elements: context.response
                }
              });
            }
          }));
          // var moreItemsTemplate;
          // fbMessages.sendTemplatedMessage(sessionData.senderId, moreItemsTemplate);
          break;
        default:
          console.warn('Unknown payload from user postback', userPayload);
      }
      break;
    default:
      if (processedMessaging.outOfContext) {
        // saving all out of context data
        sessionData.outOfContext = processedMessaging.outOfContext;
        sessionData.save().then((updatedSessionData) => {
          fbWit.runFbActions(updatedSessionData, processedMessaging.msg);
        }, (err) => {
          console.error('Error updating user session', err);
        });
      } else {
        fbWit.runFbActions(sessionData, processedMessaging.msg);
      }
  }
}

function mainRoute (req, res) {
  // Parsing the Messenger API response
  const messaging = fbUtils.getFirstMessagingEntry(req.body, FB_PAGE_ID);

  if (messaging && (messaging.message || messaging.postback) && messaging.recipient.id === FB_PAGE_ID) {
    // Yay! We got a new message!
    // We retrieve the Facebook user ID of the sender
    const sender = messaging.sender.id;

    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    Session.findOne({ senderId: String(sender) }).then(function (sessionData) {
      if (sessionData) {
        mainSessionCallback(sessionData, messaging);
      } else {
        // create new session
        // and fire a callback
        let newSession = new Session({ senderId: sender });
        newSession.save().then(function (sessionData) {
          mainSessionCallback(sessionData, messaging);
        }, function (err) {
          console.error('Error creating new session', err);
        });
      }
    }, function (err) {
      console.error('Oops! Couldn\'t get session data', err);
    });
  }

  res.sendStatus(200);
}

module.exports = {
  facebookVerification: facebookVerification,
  mainRoute: mainRoute
};
