/* global describe, beforeEach, afterEach, it */

'use strict'

const request = require('supertest')

describe('Base server check', function () {
  let server

  beforeEach(function () {
    server = require('../server.js')
  })

  afterEach(function () {
    server.close()
  })

  it('return 404 to all routes expect specified', function testPath(done) {
    request(server).get('/foo/bar').expect(404, done)
  })
})