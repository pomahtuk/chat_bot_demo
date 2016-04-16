'use strict';

const fbMessages = require('./messages.js');
const Session = require('../../models/session.js');

function sendMessage (senderId, msg, cb) {
  if (senderId) {
    // Yay, we found our recipient!
    // Let's forward our bot response.
    fbMessages.sendTextMessage(senderId, msg, (err) => {
      if (err) {
        console.log('Oops! An error occurred while forwarding the response', err);
      }
      // Let's give the wheel back to our bot
      cb();
    });
  } else {
    console.log('Oops! Couldnt find user for session');
    // Giving the wheel back to our bot
    cb();
  }
}

function fbBotSay (sessionId, msg, cb) {
  // Our bot has something to say!
  // Let's retrieve the Facebook user whose session belongs to
  
  console.log('bot about to say "', msg, '" to user with sessionId=', sessionId);

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

module.exports = {
  say: fbBotSay
};
