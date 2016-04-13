'use strict';
const Wit = require('node-wit').Wit;

const token = (() => {
  if (process.argv.length !== 3) {
    console.log('usage: node index.js <wit-token>');
    process.exit(1);
  }
  return process.argv[2];
})();

const actions = {
  say: (sessionId, msg, cb) => {
    //console.log(msg);
    cb();
  },
  merge: (context, entities, cb) => {
    cb(context);
  },
  error: (sessionId, msg) => {
    console.log('Oops, I don\'t know what to do.');
  },
  'fetchMuseumsByLocation': (context, cb) => {
    // Here should go the api call, e.g.:
    // context.forecast = apiCall(context.location)
    context.museums = 'Super cool museum, other extra cool museum and some shitty one';
    context.location = 'Geocoded location';
    cb(context);
  },
};

const client = new Wit(token, actions);
client.interactive();
// client.runActions();
