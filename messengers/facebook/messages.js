'use strict'

const request = require('request')

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference
const fbReq = request.defaults({
  uri: 'https://graph.facebook.com/me/messages',
  method: 'POST',
  json: true,
  qs: { access_token: process.env.FACEBOOK_TOKEN },
  headers: {'Content-Type': 'application/json'}
})

const sendMessage = (recipientId, msg, cb) => {
  const opts = {
    form: {
      recipient: {
        id: recipientId
      },
      message: msg
    }
  }
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
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [{
          title: 'First card',
          subtitle: 'Element #1 of an hscroll',
          image_url: 'http://messengerdemo.parseapp.com/img/rift.png',
          buttons: [{
            type: 'web_url',
            url: 'https://www.messenger.com/',
            title: 'Web url'
          }, {
            type: 'postback',
            title: 'Postback',
            payload: 'Payload for first element in a generic bubble'
          }]
        }, {
          title: 'Second card',
          subtitle: 'Element #2 of an hscroll',
          image_url: 'http://messengerdemo.parseapp.com/img/gearvr.png',
          buttons: [{
            type: 'postback',
            title: 'Postback',
            payload: 'Payload for second element in a generic bubble'
          }]
        }]
      }
    }
  })
}

module.exports = {
  sendTextMessage: sendTextMessage,
  sendGenericMessage: sendGenericMessage
}
