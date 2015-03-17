'use strict';

var
Q            = require('q'),
Vocabulary   = require('./vocabulary.model'),
config       = require('../../config/environment'),
requestUtils = require('../requestUtils'),
facebook     = require('../../components/facebook');

exports.latestVocab = function(req, res, next) {
  var
  agenda = res.agenda,
  userId = req.user._id,
  objectId = req.params.id,
  jobName = 'facebook-object-vocabulary';

  Vocabulary
    .find({
      facebookObjectId: objectId
    })
    .sort({created: -1})
    .limit(1)
    .exec(function (err, docs) {
      if (err) return next(err);

      if(!docs || docs.length === 0) {
        agenda.jobs({
          'name': jobName,
          'data.facebookObjectId': objectId
        }, function (err, jobs) {
          if(err) return next(err);

          if(jobs.length === 0) {
            var
            job = agenda.create(jobName, {
              userId: userId,
              facebookObjectId: objectId
            });

            job.run(function (err, job) {
              if(err) next(err);
            });
          }

          res.json({ loading: true });
        });

        return;
      }

      var doc = docs[0];

      res.json({
        created: doc.created,
        words: doc.words.map(function (word) {
          return {
            root:       word.root,
            variations: word.variations,
            likes:      word.likes,
            comments:   word.comments,
            shares:     word.shares
          };
        })
      });
    });
};