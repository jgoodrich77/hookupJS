var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
KeywordCheckSchema = new Schema({
  keyword_id: {
    type: Schema.Types.ObjectId,
    ref: 'Keyword'
  },
  results: [{
    website: String,
    url: String,
    title: String,
    snippet: String,
    metatags: String
  }],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('KeywordCheck', KeywordCheckSchema);
