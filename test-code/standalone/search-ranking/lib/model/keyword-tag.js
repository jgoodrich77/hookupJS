'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
KeywordTagSchema = new Schema({
  name: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('KeywordTag', KeywordTagSchema);