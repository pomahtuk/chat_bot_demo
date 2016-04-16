'use strict'

const fbMessages = require('./messages.js')
const fbSessions = require('./sessions.js')

function fbBotSay (sessionId, msg, cb) {
  // Our bot has something to say!
  // Let's retrieve the Facebook user whose session belongs to
  const userSession = fbSessions.findOrCreateSession(sessionId)
  const recipientId = userSession.sesionParams.senderId

  console.log(userSession.sesionParams)

  if (recipientId) {
    // Yay, we found our recipient!
    // Let's forward our bot response.
    fbMessages.sendTextMessage(recipientId, msg, (err) => {
      if (err) {
        console.log('Oops! An error occurred while forwarding the response', err)
      }
      // Let's give the wheel back to our bot
      cb()
    })
  } else {
    console.log('Oops! Couldnt find user for session:', sessionId)
    // Giving the wheel back to our bot
    cb()
  }
}

module.exports = {
  say: fbBotSay
}
