'use strict';

const Wit = require('node-wit').Wit;
const Session = require('../models/session.js');

const lastEntityValue = (entities, entity) => {
  let entityVal = entities && entities[entity];

  if (entityVal) {
    let val = Array.isArray(entityVal) &&
      entityVal.length > 0 &&
      entityVal[entityVal.length - 1].value;

    if (val) {
      return typeof val === 'object' ? val.value : val;
    }
  }

  return null;
};

function saveSessionData (sessionId, context, cb) {
  Session.findAndModify({
    query: { _id: sessionId },
    update: { context: context },
    new: true
  }).then(function (sessionData) {
    console.log('session data saved', sessionData);
    cb(context);
  }, function (err) {
    console.log('Error fetching user session, fail', err);
    cb(context);
  });
}

const actions = {
  say: (sessionId, msg, cb) => {
    cb();
  },

  merge: (sessionId, context, entities, message, cb) => {
    const location = lastEntityValue(entities, 'location');
    const intent = lastEntityValue(entities, 'intent');

    // what should be done if location not recognised?
    if (location) {
      context.location = location;
    }

    if (intent) {
      context.intent = intent;
    }

    saveSessionData(sessionId, context, cb);

    // cb(context);
  },

  error: (sessionId, context, msg) => {
    console.log('Oops, I don\'t know what to do.', msg);
  },

  fetchObjectsByLocation: (sessionId, context, cb) => {
    // Here should go the api call, e.g.:
    // context.forecast = apiCall(context.location)
    switch (context.intent) {
    case 'tours':
      context.response = '2 hour tour, 20 POI tour, Super nice tour';
      break;
    case 'museums':
      context.response = 'Super cool museum, other extra cool museum and some shitty one';
      break;
    default:
      console.log('nope');
    }

    saveSessionData(sessionId, context, cb);
    // cb(context);
  },
  
  cleanupSessionContext: (sessionId, context, cb) => {
    delete context.intent;
    delete context.location;
    delete context.response;

    saveSessionData(sessionId, context, cb);
  }
};
 
const makeClient = function (token, specificActions) {
  return new Wit(token, Object.assign(actions, specificActions));
};

module.exports = makeClient;

