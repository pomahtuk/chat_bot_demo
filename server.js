"use strict"

const http = require("http"),
  express = require("express"),
  request = require("superagent"),
  // morgan = require("morgan"),
  bodyParser = require("body-parser"),
  responseTime = require("response-time")

const app = express()
// log response time
app.use(responseTime())
// log requests
// app.use(morgan("combined"))
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())


const pageToken = "CAAQOo8VIiKYBANPgUjv5zpwxQPynohHYps9ZAJDa3HCSZBSdHbgSBNQHJ0m44Vzlhgi2puGWXgYURX46jp6INSDqLYxHjRugA5wfvgWZC9XRZAKD4EtjPGSxGAYmuVIzeSnbkliKorwilmZCGcJfZCFuV66hAZAlcZAJPRSm7wfXm88UTC78BYQCzZBFC9J3R7xcZD"

function sendMessage (sender, message) {
  request
    .post("https://graph.facebook.com/v2.6/me/messages")
    .query({access_token: pageToken})
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

app.get("/webhook/", function (req, res) {
  if (req.query["hub.verify_token"] === "use_the_force_noob") {
    res.send(req.query["hub.challenge"])
  }
  res.send("Error, wrong validation token")
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

const port = process.env.PORT || 3010

http.createServer(app).listen(port, function(){
  console.log(`server started at port ${port}`)
})
