'use strict'

// TODO: use database for this!

let sessions = {}

class Session {
  constructor(id, sesionParams = {senderId: null, context: null}) {
    this.id = id || new Date().toISOString()
    this.sesionParams = sesionParams
  }

  getSenderId() {
    return this.sesionParams && this.sesionParams.senderId || null
  }

  getContext() {
    return this.sesionParams && this.sesionParams.context || null
  }

  setContext(newContext) {
    this.sesionParams.context = newContext
    return true
  }
}

function findOrCreateSession (sessionId) {
  // Let's see if we already have a session for the user fbid
  let hasThisSessionObject = sessions[sessionId]

  if (!hasThisSessionObject) {
    // No session found for sessionId, let's create a new one
    sessions[sessionId] = new Session(sessionId)
  }

  return sessions[sessionId]
}


// TODO: sessions in mongo
const findOrCreateSessionBySenderId = (senderId) => {
  let sessionId

  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(key => {
    if (sessions[key].senderId === senderId) {
      // Yep, got it!
      sessionId = key
    }
  })

  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    let newSession = new Session(null, {
      senderId: senderId,
      context: {}
    })

    sessionId = newSession.id
    sessions[sessionId] = newSession
  }

  return sessions[sessionId]
}

module.exports = {
  findOrCreateSession: findOrCreateSession,
  findOrCreateSessionBySenderId: findOrCreateSessionBySenderId
}