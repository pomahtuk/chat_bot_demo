/* global describe, it */
'use strict';

const expect = require('chai').expect;
const IZIClient = require('../../api_client');
const envConfig = require('../../env.json');

const clientToTest = new IZIClient(envConfig.IZI_API_KEY);

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

describe('IZI API client', function () {
  this.timeout(3000);
  this.slow(750);

  it('Creates an instance of IZIClient class', function (done) {
    expect(clientToTest).to.be.ok;
    done();
  });

  it('Should return a list of object in response to valid request', function (done) {
    let apiRequestResults = clientToTest.getObjects(validRequest);

    apiRequestResults.then((data) => {
      expect(data).to.be.an('array');
      expect(data).to.have.lengthOf(validRequest.limit);

      done();
    }, (err) => {
      expect(err).to.exist;

      done();
    });

  });

  it('Should handle 0 results for valid request properly', function (done) {
    let apiRequestResults = clientToTest.getObjects(validZeroResultsRequest);

    apiRequestResults.then((data) => {
      expect(data).to.be.an('array');
      expect(data).to.have.lengthOf(0);
      done();
    }, (err) => {
      expect(err).to.exist;

      done();
    });

  });
});
