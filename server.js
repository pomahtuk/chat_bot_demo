'use strict';

require('newrelic');

const express = require('express'),
  bodyParser = require('body-parser'),
  mongoose   = require('mongoose'),
  fbRouter = require('./messengers/facebook');

const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Messenger API parameters
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID && Number(process.env.FACEBOOK_PAGE_ID);
if (!FB_PAGE_ID) {
  throw new Error('missing FB_PAGE_ID');
}

const FB_PAGE_TOKEN = process.env.FACEBOOK_TOKEN;
if (!FB_PAGE_TOKEN) {
  throw new Error('missing FACEBOOK_TOKEN');
}
// initialize bots
app.use('/webhook', fbRouter);

function connect () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.Promise = global.Promise;
  mongoose.set('debug', process.env.NODE_ENV !== 'production');
  return mongoose.connect('mongodb://localhost/bot', options).connection;
}

const PORT = Number(process.env.PORT) || 3010;

connect()
  .on('error', console.log)
  .on('disconnected', connect)
  .once('open', listen);

function listen () {
  if (app.get('env') === 'test') return;
  app.listen(PORT);
  console.log(`server started at port ${PORT}`);
}

module.exports = app;
