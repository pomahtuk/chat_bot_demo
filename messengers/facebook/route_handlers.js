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

  console.log('processed message', processedMessaging);

  switch (processedMessaging.recepient) {
    case 'sender':
      switch (processedMessaging.type) {
        case 'templated':
          fbMessages.sendTemplatedMessage(sessionData.senderId, processedMessaging.templatedMsg, processedMessaging.msg);
          break;
        default:
          fbMessages.sendTextMessage(sessionData.senderId, processedMessaging.msg);
      }
      break;
    default:
      fbWit.runFbActions(sessionData, processedMessaging.msg);
  }
}

function mainRoute (req, res) {
  // Parsing the Messenger API response
  const messaging = fbUtils.getFirstMessagingEntry(req.body, FB_PAGE_ID);

  if (messaging && messaging.message && messaging.recipient.id === FB_PAGE_ID) {
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
          console.log('Error creating new session', err);
        });
      }    
    }, function (err) {
      console.log('Oops! Couldn\'t get session data', err);
    });
  }

  res.sendStatus(200);
}

module.exports = {
  facebookVerification: facebookVerification,
  mainRoute: mainRoute
};
