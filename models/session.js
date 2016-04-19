'use strict';

/**
 * Module dependencies.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


/**
 * Session Schema
 */
const SessionSchema = new Schema({
  senderId: { type: String, default: '', trim: true },
  context: { type: Schema.Types.Mixed, default: {} },
  outOfContext: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});


const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;
