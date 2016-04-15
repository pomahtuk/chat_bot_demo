"use strict"

const request = require("request");
const makeWitBot = require("../wit_bot/bot.js")

function facebookMessengerInit(app) {
  const CONFIG = {
    PAGE_TOKEN: app.get("FB_PAGE_TOKEN"),
    FB_VERIFY_TOKEN: app.get("FB_VERIFY_TOKEN"),
    FB_PAGE_ID: app.get("FB_PAGE_ID"),
    WIT_TOKEN: app.get("WIT_TOKEN")
  }

  const wit = makeWitBot(CONFIG.WIT_TOKEN, {
    say: (sessionId, msg, cb) => {
      console.log("bot should say:", msg)

      // Our bot has something to say!
      // Let's retrieve the Facebook user whose session belongs to
      const recipientId = SESSIONS[sessionId].fbid;
      if (recipientId) {
        // Yay, we found our recipient!
        // Let's forward our bot response to her.
        sendMessage(recipientId, msg, (err, data) => {
          if (err) {
            console.log("Oops! An error occurred while forwarding the response");
          }
          // Let's give the wheel back to our bot
          cb();
        });
      } else {
        console.log("Oops! Couldnt find user for session:", sessionId);
        // Giving the wheel back to our bot
        cb();
      }
    }
  })

  const SESSIONS = {}

  // See the Send API reference
  // https://developers.facebook.com/docs/messenger-platform/send-api-reference
  const fbReq = request.defaults({
    uri: 'https://graph.facebook.com/me/messages',
    method: 'POST',
    json: true,
    qs: { access_token: CONFIG.FB_PAGE_TOKEN },
    headers: {'Content-Type': 'application/json'}
  })

  const sendMessage = (recipientId, msg, cb) => {
    const opts = {
      form: {
        recipient: {
          id: recipientId,
        },
        message: {
          text: msg,
        },
      },
    };
    fbReq(opts, (err, resp, data) => {
      if (cb) {
        cb(err || data.error && data.error.message, data)
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

  // Message handler
  app.post("/webhook/", (req, res) => {
    // Parsing the Messenger API response
    const messaging = getFirstMessagingEntry(req.body)

    if (messaging && messaging.message && messaging.recipient.id === CONFIG.FB_PAGE_ID) {
      // Yay! We got a new message!

      // We retrieve the Facebook user ID of the sender
      const sender = messaging.sender.id

      // We retrieve the user's current session, or create one if it doesn'"'t exist
      // This is needed for our bot to figure out the conversation history
      const sessionId = findOrCreateSession(sender)

      // We retrieve the message content
      const msg = messaging.message.text
      const atts = messaging.message.attachments

      if (atts) {
        console.log("got masage wit attachment")
        // We received an attachment
        // Let's reply with an automatic message
        sendTextMessage(sender, "Sorry I can only process text messages for now.")
      } else if (msg) {
        // We received a text message
        console.log("got processable message")
        // Let's forward the message to the Wit.ai Bot Engine
        // This will run all actions until our bot has nothing left to do
        wit.runActions(
          sessionId, // the user's current session
          msg, // the user's message 
          SESSIONS[sessionId].context, // the user's current session state
          (error, context) => {
            if (error) {
              console.log("Oops! Got an error from Wit:", error)
            } else {
              // Our bot did everything it has to do.
              // Now it's waiting for further messages to proceed.
              console.log("Waiting for futher messages.")
              // Updating the user"s current session state
              SESSIONS[sessionId].context = context
            }
          }
        );
      }
    }
    res.sendStatus(200)
  })

}

module.exports = facebookMessengerInit
