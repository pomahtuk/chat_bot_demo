'use strict';

const fbUtils = require('./utils.js');
const fbMessages = require('./messages.js');
const Session = require('../../models/session.js');
const fbActions = require('./actions.js');
const makeWitBot = require('../../wit_bot/bot.js');
const envConfig = require('../../env.json');

// Parameters required for app
const WIT_TOKEN = envConfig.WIT_TOKEN || process.env.WIT_TOKEN;
const FB_PAGE_ID = envConfig.FACEBOOK_PAGE_ID && Number(envConfig.FACEBOOK_PAGE_ID) || process.env.FACEBOOK_PAGE_ID && Number(process.env.FACEBOOK_PAGE_ID);
const FB_WIT = makeWitBot(WIT_TOKEN, fbActions);

const FB_VERIFY_TOKEN = envConfig.FACEBOOK_VERIFY_TOKEN || process.env.FACEBOOK_VERIFY_TOKEN;

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
  // We retrieve the message content
  const msg = messaging.message.text;
  const atts = messaging.message.attachments;

  if (atts) {
    // console.log('got mesage with attachment', atts);
    // We received an attachment
    // Let's reply with an automatic message
    fbMessages.sendTextMessage(sessionData.senderId, 'Sorry I can only process text messages for now.');
  } else if (msg) {
    // We received a text message
    // Let's forward the message to the Wit.ai Bot Engine
    // This will run all actions until our bot has nothing left to do
    const sessionId = String(sessionData._id);
    let sessionContext = sessionData.context || {};

    FB_WIT.runActions(
      sessionId, // the user's current session
      msg, // the user's message 
      sessionContext, // the user's current session state
      (error) => {
        if (error) {
          console.log('Oops! Got an error from Wit:', error);
        } else {
          // Our bot did everything it has to do.
          // Now it's waiting for further messages to proceed.
          console.log('Waiting for futher messages. Current story is over.');
        }
      }
    );
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
