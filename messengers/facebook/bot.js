'use strict';

const fbMessages = require('./messages.js');
const Session = require('../../models/session.js');
const envConfig = require('../../env.json');
const makeWitBot = require('../../wit_bot/bot.js');
const IZIClient = require('../../api_client');
const GoogleGeocoder = require('../../tools/geocoder/google.js');

const gCoder = new GoogleGeocoder(envConfig.GOOGLE_KEY);
const apiClient = new IZIClient(envConfig.IZI_API_KEY, 'FB');

// Parameters required for app
const WIT_TOKEN = envConfig.WIT_TOKEN;

function saveSessionData (sessionParams) {
  const sessionId = sessionParams.sessionId,
    context = sessionParams.context,
    outOfContext = sessionParams.outOfContext,
    cb = sessionParams.cb;

  let updateObj = {
    context
  };

  if (outOfContext) {
    updateObj.outOfContext = outOfContext;
  }

  Session.findByIdAndUpdate(sessionId, updateObj, { new: true }).then(function () {
    cb ? cb(context) : null;
  }, function (err) {
    console.error('Error updating session', err);
    cb ? cb(context) : null;
  });
}

function sendMessage (senderId, msg) {
  if (senderId) {
    // Yay, we found our recipient!
    // Let's forward our bot response.
    fbMessages.sendTextMessage(senderId, msg, function (err) {
      if (err) {
        console.error('Oops! An error occurred while forwarding the response', err);
      }
    });
  } else {
    console.warn('Oops! Couldnt find user for session');
    // Giving the wheel back to our bot
  }
}

function formTemplatedMessage (context) {
  let resultingMessage = {
    type: 'template',
    payload: {
      template_type: 'generic',
      elements: context.response
    }
  };

  return resultingMessage;
}

function sendTemplatedMessage (senderId, context) {
  let templatedMsg = formTemplatedMessage(context);

  if (senderId) {
    // Yay, we found our recipient!
    // Let's forward our bot response.
    fbMessages.sendTemplatedMessage(senderId, templatedMsg, (err) => {
      if (err) {
        console.error('Oops! An error occurred while forwarding the response', err);
      }
    });
  } else {
    console.error('Oops! Couldnt find user for session');
    // Giving the wheel back to our bot
  }
}

function makeApiCall (location, context, cb) {
  let apiRequestResults = apiClient.getObjects({
    type: context.intent,
    location: location.coordinates || location,
    limit: 10
  });

  apiRequestResults.then((data) => {
    context.response = data;
    cb(context);
  }, (err) => {
    console.error('Error geting data from IZI API', err);
    cb(context);
  });
}

const fbActions = {
  say: function (sessionId, context, msg, cb) {
    // console.log(`bot about to say ${msg}`);
    const TEMPLATE_MSG_STRING = '!!--!!--!!';

    saveSessionData({ sessionId, context });

    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    Session.findOne({ _id: sessionId }).then(function (sessionData) {
      if (sessionData) {
        msg === TEMPLATE_MSG_STRING ? sendTemplatedMessage(sessionData.senderId, context) : sendMessage(sessionData.senderId, msg);
      } else {
        console.warn('Oops! Session data is empty');
      }
    }, function (err) {
      // Giving the wheel back to our bot
      console.error('Oops! Couldnt get session data', err);
    });

    cb();
  },
  error: (sessionId, context, msg) => {
    console.log('Bot encountered an error', msg);
    const emptyFunc = function () {};
    this.say(sessionId, context, 'I am confused with your request, could we start over?', emptyFunc);
  },
  cleanupSessionContext: function (sessionId, context, cb) {
    saveSessionData({ sessionId, context: {}, outOfContext: {}, cb });
  },
  fetchObjectsByLocation: function (sessionId, context, cb) {
    // let's get session data
    Session.findOne({ _id: sessionId }).then(function (sessionData) {
      if (sessionData) {
        let coordinates = sessionData.outOfContext && sessionData.outOfContext.coordinates;
        // check if we know coordinates allready
        // run a geocoder if we don't
        if (!coordinates) {
          let geocodePromise = gCoder.getCoordinates(context.location);
          geocodePromise.then((data) => {
            // and make a call to IZI api
            // after this - populate context response field
            // console.log('Got coordinates', data);
            context.location = data.locationName;
            sendMessage(sessionData.senderId, `Looking for ${context.intent}s in ${context.location}`);
            makeApiCall(data, context, cb);
          }, (err) => {
            // we failed here
            console.warn('Error getting coords from geocoder', err);
            // respond with generic content
            // context.response = 'Some generic fallback data';
            sendMessage(sessionData.senderId, 'Sorry, I could not understand your location, could you be more specific?');
            cb(context);
          });
        } else {
          // we do have coords
          sendMessage(sessionData.senderId, `Looking for ${context.intent}s in ${context.location}`);
          makeApiCall(coordinates, context, cb);
        }
      } else {
        console.warn('Oops! Session data is empty');
        cb(context);
      }
    }, function (err) {
      // Giving the wheel back to our bot
      console.error('Oops! Couldnt get session data', err);
      cb(context);
    });

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
        console.error('Oops! Got an error from Wit:', error);
      } else {
        // Our bot did everything it has to do.
        // Now it's waiting for further messages to proceed.
        // may be delete session?
        console.log('Waiting for futher messages. Current story is over.');
      }
    }
  );
};

module.exports = FB_WIT;
