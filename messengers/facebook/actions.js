'use strict';

const fbMessages = require('./messages.js');
const Session = require('../../models/session.js');

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
      // Let's give the wheel back to our bot
      console.log('[debug] message are calling callback function');
      botCallback();
    });
  } else {
    console.log('Oops! Couldnt find user for session');
    // Giving the wheel back to our bot
    botCallback();
  }
}



function fbBotSay (sessionId, context, msg, cb) {

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
}

function fbBotCleanup (sessionId, context, cb) {
  delete context.intent;
  delete context.location;
  delete context.response;

  saveSessionData (sessionId, context, cb);
}

function fbBotError (sessionId, context, msg)  {
  console.log('Oops, I don\'t know what to do.', msg);
}

module.exports = {
  say: fbBotSay,
  cleanupSessionContext: fbBotCleanup,
  error: fbBotError
};
