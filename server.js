"use strict"

require("newrelic")

const http = require("http"),
  express = require("express"),
  bodyParser = require("body-parser"),
  responseTime = require("response-time"),
  fasebookMessengerBot = require("./messengers/facebook.js")

const app = express()
// log response time
app.use(responseTime())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// Parameters required for app
const WIT_TOKEN = process.env.WIT_TOKEN
app.set("WIT_TOKEN", WIT_TOKEN)

// Messenger API parameters
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID && Number(process.env.FACEBOOK_PAGE_ID)
if (!FB_PAGE_ID) {
  throw new Error("missing FB_PAGE_ID")
}
app.set("FB_PAGE_ID", FB_PAGE_ID)

const FB_PAGE_TOKEN = process.env.FACEBOOK_TOKEN
if (!FB_PAGE_TOKEN) {
  throw new Error("missing FACEBOOK_TOKEN")
}
app.set("FB_PAGE_TOKEN", FB_PAGE_TOKEN)

const FB_VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN
app.set("FB_VERIFY_TOKEN", FB_VERIFY_TOKEN)

// initialize bots
fasebookMessengerBot(app)

const PORT = Number(process.env.PORT) || 3010

http.createServer(app).listen(PORT, function(){
  console.log(`server started at port ${PORT}`)
})
