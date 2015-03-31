'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
VocabularySchema = new Schema({
  facebookObjectId: String,
  words: [{
    root:        String,
    variations: [String],
    likes:       Number,
    comments:    Number,
    shares:      Number
  }],
  created: {
    type: Date,
    default: Date.now
  }
});

// VocabularySchema
//   .virtual('setupStatus')
//   .get(function() {
//     return {
//     };
//   });

/**
 * Statics
 */
VocabularySchema.statics = {
};

/**
 * Methods
 */
VocabularySchema.methods = {
};

module.exports = mongoose.model('Vocabulary', VocabularySchema);