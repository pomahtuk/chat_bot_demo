/* global describe, it */
'use strict';

const GoogleGeocoder = require('../../../tools/geocoder/google.js');
const envConfig = require('../../../env.json');
const expect = require('chai').expect;

const gCoder = new GoogleGeocoder(envConfig.GOOGLE_KEY);

describe('Google geocoder tests', function () {
  this.timeout(3000);
  this.slow(750);

  it('creates an instance of GoogleGeocoder class', function (done) {
    expect(gCoder).to.be.ok;

    done();
  });

  it('Returns a coordinates to a valid adress line', function (done) {
    let geocodePromise = gCoder.getCoordinates('Amsterdam, Julius Pergerstraat 244');

    expect(geocodePromise).to.be.a('promise');

    geocodePromise.then(function (data) {
      expect(data).to.exist;

      expect(data).to.have.property('locationName')
        .and.equal('Julius Pergerstraat 244, 1087 Amsterdam, Netherlands');

      expect(data).to.have.property('coordinates')
        .and.to.be.an('object');

      done();
    });
    geocodePromise.catch(function (err) {
      expect(err).not.to.exist;
      done();
    });
  });

  it('Returns an error to adress line that makes no sense', function (done) {
    let geocodePromise = gCoder.getCoordinates('ololol ololo vi vse bydlo i huilo');

    expect(geocodePromise).to.be.a('promise');

    geocodePromise.then(function (data) {
      expect(data).not.to.exist;
      done();
    });

    geocodePromise.catch(function (err) {
      expect(err).to.exist;
      expect(err).to.be.an('object');
      expect(err).to.have.property('status');

      done();
    });

  });

});