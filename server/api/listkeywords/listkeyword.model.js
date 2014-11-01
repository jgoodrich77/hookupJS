var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
ListkeywordSchema = new Schema({
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
  }]
});

mongoose.model('Keyword', ListkeywordSchema);
