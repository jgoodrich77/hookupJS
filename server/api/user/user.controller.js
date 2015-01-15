'use strict';

var Q = require('q');
var jwt = require('jsonwebtoken');
var User = require('./user.model');
var UserJob = require('./job/job.model');
var config = require('../../config/environment');
var requestUtils = require('../requestUtils');
var facebook = require('../../components/facebook');

function createToken(user) {
  return jwt.sign({
      _id: user._id
    }, config.secrets.session, {
      expiresInMinutes: config.sessionDuration
    });
}

function qUserById(id, res, cols) {
  var defer = Q.defer();

  User.findById(id, cols || '-salt -hashedPassword', function (err, user) {
    if (err) return defer.reject(err);
    if (!user) return requestUtils.missing(res);
    defer.resolve(user);
  });

  return defer.promise;
}

//
// On-boarding process:
//

// initial FB user interaction
exports.facebookLogin = function(req, res, next) {
  var
  userId    = req.params.id,
  userToken = req.body.token;

  facebook.userInfo(userId, userToken)
    .then(function (fbResult) {

      if(fbResult.id !== userId) {
        return requestUtils.error(res, new Error('User ID does not match facebook access token.'));
      }

      // extend user token for long lived token:
      facebook.extendToken(userToken)
        .then(function (resp) {
          var
          longLivedToken = resp.access_token,
          expires = new Date(Date.now() + (resp.expires * 1000));

          return User.findByFacebookId(userId, '-salt -hashedPassword', function (err, user) {
            if (err) return next(err);

            if (!user) {
              user = User.createFromFacebook(userId, longLivedToken, fbResult);
            }
            else {
              user.updateFromFacebook(longLivedToken, fbResult);
            }

            user.facebook.expires = expires;

            return user.save(function (err) {
              if(err) return next(err);

              requestUtils.data(res, {
                step: user.setupStep,
                session: createToken(user)
              });
            });
          });
        });
    })
    .catch(next)
};

// step 1
exports.setupFacebookObject = function(req, res, next) {
  var
  nObjectId    = req.body.objectId,
  nAccessToken = req.body.accessToken;

  qUserById(req.user._id, res)
    .then(function (user) {
      if(user.setupStep !== 1) return requestUtils.missing(res);
      return facebook.basicPageInfo(nObjectId, nAccessToken)
        .then(function (pageInfo) {
          if(!pageInfo) return;

          user.facebookObj.id = nObjectId;
          user.setupStep      = 2;

          return user.save(function (err) {
            if(err) return next(err);

            requestUtils.data(res, user.setupStatus);
          });
        });
    })
    .catch(next);
};

exports.changeFacebookObject = function(req, res, next) {

  qUserById(req.user._id, res)
    .then(function (user) {
      if(user.setupStep !== 2) return requestUtils.missing(res);

      user.facebookObj.id = null;
      user.setupStep      = 1;

      return user.save(function (err) {
        if(err) return next(err);

        requestUtils.data(res, user.setupStatus);
      });
    })
    .catch(next);
};

// step 2
exports.setupPassword = function(req, res, next) {
  var
  nPassword = req.body.password;

  qUserById(req.user._id, res)
    .then(function (user) {
      if(user.setupStep !== 2) return requestUtils.missing(res);
      if(!user.facebookObj || !user.facebookObj.id)
        return requestUtils.missing(res);

      user.password = nPassword;
      user.setupStep = 3; // wait for job to finish

      // at this point the user should have full-capabilities as a user:
      return user.save(function (err) {
        if(err) return next(err);

        // create a job to score their facebook page
        UserJob.createJob(res.agenda, req.user._id, 'facebook-page-score', {
          userId:           user._id,
          facebookObjectId: user.facebookObj.id
        }, false, function (err, job) {
          if(err) return next(err);

          console.log('created job for user:', job.attrs);

          requestUtils.data(res, user.setupStatus);
        });
      });
    })
    .catch(next);
};

exports.setupFinalize = function(req, res, next) {
  qUserById(req.user._id, res)
    .then(function (user) {
      if(user.setupStep !== 3) return requestUtils.missing(res);
      user.setupStep = -1; // wait for job to finish
      return user.save(function (err) {
        if(err) return next(err);
        requestUtils.data(res, user.setupStatus);
      });
    })
    .catch(next);
};

exports.currentUser = function(req, res, next) {
  qUserById(req.user._id, res)
    .then(function (user) { // validate the user facebook token:
      return facebook.tokenInfo(user.facebook.token, user.facebook.token)
        .then(function (result) {
          if(!result.data || !result.data.is_valid) return requestUtils.missing(res); // force re-authentication
          requestUtils.data(res, user.profile);
        })
        .catch(function (err) {
          return requestUtils.missing(res);
        });
    })
    .catch(next);
};

exports.currentUserFacebookObject = function(req, res, next) {
  qUserById(req.user._id, res)
    .then(function (user) {
      if(!user.facebookObj || !user.facebookObj.id)
        return requestUtils.missing(res);

      return facebook.basicPageInfo(user.facebookObj.id, user.facebook.token)
        .then(function (pageInfo) {
          if(!pageInfo) return requestUtils.missing(res);
          requestUtils.data(res, pageInfo);
        });
    })
    .catch(next);
};

exports.currentUserFacebookScore = function(req, res, next) {
  var
  userId = req.user._id;

  qUserById(req.user._id, res)
    .then(function (user) {
      if(!user.facebookObj || !user.facebookObj.id)
        return requestUtils.missing(res);

      // find a job that matches this criteria:
      UserJob.findUserJobs(res.agenda, userId, {
        'name': 'facebook-page-score',
        'data.userId': userId,
        'data.facebookObjectId': user.facebookObj.id
      }, function (err, jobs) {
        if(err) return next(err);
        if(!jobs || !jobs.length) {
          return requestUtils.data(res, []);
        }

        var
        jobDataNorm = jobs.map(UserJob.normalizeJob.bind(UserJob))
          .sort(UserJob.jobSorter(false)); // sort newest to oldest

        requestUtils.data(res, jobDataNorm[0]);
      });
    })
    .catch(next);
};