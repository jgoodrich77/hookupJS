'use strict';

var
Score = require('../score'),
facebook = require('../facebook');

var // required models:
ScoreLikes = require('./lib/score-likes'),
ScorePosts = require('./lib/score-posts'),
ScorePostFreq = require('./lib/score-post-freq');

module.exports = {

  //
  // analyze score data
  //
  calculateScore: function(data) {
    // console.log(JSON.stringify(data, 0, 2));

    var scoreLikes = new ScoreLikes(data.likes);

    return new Score([ // produce a final score
      scoreLikes,
      new ScorePosts(scoreLikes, data.posts),
      new ScorePostFreq(data.posts)
    ]);
  }
};