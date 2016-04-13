var https = require('https');
var fs = require('fs');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var responseTime = require('response-time');

var options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    // requestCert: false,
    // rejectUnauthorized: false
};

var app = express();
// log response time
app.use(responseTime())
// log requests
app.use(morgan('combined'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.get('/', function (req, res) {
	res.send('OK');
});

var server = https.createServer(options, app).listen(3010, function(){
    console.log("server started at port 3010");
});