"use strict"

const http = require("http"),
  express = require("express"),
  https = require("https"),
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


const token = "CAAQOo8VIiKYBANPgUjv5zpwxQPynohHYps9ZAJDa3HCSZBSdHbgSBNQHJ0m44Vzlhgi2puGWXgYURX46jp6INSDqLYxHjRugA5wfvgWZC9XRZAKD4EtjPGSxGAYmuVIzeSnbkliKorwilmZCGcJfZCFuV66hAZAlcZAJPRSm7wfXm88UTC78BYQCzZBFC9J3R7xcZD"

function sendTextMessage(sender, text) {
  let messageData = {
    text: text
  }
  https.request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: token},
    method: "POST",
    json: {
      recipient: {id: sender},
      message: messageData
    }
  }, function(error, response) {
    if (error) {
      console.log("Error sending message: ", error)
    } else if (response.body.error) {
      console.log("Error: ", response.body.error)
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
  let messaging_events = req.body.entry[0].messaging
  for (let i = 0; i < messaging_events.length; i++) {
    let event = req.body.entry[0].messaging[i]
    let sender = event.sender.id
    if (event.message && event.message.text) {
      let text = event.message.text
      // Handle a text message from this sender
      sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200))
    }
  }
  res.sendStatus(200)
})

const port = process.env.PORT || 3010

http.createServer(app).listen(port, function(){
  console.log(`server started at port ${port}`)
})
