'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
KeywordSchema = new Schema({
  query: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Keyword', KeywordSchema);