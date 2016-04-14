"use strict"

const request = require("superagent")

function facebookMessengerInit(app) {
  const CONFIG = {
    PAGE_TOKEN: app.get("FB_PAGE_TOKEN"),
    FB_VERIFY_TOKEN: app.get("FB_VERIFY_TOKEN"),
    FB_PAGE_ID: app.get("FB_PAGE_ID")
  }

  const SESSIONS = {}

  function sendMessage (sender, message) {
    request
      .post("https://graph.facebook.com/v2.6/me/messages")
      .query({access_token: CONFIG.PAGE_TOKEN})
      .send({
        recipient: {
          id: sender
        },
        message: message
      })
      .end((err, res) => {
        if (err) {
          console.log("Error sending message: ", err)
        } else if (res.body.error) {
          console.log("Error: ", res.body.error)
        }
      })
  }

  function sendTextMessage (sender, text) {
    sendMessage(sender, {
      text: text
    })
  }

  function sendGenericMessage (sender) {
    sendMessage(sender, {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "First card",
            subtitle: "Element #1 of an hscroll",
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.messenger.com/",
              title: "Web url"
            }, {
              type: "postback",
              title: "Postback",
              payload: "Payload for first element in a generic bubble"
            }]
          }, {
            title: "Second card",
            subtitle: "Element #2 of an hscroll",
            image_url: "http://messengerdemo.parseapp.com/img/gearvr.png",
            buttons: [{
              type: "postback",
              title: "Postback",
              payload: "Payload for second element in a generic bubble"
            }]
          }]
        }
      }
    })
  }

  // See the Webhook reference
  // https://developers.facebook.com/docs/messenger-platform/webhook-reference
  const getFirstMessagingEntry = (body) => {
    const val = body.object == "page" &&
      body.entry &&
      Array.isArray(body.entry) &&
      body.entry.length > 0 &&
      body.entry[0] &&
      body.entry[0].id == CONFIG.FB_PAGE_ID &&
      body.entry[0].messaging &&
      Array.isArray(body.entry[0].messaging) &&
      body.entry[0].messaging.length > 0 &&
      body.entry[0].messaging[0]

    return val || null
  }

  // TODO: sessions in mongo
  const findOrCreateSession = (fbid) => {
    let sessionId

    // Let"s see if we already have a session for the user fbid
    Object.keys(SESSIONS).forEach(key => {
      if (SESSIONS[key].fbid === fbid) {
        // Yep, got it!
        sessionId = key
      }
    })

    if (!sessionId) {
      // No session found for user fbid, let"s create a new one
      sessionId = new Date().toISOString()
      SESSIONS[sessionId] = {
        fbid: fbid,
        context: {}
      }
    }

    return sessionId
  }

  app.get("/webhook/", function (req, res) {
    if (!CONFIG.FB_VERIFY_TOKEN) {
      throw new Error("missing FB_VERIFY_TOKEN")
    }
    if (req.query["hub.mode"] === "subscribe" &&
      req.query["hub.verify_token"] === CONFIG.FB_VERIFY_TOKEN) {
      res.send(req.query["hub.challenge"])
    } else {
      res.sendStatus(400)
    }
  })

  app.post("/webhook/", function (req, res) {
    let messagingEvents = req.body.entry[0].messaging

    messagingEvents.forEach((event) => {
      const sender = event.sender.id

      if (event.postback) {
        const text = JSON.stringify(event.postback).substring(0, 200)
        sendTextMessage(sender, "Postback received: " + text)
      } else if (event.message && event.message.text) {
        const text = event.message.text.trim().substring(0, 200)

        if (text.toLowerCase() === "generic") {
          sendGenericMessage(sender)
        } else {
          sendTextMessage(sender, "Text received, echo: " + text)
        }
      }
    })

    res.sendStatus(200)
  })
}

module.exports = facebookMessengerInit
