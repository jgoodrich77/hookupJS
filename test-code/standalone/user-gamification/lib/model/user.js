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
    dateCompleted: {
      type: Date,
      default: Date.now
    }
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
  },
  getAchievementDate: function(achievement) {
    var
    id = achievement._id || achievement,
    result = false;

    this.achievements.every(function (achievement) {
      var tId = achievement.achievement._id || achievement.achievement;

      if(tId.equals(id)) {
        result = achievement.dateCompleted;
        return false;
      }

      return true;
    });

    return result;
  },
  hasAchievement: function(achievement) {
    var id = achievement._id || achievement;

    return !this.achievements.every(function (achievement) {
      var tId = achievement.achievement._id || achievement.achievement;
      return !tId.equals(id);
    });
  },
  addAchievement: function(achievement) {
    if(this.hasAchievement(achievement)) return false;

    this.achievements.push({
      achievement: achievement
    });

    return true;
  }
};

module.exports = mongoose.model('User', UserSchema);