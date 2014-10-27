var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
KeywordSchema = new Schema({
  keyword: {
    type: String,
    required: true
  },
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'KeywordCategory'
  }],
  checks: [{
    type: Schema.Types.ObjectId,
    ref: 'KeywordChecks'
  }]
});

mongoose.model('Keyword', KeywordSchema);
