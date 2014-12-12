'use strict';

var
util = require('util'),
FbConsts = require('./consts'),
Score = require('../../score'),
Weight = Score.Weight;

function ScoreFacebookPosts(scoreLikes, posts) {
  posts = posts || [];

  var
  fbTotal = FbConsts.TOTAL_FB_USERS,
  totalLikes = scoreLikes.totalLikes;

  function importanceByPostType(p) {
    var
    postId = p.id;

    switch(p.type) {
      default: return 1;
    }
  }

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

  function scorePost(p) {

    var
    // importances
    iLike        = 0.75,
    iComment     = 0.85,
    iShare       = 0.99,
    // seeded by caller
    postLikes    = p.totalLikes,
    postComments = p.totalComments,
    postShares   = p.totalShares,

    // facebook core:
    postId       = p.id,
    postLUpdate  = p.updated_time;

    var
    // importances
    iSomething = 1,

    // values
    vSomething = parseInt(p.something || 0);

    return new Score([
      new Weight(postLikes,    0, totalLikes, iLike),
      new Weight(postComments, 0, fbTotal,    iComment),
      new Weight(postShares,   0, fbTotal,    iShare)
    ]).compute();
  }

  function scorePostTimeBetween(newest, oldest, total) {
    var
    avg   = Math.ceil(Math.abs(newest - oldest) / total),
    ppDay = (86400000 / avg);

    if(ppDay < 0.01) {
      return 0.01;
    }
    else if(ppDay < 0.05) {
      return 0.15;
    }
    else if(ppDay < 0.1) {
      return 0.25;
    }
    else if(ppDay < 0.15) {
      return 0.35;
    }
    else if(ppDay < 0.25) {
      return 0.45;
    }
    else if(ppDay < 0.35) {
      return 0.55;
    }
    else if(ppDay < 0.45) {
      return 0.6;
    }
    else if(ppDay < 0.55) {
      return 0.7;
    }
    else if(ppDay < 0.65) {
      return 0.8;
    }
    else if(ppDay < 0.85) {
      return 0.9;
    }
    else if(ppDay < 1) {
      return 0.95;
    }

    return 1;
  }

  function scorePostTimeSinceLast(newest, now) { // very weak method of scoring, but temporary.
    var
    tslp = now - newest,
    mspd = 86400000;

    if(tslp < 0) return 0; // future???

    if(tslp < (mspd * 0.5)) { // 12 hours ago
      return 0.95;
    }
    else if(tslp < mspd) { // 1 day ago
      return 0.75;
    }
    else if(tslp < (mspd * 2)) { // 2 days ago
      return 0.65;
    }
    else if(tslp < (mspd * 3)) { // 3 days ago
      return 0.55;
    }
    else if(tslp < (mspd * 4)) { // 4 days ago
      return 0.35;
    }
    else if(tslp < (mspd * 5)) { // 5 days ago
      return 0.15;
    }
    else if(tslp < (mspd * 6)) { // 6 days ago
      return 0.2;
    }
    else if(tslp < (mspd * 7)) { // 7 days ago
      return 0.1;
    }

    return 0.01;
  }

  function scorePostConsistency(dates, now) {
    var consistency = computeConsistency(dates, now);

    if(consistency < 0.01) {
      return 0.01;
    }
    else if(consistency < 0.05) {
      return 0.15;
    }
    else if(consistency < 0.1) {
      return 0.25;
    }
    else if(consistency < 0.15) {
      return 0.35;
    }
    else if(consistency < 0.25) {
      return 0.45;
    }
    else if(consistency < 0.35) {
      return 0.55;
    }
    else if(consistency < 0.45) {
      return 0.6;
    }
    else if(consistency < 0.55) {
      return 0.7;
    }
    else if(consistency < 0.65) {
      return 0.8;
    }
    else if(consistency < 0.85) {
      return 0.9;
    }
    else if(consistency < 1) {
      return 0.95;
    }

    return 1;
  }

  function scorePostFrequency(posts, now) {

    var
    iTimeBetween     = 1,
    iTimeSinceLast   = 1,
    iPostConsistency = 1,
    dates = posts
      .map(function (post) {
        return Date.parse(post.updated_time);
      })
      .sort(function (a, b) { // newest to oldest
        return b - a;
      }),
    newest = dates[0] || 0,
    oldest = dates[dates.length - 1] || newest;

    var
    scoreTBT = scorePostTimeBetween(newest, oldest, dates.length),
    scoreTSL = scorePostTimeSinceLast(newest, now),
    scoreCST = scorePostConsistency(dates, now);

    return new Score([
      new Weight(scoreTBT, 0, 1, iTimeBetween),
      new Weight(scoreTSL, 0, 1, iTimeSinceLast),
      new Weight(scoreCST, 0, 1, iPostConsistency)
    ]).compute();
  }

  var
  weights = posts
    .map(function (p) {
      return new Weight(scorePost(p), 0, 1, importanceByPostType(p));
    })
    .concat([
      new Weight(scorePostFrequency(posts, Date.now()), 0, 1, 0.9)
    ]);

  Weight.apply(this, [new Score(weights).compute(), 0, 1, 1]);
}

util.inherits(ScoreFacebookPosts, Weight);

module.exports = ScoreFacebookPosts;