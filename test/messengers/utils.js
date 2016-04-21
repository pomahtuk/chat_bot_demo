/* global describe, it */
'use strict';

const fbUtils = require('../../messengers/facebook/utils.js');
const expect = require('chai').expect;

const FAKE_ID = '68137648923765';
const FAKE_SENDER_ID = '0356934759834765';

const validBody = returnValidWebhookObject('message', {
  'text': 'hello, world!'
});

const invalidBody = {
   'object': 'page',
   'entry': [
      {
       'id': FAKE_ID,
       'time': 1458668856451
      }
   ]
};

const validLocationAttachmentBody = returnValidWebhookObject('message', {
  'attachments': [
    {
      'type': 'location',
      'payload': {
        'coordinates': {
          lat: 90,
          long: 90
        }
      }
    }
  ]
});

const validOtherAttachmentBody = returnValidWebhookObject('message', {
  'attachments': [
    {
      'type': 'image',
      'payload': {
        'url': 'IMAGE_URL'
      }
    }
  ]
});

const validPostbackBody = returnValidWebhookObject('postback', {
  'payload': 'USER_DEFINED_PAYLOAD'
});


function returnValidWebhookObject (key, data) {
  let template = {
    'object': 'page',
    'entry': [
      {
        'id': FAKE_ID,
        'messaging': [
          {
            'sender': {
              'id': FAKE_SENDER_ID
            },
            'recipient': {
              'id': FAKE_ID
            }
          }
        ]
      }
    ]
  };

  template.entry[0].messaging[0][key] = data;

  return template;
}

function createAndCheckPreperedResponse (body) {
  let processedWebhook = fbUtils.getFirstMessagingEntry(body, FAKE_ID);
  let examinationResult = fbUtils.prepareBotMessage(processedWebhook);

  expect(examinationResult).to.be.an('object');
  expect(examinationResult).to.have.ownProperty('recepient');
  expect(examinationResult).to.have.ownProperty('type');
  expect(examinationResult).to.have.ownProperty('outOfContext');

  return examinationResult;
}

describe('Facebook utilities test', function () {
  it('Should be an object with two predefined methods', function testPath (done) {
    expect(fbUtils).to.be.an('object');
    expect(fbUtils).to.have.ownProperty('getFirstMessagingEntry');
    expect(fbUtils).to.have.ownProperty('prepareBotMessage');

    done();
  });

  describe('Facebook utils \'getFirstMessagingEntry\' method tests', function () {
    it('Should process a valid payload and return a messaging object', function (done) {
      let examinatedResponse = fbUtils.getFirstMessagingEntry(validBody, FAKE_ID);

      expect(examinatedResponse).to.deep.equal(validBody.entry[0].messaging[0]);

      done();
    });

    it('Should return null for wrong PAGE_ID', function (done) {
      let examinatedResponse = fbUtils.getFirstMessagingEntry(validBody, '1');

      expect(examinatedResponse).to.be.null;

      done();
    });

    it('Should return null if request does not contain messaging object', function (done) {
      let examinatedResponse = fbUtils.getFirstMessagingEntry(invalidBody, FAKE_ID);

      expect(examinatedResponse).to.be.null;

      done();
    });

  });

  describe('Facebook utils \'prepareBotMessage\' method tests', function () {
    it('Should process regular user input', function (done) {
      let examinationResult = createAndCheckPreperedResponse(validBody, FAKE_ID);

      expect(examinationResult.outOfContext).to.be.null;
      expect(examinationResult).to.have.ownProperty('msg');
      expect(examinationResult.msg).to.equal(validBody.entry[0].messaging[0].message.text);
      expect(examinationResult.recepient).to.equal('bot');

      done();
    });

    it('Should process location user input', function (done) {
      let examinationResult = createAndCheckPreperedResponse(validLocationAttachmentBody, FAKE_ID);

      expect(examinationResult.outOfContext).not.to.be.null;
      expect(examinationResult).to.have.ownProperty('msg');
      expect(examinationResult.outOfContext).to.deep.equal({
        coordinates: {
          lat: 90,
          lng: 90
        }
      });
      expect(examinationResult.msg).to.equal('near ' + validLocationAttachmentBody.entry[0].messaging[0].message.attachments[0].title);
      expect(examinationResult.recepient).to.equal('bot');

      done();
    });

    it('Should process any other user attachment', function (done) {
      let examinationResult = createAndCheckPreperedResponse(validOtherAttachmentBody, FAKE_ID);

      expect(examinationResult.outOfContext).to.be.null;
      expect(examinationResult).to.have.ownProperty('msg');
      expect(examinationResult.msg).to.equal('Sorry I can only process text messages or location attachments for now.');
      expect(examinationResult.recepient).to.equal('sender');

      done();
    });

    it('Should process postback from user', function (done) {
      let examinationResult = createAndCheckPreperedResponse(validPostbackBody, FAKE_ID);
      let postback =  validPostbackBody.entry[0].messaging[0].postback;

      expect(examinationResult.outOfContext).to.be.null;
      expect(examinationResult).to.have.ownProperty('msg');
      expect(examinationResult.msg).to.equal(`Ok, got you, ${JSON.stringify(postback).substring(0, 200)}`);
      expect(examinationResult.recepient).to.equal('sender');

      done();
    });

    describe('Should handle keywords from user input differently', function () {
      ['generic', 'button', 'receipt'].map((keyword) => {
        let validKeywordBody = returnValidWebhookObject('message', {
          'text': keyword
        });
        it(`Should return template for '${keyword}' keyword from user`, function (done) {
          let examinationResult = createAndCheckPreperedResponse(validKeywordBody, FAKE_ID);

          expect(examinationResult.outOfContext).to.be.null;
          expect(examinationResult).not.to.have.ownProperty('msg');
          expect(examinationResult.templatedMsg).to.be.an('object');
          expect(examinationResult.recepient).to.equal('sender');
          expect(examinationResult.type).to.equal('templated');

          done();
        });
      });
    });

  });
});
