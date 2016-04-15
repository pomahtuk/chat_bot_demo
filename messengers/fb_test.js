const request = require("request")

const CONFIG = {
  FB_PAGE_TOKEN: "CAAQOo8VIiKYBADZCbmPmw0DIvRz1P2WDcrNhzbmXsZASwYcZA2gO3xFLKlrD8eB3Jc4rA0eEPZCMRE5UOSNOYpo2ZChNJDOrlLeaq6zuIeDNl87DTbH9pYig82uzpEzMxJWliUYccR1o0q1bpzBXdpJrkQkmHmQxXAUIEawPWyiZC9zRqRM0ZBv8WOqaAR4uZCMZD",
}

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

sendMessage('1', 'hi');