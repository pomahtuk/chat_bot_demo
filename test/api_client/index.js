/* global describe, it */
'use strict';

const expect = require('chai').expect;
const IZIClient = require('../../api_client');
const envConfig = require('../../env.json');

// test FB version of client
const facebookClient = new IZIClient(envConfig.IZI_API_KEY, 'FB');
const defaultClient = new IZIClient(envConfig.IZI_API_KEY);

const validRequest = {
  type: 'tour',
  location: {
    lat: '52.365935964273',
    lng: '4.8978561532061'
  },
  limit: 1
};

const validZeroResultsRequest = {
  type: 'tour',
  radius: 100,
  location: {
    lat: '90',
    lng: '90'
  },
  limit: 1
};

[facebookClient, defaultClient].map((clientToTest) => {
  describe(`IZI API client for ${clientToTest.messenger} messenger`, function () {
    this.timeout(3000);
    this.slow(750);

    it('Creates an instance of IZIClient class', function (done) {
      expect(clientToTest).to.be.ok;
      done();
    });

    it('Should return a list of object in response to valid request', function (done) {
      let apiRequestResults = clientToTest.getObjects(Object.assign({}, validRequest));

      apiRequestResults.then((data) => {
        expect(data).to.be.an('array');
        expect(data).to.have.lengthOf(validRequest.limit);

        done();
      }, (err) => {
        expect(err).not.to.exist;

        done();
      });

    });

    it('Should handle 0 results for valid request properly', function (done) {
      let apiRequestResults = clientToTest.getObjects(Object.assign({}, validZeroResultsRequest));

      apiRequestResults.then((data) => {
        expect(data).to.be.an('array');
        expect(data).to.have.lengthOf(0);
        done();
      }, (err) => {
        expect(err).not.to.exist;

        done();
      });

    });
  });
});
