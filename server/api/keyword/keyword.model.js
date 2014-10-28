var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
KeywordSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
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
