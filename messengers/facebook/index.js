'use strict';

const fbRouteHandlers = require('./route_handlers.js');
const express = require('express');
const router = express.Router();

router.get('/', fbRouteHandlers.facebookVerification);
// Message handler
router.post('/', fbRouteHandlers.mainRoute);

module.exports = router;

