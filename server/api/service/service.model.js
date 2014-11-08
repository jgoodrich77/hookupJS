'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
ServiceSchema = new Schema({
  name: String,
  description: String,
  free: Boolean,
  tags: [String],
  adapter: {
    factoryClass: String,
    defaultParams: Object
  }
});

module.exports = mongoose.model('Service', ServiceSchema);