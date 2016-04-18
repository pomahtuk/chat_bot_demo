'use strict';

const request = require('request');
const envConfig = require('../../env.json');

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference
const fbReq = request.defaults({
  uri: 'https://graph.facebook.com/me/messages',
  method: 'POST',
  json: true,
  qs: { access_token: envConfig.FACEBOOK_TOKEN },
  headers: { 'Content-Type': 'application/json' }
});

const sendMessage = (recipientId, msg, messageCallback) => {
  const opts = {
    form: {
      recipient: {
        id: recipientId
      },
      message: msg
    }
  };
  fbReq(opts, function (err, resp, data) {
    // console.log('got fb response:', resp.body);

    if (messageCallback) {
      messageCallback(err, resp, data);
    }
  });
};

function sendTextMessage (sender, text) {
  // TODO: in this case error frome facebook side will be unhandled
  sendMessage(sender, {
    text: text
  }, null);
}

//
// Some validation functions
//

// validate CTA inside message
function valudateCTAElement (ctaElement) {
  const ALLOWED_CTA_TITLE_LENGTH = 20;

  let validationErrors = [];

  if (ctaElement.title.length > ALLOWED_CTA_TITLE_LENGTH) {
    validationErrors.push(`Wrong title length. Must be not more than ${ALLOWED_CTA_TITLE_LENGTH}`);
  }

  if (validationErrors.length > 0) {
    return {
      status: 'failure',
      errors: validationErrors
    };
  }

  return {
    status: 'success'
  };
}

// validate template elements
function validateTemplateElement (tmplElement) {
  const ALLOWED_TITLE_LENGTH = 45;
  const ALLOWED_SUBTITLE_LENGTH = 80;
  const ALLOWED_CTA_ELEMENTS = 3;

  let validationErrors = [];

  if (tmplElement.title && tmplElement.title.length > ALLOWED_TITLE_LENGTH) {
    validationErrors.push(`Wrong title length. Must be not more than ${ALLOWED_TITLE_LENGTH}`);
  }

  if (tmplElement.subtitle && tmplElement.subtitle.length > ALLOWED_SUBTITLE_LENGTH) {
    validationErrors.push(`Wrong subtitle length. Must be not more than ${ALLOWED_SUBTITLE_LENGTH}`);
  }

  if (tmplElement.buttons && tmplElement.buttons.length > ALLOWED_CTA_ELEMENTS) {
    validationErrors.push(`Wrong number of CTAs. Must be not more than ${ALLOWED_CTA_ELEMENTS}`);
  }

  tmplElement.buttons && tmplElement.buttons && tmplElement.buttons.forEach((ctaElement, index) => {
    let ctaStatus = valudateCTAElement(ctaElement);
    if (ctaStatus.status !== 'success') {
      validationErrors.push(`CTA ${index} has this errors: \n\t ${ctaStatus.errors.join(',\n\t')}.`);
    }
  });

  if (validationErrors.length > 0) {
    return {
      status: 'failure',
      errors: validationErrors
    };
  }

  return {
    status: 'success'
  };
}

// validate whole message
function validateTemplateMessage (msgObject) {
  const ALLOWED_TYPES = ['generic', 'button', 'receipt'];
  const ALLOWED_ELEMENTS = 10;

  let payload = msgObject.payload;
  let templateType = payload.template_type;
  let elements = payload.elements;
  let buttons = payload.buttons;
  let validationErrors = [];

  if (ALLOWED_TYPES.indexOf(templateType) < 0) {
    validationErrors.push(`Wrong template type. Must be one of those: ${ALLOWED_TYPES.join(', ')}`);
  }

  if (elements && elements.length > ALLOWED_ELEMENTS) {
    validationErrors.push(`Wrong number of elements. Must be not more than ${ALLOWED_ELEMENTS}`);
  }

  elements && elements.forEach((element, index) => {
    let elementStatus = validateTemplateElement(element);
    if (elementStatus.status !== 'success') {
      validationErrors.push(`Element ${index} has this errors: \n\t ${elementStatus.errors.join(',\n\t')}.`);
    }
  });

  buttons && buttons.forEach((ctaElement, index) => {
    let ctaStatus = valudateCTAElement(ctaElement);
    if (ctaStatus.status !== 'success') {
      validationErrors.push(`CTA ${index} has this errors: \n\t ${ctaStatus.errors.join(',\n\t')}.`);
    }
  });

  if (validationErrors.length > 0) {
    return {
      status: 'failure',
      errors: validationErrors
    };
  }

  return {
    status: 'success'
  };
}

function sendTemplatedMessage (sender, msgObject) {
  let messageValidationResult = validateTemplateMessage(msgObject);

  if (messageValidationResult.status == 'success') {
    // all ok, we are good to go
    // TODO: handle facebook errors
    sendMessage(sender, {
      attachment: msgObject
    }, null);
  } else {
    console.log('Error validating message', messageValidationResult.errors);
  }
}

module.exports = {
  sendTextMessage: sendTextMessage,
  sendTemplatedMessage: sendTemplatedMessage,
  validateTemplateMessage: validateTemplateMessage
};
