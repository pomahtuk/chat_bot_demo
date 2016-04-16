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

const actions = {
  say: (sessionId, msg, cb) => {
    console.log('bot will say this using default handler! ==', msg);
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

    cb(context);
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

    cb(context);
  },
  
  cleanupSessionContext: (sessionId, context, cb) => {
    delete context.intent;
    delete context.location;
    delete context.response;

    cb(context);
  }
};
 
const makeClient = function (token, specificActions) {
  return new Wit(token, Object.assign(actions, specificActions));
};

module.exports = makeClient;

