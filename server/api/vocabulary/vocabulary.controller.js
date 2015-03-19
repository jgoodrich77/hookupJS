'use strict';

var
Q            = require('q'),
Vocabulary   = require('./vocabulary.model'),
config       = require('../../config/environment'),
requestUtils = require('../requestUtils'),
facebook     = require('../../components/facebook');

var
vocabularyJob = 'facebook-object-vocabulary',
minReRun      = 86400000;

function runVocabularyJob(agenda, facebookObjectId, userId) {
  var
  defer = Q.defer(),
  job = agenda.create(vocabularyJob, {
    userId: userId,
    facebookObjectId: facebookObjectId
  });

  job.run(function (err, job) {
    if(err) return defer.reject(err);

    job.remove(function (err) {
      if(err) return defer.reject(err);

      defer.resolve(job);
    });
  });

  return defer.promise;
}

function vocabularyJobRunning(agenda, facebookObjectId) {
  var
  defer = Q.defer();

  agenda.jobs({
    'name': vocabularyJob,
    'data.facebookObjectId': facebookObjectId
  }, function (err, jobs) {
    if(err) return defer.reject(err);
    if(jobs.length === 0) return defer.resolve(false);

    var
    hasUnfinished = !jobs.every(function (job) {
      return job.lastFinishedAt !== undefined;
    });

    defer.resolve(hasUnfinished);
  });

  return defer.promise;
}

function latestVocabDoc(facebookObjectId) {
  var
  defer = Q.defer();

  Vocabulary
    .find({facebookObjectId: facebookObjectId})
    .sort({created: -1}).limit(1)
    .exec(function (err, docs) {
      if (err) return defer.reject(err);
      if (!docs || !docs.length) return defer.resolve(false);

      defer.resolve(docs[0]);
    });

  return defer.promise;
}

exports.isRunning = function(req, res, next) {
  return vocabularyJobRunning(res.agenda, req.params.id)
    .then(function (isRunning) {
      res.json({isRunning: isRunning});
    })
    .catch(next);
};

exports.reRunVocab = function(req, res, next) {

  var
  agenda   = res.agenda,
  userId   = req.user._id,
  objectId = req.params.id,
  cutOff   = new Date((new Date).getTime() - minReRun);

  return latestVocabDoc(objectId)
    .then(function (doc) {
      if(!doc) {
        return vocabularyJobRunning(agenda, objectId)
          .then(function (isRunning) {
            if(!isRunning) {
              runVocabularyJob(agenda, objectId, userId);
            }
            return true;
          });
      }

      if(doc.created >= cutOff) {
        res.json({
          error: 'Too soon to run a vocabulary analysis.',
          msRemaining: (doc.created.getTime() - cutOff.getTime())
        });
        return false;
      }

      runVocabularyJob(agenda, objectId, userId);
      return true;
    })
    .then(function (running) {
      if(running) {
        res.json({ loading: true });
      }
    })
    .catch(next);
};

exports.latestVocab = function(req, res, next) {
  var
  agenda   = res.agenda,
  userId   = req.user._id,
  objectId = req.params.id;

  return latestVocabDoc(objectId)
    .then(function (doc) {

      if(!doc) {
        return vocabularyJobRunning(agenda, objectId)
          .then(function (isRunning) {
            if(!isRunning) {
              runVocabularyJob(agenda, objectId, userId)
                .catch(next);
            }

            res.json({ loading: true });
          });
      }

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

      return false;
    })
    .catch(next);
};