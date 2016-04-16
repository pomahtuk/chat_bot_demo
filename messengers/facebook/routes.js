'use strict';

const fbRouteHandlers = require('./route_handlers.js');
const express = require('express');
const router = express.Router();

function fbRoutes (prefix, app) {

  router.get('/', fbRouteHandlers.facebookVerification);

  // Message handler
  router.post('/', fbRouteHandlers.mainRoute);

  app.use(prefix, router);
}

module.exports = fbRoutes;
