'use strict';

require('newrelic');

require('pmx').init({
  http : true,
  errors        : true, // Exceptions loggin (default: true)
  custom_probes : true, // Auto expose JS Loop Latency and HTTP req/s as custom metrics
  network       : true, // Network monitoring at the application level
  ports         : true  // Shows which ports your app is listening on (default: false)
});

const express = require('express'),
  bodyParser = require('body-parser'),
  mongoose   = require('mongoose'),
  fbRouter = require('./messengers/facebook'),
  envConfig = require('./env.json');

const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Messenger API parameters
const FB_PAGE_ID = envConfig.FACEBOOK_PAGE_ID && Number(envConfig.FACEBOOK_PAGE_ID);
if (!FB_PAGE_ID) {
  throw new Error('missing FB_PAGE_ID');
}

const FB_PAGE_TOKEN = envConfig.FACEBOOK_TOKEN;
if (!FB_PAGE_TOKEN) {
  throw new Error('missing FACEBOOK_TOKEN');
}
// initialize bots
app.use('/webhook', fbRouter);

function connect () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.Promise = global.Promise;
  mongoose.set('debug', envConfig.NODE_ENV === 'development' && !process.env.NODE_ENV === 'test');
  return mongoose.connect('mongodb://localhost/bot', options).connection;
}

const PORT = Number(envConfig.PORT) || 3010;

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
