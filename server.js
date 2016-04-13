const http = require("http"),
  express = require("express"),
  morgan = require("morgan"),
  bodyParser = require("body-parser"),
  responseTime = require("response-time")

const app = express()
// log response time
app.use(responseTime())
// log requests
app.use(morgan("combined"))
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.get("/", function (req, res) {
  res.send("OK")
})

const port = process.env.PORT || 3010

http.createServer(app).listen(port, function(){
  console.log(`server started at port ${port}`)
})