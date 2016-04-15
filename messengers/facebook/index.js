'use strict'

const fbRoutes = require('./routes.js')
const fbActions = require('./actions.js')
const makeWitBot = require('../../wit_bot/bot.js')

function facebookMessengerInit (app) {
  const wit = makeWitBot(app.get('WIT_TOKEN'), fbActions)
  fbRoutes('/webhook', app, wit)
}

module.exports = facebookMessengerInit
