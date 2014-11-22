'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
KeywordCheckSchema = new Schema({
  keyword: {
    type: Schema.Types.ObjectId,
    ref: 'Keyword',
    required: true
  },
  results: [{
    rank: Number,
    title: String,
    link: String,
    snippet: String //,
    // pagemap: String
  }],
  date: {
    type: Date,
    default: Date.now,
    required: true
  }
});

module.exports = mongoose.model('KeywordCheck', KeywordCheckSchema);