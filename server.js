const http = require("http"),
  express = require("express"),
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

app.get("/webhook/", function (req, res) {
  if (req.query["hub.verify_token"] === "use_the_force_noob") {
    res.send(req.query["hub.challenge"])
  }
  res.send("Error, wrong validation token")
})

const port = process.env.PORT || 3010

http.createServer(app).listen(port, function(){
  console.log(`server started at port ${port}`)
})