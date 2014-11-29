'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
UserSchema = new Schema({
  name: String,
  achievements: [{
    achievement: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    percentComplete: Number,
    dateIssued: {
      type: Date,
      default: Date.now
    },
    dateCompleted: Date
  }],
  notifications: [{
    title: String,
    description: String,
    glyph: String,
    acknowledged: {
      type: Boolean,
      default: false
    }
  }]
});

UserSchema.statics = {
};
UserSchema.methods = {
  pushNotification: function (title, desc, glyph) {
    this.notifications.push({
      title: title,
      description: desc,
      glyph: String
    });
  }
};

module.exports = mongoose.model('User', UserSchema);