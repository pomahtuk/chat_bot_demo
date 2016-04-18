'use strict';

const fbMessages = require('./messages.js');
const Session = require('../../models/session.js');
const envConfig = require('../../env.json');
const makeWitBot = require('../../wit_bot/bot.js');

// Parameters required for app
const WIT_TOKEN = envConfig.WIT_TOKEN;

function saveSessionData (sessionId, context, cb) {
  Session.findByIdAndUpdate(sessionId, { context: context }, { new: true }).then(function () {
    cb(context);
  }, function () {
    cb(context);
  });
}

function sendMessage (senderId, msg, botCallback) {
  if (senderId) {
    // Yay, we found our recipient!
    // Let's forward our bot response.
    fbMessages.sendTextMessage(senderId, msg, function (err) {
      if (err) {
        console.log('Oops! An error occurred while forwarding the response', err);
      }
    });
  } else {
    console.log('Oops! Couldnt find user for session');
    // Giving the wheel back to our bot
  }
  botCallback();
}

const fbActions = {
  say: function (sessionId, context, msg, cb) {
    console.log(`bot about to say ${msg}`);

    saveSessionData(sessionId, context, function () {});

    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    Session.findOne({ _id: sessionId }).then(function (sessionData) {
      if (sessionData) {
        sendMessage(sessionData.senderId, msg, cb);
      } else {
        console.log('Oops! Session data is empty');
        cb();
      }    
    }, function (err) {
      // Giving the wheel back to our bot
      console.log('Oops! Couldnt get session data', err);
      cb();
    });
  },
  cleanupSessionContext: function (sessionId, context, cb) {
    delete context.intent;
    delete context.location;
    delete context.response;

    saveSessionData (sessionId, context, cb);
  }
};

const FB_WIT = makeWitBot(WIT_TOKEN, fbActions);

FB_WIT.runFbActions = function (sessionData, msg) {
  const sessionId = String(sessionData._id);
  let sessionContext = sessionData.context || {};

  this.runActions(
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
};

module.exports = FB_WIT;