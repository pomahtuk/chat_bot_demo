'use strict'

const fbUtils = require('./utils.js')
const fbMessages = require('./messages.js')
const fbSessions = require('./sessions.js')
const express = require('express')

const router = express.Router()

function fbRoutes (prefix, app, wit) {

  const CONFIG = {
    FB_PAGE_TOKEN: app.get('FB_PAGE_TOKEN'),
    FB_VERIFY_TOKEN: app.get('FB_VERIFY_TOKEN'),
    FB_PAGE_ID: app.get('FB_PAGE_ID')
  }

  router.get('/', function (req, res) {
    if (!CONFIG.FB_VERIFY_TOKEN) {
      throw new Error('missing FB_VERIFY_TOKEN')
    }
    if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === CONFIG.FB_VERIFY_TOKEN) {
      res.send(req.query['hub.challenge'])
    } else {
      res.sendStatus(400)
    }
  })

  // Message handler
  router.post('/', (req, res) => {
    // Parsing the Messenger API response
    const messaging = fbUtils.getFirstMessagingEntry(req.body, CONFIG.FB_PAGE_ID)

    if (messaging && messaging.message && messaging.recipient.id === CONFIG.FB_PAGE_ID) {
      // Yay! We got a new message!

      // We retrieve the Facebook user ID of the sender
      const sender = messaging.sender.id

      // We retrieve the user's current session, or create one if it doesn'''t exist
      // This is needed for our bot to figure out the conversation history
      const userSession = fbSessions.findOrCreateSessionBySenderId(sender)

      // We retrieve the message content
      const msg = messaging.message.text
      const atts = messaging.message.attachments

      if (atts) {
        console.log('got mesage wit attachment', atts)
        // We received an attachment
        // Let's reply with an automatic message
        fbMessages.sendTextMessage(sender, 'Sorry I can only process text messages for now.')
      } else if (msg) {
        // console.log('got valid text message')
        // We received a text message
        // Let's forward the message to the Wit.ai Bot Engine
        // This will run all actions until our bot has nothing left to do
        wit.runActions(
          userSession.id, // the user's current session
          msg, // the user's message 
          userSession.getContext(), // the user's current session state
          (error, context) => {
            if (error) {
              console.log('Oops! Got an error from Wit:', error)
            } else {
              // Our bot did everything it has to do.
              // Now it's waiting for further messages to proceed.
              console.log('Waiting for futher messages.')
              // Updating the user's current session state
              userSession.setContext(context)
            }
          }
        )
      }
    }
    res.sendStatus(200)
  })

  app.use(prefix, router)
}

module.exports = fbRoutes
