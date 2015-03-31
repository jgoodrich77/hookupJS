'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
UserFbPageSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true
  },
  fbPageId: {
    type: String,
    required: true,
    index: true,
    required: true
  },
  scores: [{
    date: {
      type: Date,
      default: Date.now
    },
    score: Number,
    breakdown: Object
  }],
  posts: [{
    date: {
      type: Date,
      default: Date.now
    },
    postId: {
      type: String,
      required: true
    },
    message: String,
    name: String,
    link: String,
    caption: String,
    description: String,
    uploads: [{
      upload: {
        type: Schema.Types.ObjectId,
        ref: 'UserUpload',
        required: true
      }
    }]
  }]
});

/**
 * Statics
 */
UserFbPageSchema.statics = {
  // hasPage: function(user, pageId, cb) {
  // },
  // addPage: function(user, pageId, cb) {
  // }
};

/**
 * Methods
 */
UserFbPageSchema.methods = {
};

module.exports = mongoose.model('UserFbPage', UserFbPageSchema);
