/* global describe, it */

'use strict'

const request = require('supertest')
const app = require('../server.js')
const agent = request.agent(app)

describe('Base server check', function () {
  it('return 404 to all routes expect specified', function testPath(done) {
    agent.get('/foo/bar').expect(404, done)
  })
})