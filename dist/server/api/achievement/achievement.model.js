'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
AchievementSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  visual: {
    locked: {
      text: String,
      glyph: String
    },
    unlocked: {
      text: String,
      glyph: String
    }
  },
  conditions: [{
    trigger: String,
    target: {
      category: String,
      action: String,
      detail: Object
    },
    multiplier: Number
  }]
});

AchievementSchema.statics = {
  TARGET_MATCH:          'match',
  TARGET_NOMATCH:        'no-match',
  TARGET_MATCHLESSMUL:   'match-less-than-multiplier',
  TARGET_MATCHMOREMUL:   'match-more-than-multiplier',
  TARGET_MATCHEQLESSMUL: 'match-eq-or-less-than-multiplier',
  TARGET_MATCHEQMOREMUL: 'match-eq-or-more-than-multiplier'
};
AchievementSchema.methods = {
  matchesConditions: function(log) {
    log = log || [];

    var
    self = this.model('Achievement'),
    matches = false;

    this.conditions
      .every(function (condition) {

        var
        trigger    = condition.trigger,
        target     = condition.target,
        multiplier = condition.multiplier,
        stillValid = true,
        pDataMaps  = {},
        tarDetKeys = [];

        if(target.detail) {
          tarDetKeys = Object.keys(target.detail);
        }

        var
        spec, logTargets = log.filter(function (v) {
          var
          isMatch = true,
          detail = v.detail || false;

          if(isMatch && target.cagetory) {
            isMatch = (v.category === target.category);
          }

          if(isMatch && target.action) {
            isMatch = (v.action === target.action);
          }

          if(isMatch && detail && tarDetKeys.length) {
            tarDetKeys.every(function (k) { // check details
              spec = target.detail[k];

              if(pDataMaps[k] === undefined) {
                pDataMaps[k] = [];
              }

              switch(spec) {
                case '$same': // this and previous values must be the same
                isMatch = (
                  (pDataMaps[k].length === 0) ||
                  (detail[k] === pDataMaps[k][pDataMaps.length - 1])
                );
                break;

                case '$different': // this and previous values must be different
                isMatch = (
                  (pDataMaps[k].length === 0) ||
                  (detail[k] !== pDataMaps[k][pDataMaps.length - 1])
                );
                break;

                default: // must match value:
                isMatch = (detail[k] === spec);
                break;
              }

              if(detail[k] !== undefined) {
                pDataMaps[k].push(detail[k]);
              }

              return isMatch;
            });
          }

          return isMatch;
        });

        switch(trigger) {
          case self.TARGET_MATCH:
          stillValid = !!logTargets.length;

          if(stillValid && multiplier) {
            stillValid = (logTargets.length === multiplier);
          }
          break;
          case self.TARGET_NOMATCH:
          stillValid = (logTargets.length === 0);
          break;
          case self.TARGET_MATCHLESSMUL:
          stillValid = (logTargets.length < multiplier);
          break;
          case self.TARGET_MATCHMOREMUL:
          stillValid = (logTargets.length > multiplier);
          break;
          case self.TARGET_MATCHEQLESSMUL:
          stillValid = (logTargets.length <= multiplier);
          break;
          case self.TARGET_MATCHEQMOREMUL:
          stillValid = (logTargets.length >= multiplier);
          break;
        }

        matches = stillValid;

        return stillValid;
      });

    return matches;
  }
};

module.exports = mongoose.model('Achievement', AchievementSchema);