'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var
fbScoring = require('../server/components/facebook-score'),
Q = require('q');

function dateAgo(days, now) {
  now = now || new Date();

  var
  ms = (new Date(now)).getTime();

  return new Date(ms - (days * 86400000));
}

function renderPosts(p, rel) {
  var alpha = ['a','b','c','d','e','f','g','h','i','j','k'];

  return p.map(function (v, i) {
    return {
      id: alpha[i],
      totalLikes: Math.ceil(rel * (v[1]|| 0)),
      totalComments: Math.ceil(rel * (v[2]|| 0)),
      totalShares: Math.ceil(rel * (v[3]|| 0)),
      updated_time: v[0]
    };
  });
}

var // simulation variables
totalLikeHigh = 1000000,
totalLikeMed  = 10000,
totalLikeLow  = 100,
totalLikeNoob = 0,

pctHighNewLike = 0.35,
pctMedNewLike  = 0.15,
pctLowNewLike  = 0.01,
pctNoobNewLike = 0.0,

pctHighTalkAbout = 0.85,
pctMedTalkAbout  = 0.35,
pctLowTalkAbout  = 0.01,
pctNoobTalkAbout = 0.0,

pctHighVisited   = 0.75,
pctMedVisited    = 0.25,
pctLowVisited    = 0.01,
pctNoobVisited   = 0.0,

arrHighPosts     = [
  [dateAgo(1),  0.25, 0.15, 0.005],
  [dateAgo(2),  0.35, 0.25, 0.015],
  [dateAgo(3),  0.15, 0.15, 0.005],
  [dateAgo(4),  0.25, 0.55, 0.015],
  [dateAgo(5),  0.45, 0.15, 0.015],
  [dateAgo(6),  0.55, 0.15, 0.085],
  [dateAgo(7),  0.25, 0.05, 0.045],
  [dateAgo(8),  0.15, 0.02, 0.025],
  [dateAgo(9),  0.25, 0.03, 0.015]
],
arrMedPosts      = [
  [dateAgo(1.5),  0.25, 0.09, 0.015],
  [dateAgo(2.5),  0.15, 0.01, 0.005],
  [dateAgo(3.2),  0.12, 0.03, 0.005],
  [dateAgo(4.7),  0.15, 0.05, 0.015],
  [dateAgo(5.2),  0.18, 0.04, 0.035],
  [dateAgo(6.1),  0.35, 0.15, 0.095],
  [dateAgo(7.7),  0.12, 0.03, 0.025],
  [dateAgo(8.4),  0.11, 0.05, 0.01],
  [dateAgo(9.2),  0.10, 0.02, 0.001]
],
arrLowPosts      = [
  [dateAgo(2),   0.1,  0.05, 0.01],
  [dateAgo(3),   0.02, 0.15, 0],
  [dateAgo(6),   0.05, 0.06, 0.02],
  [dateAgo(8),   0.12, 0.07, 0],
  [dateAgo(12),  0.08, 0.02, 0]
],
arrNoobPosts     = [];

// console.log(renderPosts(arrHighPosts, totalLikeHigh));
// console.log(renderPosts(arrMedPosts, totalLikeMed));
// console.log(renderPosts(arrLowPosts, totalLikeLow));
// console.log(renderPosts(arrNoobPosts, totalLikeNoob));

var
scoreHigh = fbScoring.calculateScore({
  likes: {
    likes: totalLikeHigh,
    new_like_count: totalLikeHigh * pctHighNewLike,
    talking_about_count: totalLikeHigh * pctHighTalkAbout,
    were_here_count: totalLikeHigh * pctHighVisited
  },
  posts: renderPosts(arrHighPosts, totalLikeHigh)
}),
scoreMed = fbScoring.calculateScore({
  likes: {
    likes: totalLikeMed,
    new_like_count: totalLikeMed * pctMedNewLike,
    talking_about_count: totalLikeMed * pctMedTalkAbout,
    were_here_count: totalLikeMed * pctMedVisited
  },
  posts: renderPosts(arrMedPosts, totalLikeMed)
}),
scoreLow = fbScoring.calculateScore({
  likes: {
    likes: totalLikeLow,
    new_like_count: totalLikeLow * pctLowNewLike,
    talking_about_count: totalLikeLow * pctLowTalkAbout,
    were_here_count: totalLikeLow * pctLowVisited
  },
  posts: renderPosts(arrLowPosts, totalLikeLow)
}),
scoreNoob = fbScoring.calculateScore({
  likes: {
    likes: totalLikeNoob,
    new_like_count: totalLikeNoob * pctNoobNewLike,
    talking_about_count: totalLikeNoob * pctNoobTalkAbout,
    were_here_count: totalLikeNoob * pctNoobVisited
  },
  posts: renderPosts(arrNoobPosts, totalLikeNoob)
});

var
fs = require('fs');

console.log('-- high --');
console.log(scoreHigh.compute().toFixed(5));

console.log('-- medium --');
console.log(scoreMed.compute().toFixed(5));

console.log('-- low --');
console.log(scoreLow.compute().toFixed(5));

console.log('-- noob --');
console.log(scoreNoob.compute().toFixed(5));

Q.allSettled([ // output explainations to fs (they're big).
  Q.nfcall(fs.writeFile, 'output-high.json', JSON.stringify(scoreHigh.explain(), null, 2), 'utf-8'),
  Q.nfcall(fs.writeFile, 'output-med.json',  JSON.stringify(scoreMed.explain(), null, 2), 'utf-8'),
  Q.nfcall(fs.writeFile, 'output-low.json',  JSON.stringify(scoreLow.explain(), null, 2), 'utf-8'),
  Q.nfcall(fs.writeFile, 'output-noob.json', JSON.stringify(scoreNoob.explain(), null, 2), 'utf-8')
]).then(function() {
  console.log('Updated output files.');
});
