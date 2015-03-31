'use strict';

var
util = require('util'),
FbConsts = require('./consts'),
Score = require('../../score'),
Scale = require('../../scale'),
Weight = Score.Weight;

function ScoreFacebookPostFrequency(posts, now) {

  var
  LABEL = 'Post Frequency',
  PRECISION = 10;

  function computeConsistency(sortedInts, now) {
    sortedInts = sortedInts || [];

    var ldistance, buffer = [];

    sortedInts
      .reduce(function (p, c, i) {
        var cdistance = Math.abs(p - c);
        if(!!ldistance) {
          buffer.push(Math.min(cdistance, ldistance) / Math.max(ldistance, cdistance));
        }
        ldistance = cdistance;
        return c;
      }, now);

    return buffer.reduce(function (p, c) {
      return p + c;
    }, 0) / buffer.length;
  }

  function computePostsPerDay(newest, oldest, total) {
    if(!total || total < 2) return 0;

    var
    avg   = Math.ceil(Math.abs(newest - oldest) / total),
    ppDay = (86400000 / avg),
    scale = new Scale(0, 3, 0, 1, 'cubicOut', PRECISION);

    return scale.calculate(ppDay);
  }

  function computePostTimeSinceLast(newest, now) { // very weak method of scoring, but temporary.
    var
    tslp = now - newest,
    mspd  = 86400000,
    msmin = mspd * 0.25, // 6 hours ago
    msmax = mspd * 30,  // 30 days ago
    scale = new Scale(msmin, msmax, 1, 0, 'expoOut', PRECISION);

    return scale.calculate(tslp);
  }

  function computePostConsistency(allDates, now) {
    var
    consistency = computeConsistency(allDates, now),
    scale = new Scale(0, 1, 0, 1, 'sineOut', PRECISION);

    return scale.calculate(consistency);
  }

  if(!posts || !posts.length) {
    Score.call(this, false, LABEL);
    return;
  }

  var
  iTimeBetween     = 0.8,
  iTimeSinceLast   = 1,
  iPostConsistency = 0.8,
  dates = posts
    .map(function (post) {
      return Date.parse(post.updated_time);
    })
    .sort(function (a, b) { // newest to oldest
      return b - a;
    }),
  dateLatest = dates[0] || 0,
  dateOldest = dates[dates.length - 1] || dateLatest;

  var
  scorePPD = computePostsPerDay(dateLatest, dateOldest, dates.length),
  scoreTSL = computePostTimeSinceLast(dateLatest, now),
  scoreCST = computePostConsistency(dates, now);

  Score.call(this, [
    new Weight(scorePPD, 0, 1, iTimeBetween, 'post-per-day'),
    new Weight(scoreTSL, 0, 1, iTimeSinceLast, 'post-last'),
    new Weight(scoreCST, 0, 1, iPostConsistency, 'post-consistency')
  ], LABEL);
}

util.inherits(ScoreFacebookPostFrequency, Score);

module.exports = ScoreFacebookPostFrequency;