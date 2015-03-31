'use strict';

var Q = require('q');
var jwt = require('jsonwebtoken');
var User = require('./user.model');
var UserJob = require('./job/job.model');
var UserUpload = require('./upload/upload.model');
var UserSchedule = require('./schedule/schedule.model');
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

function qGetPageScore(agenda, userId, fbObjectId) {
  var defer = Q.defer();

  // find a job that matches this criteria:
  UserJob.findUserJobs(agenda, userId, {
    'name': 'facebook-page-score',
    'data.userId': userId,
    'data.facebookObjectId': fbObjectId
  }, function (err, jobs) {
    if(err) return defer.reject(err);
    if(!jobs || !jobs.length) return defer.resolve([]);

    var
    jobDataNorm = jobs
      .map(UserJob.normalizeJob.bind(UserJob))
      .sort(UserJob.jobSorter(false)) // sort newest to oldest
      .shift();

    return defer.resolve(jobDataNorm);
  });

  return defer.promise;
}

function qScorePage (agenda, userId, fbObjectId) {
  var defer = Q.defer();

  UserJob.createJob(agenda, userId, 'facebook-page-score', {
    userId: userId,
    facebookObjectId: fbObjectId
  }, false, function (err, job) {
    if(err) return defer.reject(err);
    return defer.resolve(job);
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

exports.switchFacebookObject = function(req, res, next) {
  var
  switchTo = req.body.switchTo,
  accessToken = req.body.accessToken;

  qUserById(req.user._id, res)
    .then(function (user) {
      var
      currentFbObject = user.facebookObj.id;

      return facebook.basicPageInfo(switchTo, accessToken)
        .then(function (pageInfo) {

          if(!pageInfo) return requestUtils.missing(res);

          // make sure this is in the users associated pages.
          if(user.facebookObj.associations.indexOf(currentFbObject) === -1) {
            user.facebookObj.associations.push(currentFbObject);
          }

          // score the page!!
          user.facebookObj.id = switchTo;

          // check for an existing score:
          return qGetPageScore(res.agenda, user._id, switchTo)
            .then(function (pageScore) {

              if(!pageScore || pageScore.length === 0) {

                // create a job to score their facebook page
                return qScorePage(res.agenda, user._id, user.facebookObj.id)
                  .then(function (job) {
                    console.log('created job for user:', job.attrs);
                    return { scored: false };
                  });
              }
              else {
                return { scored: true };
              }
            });
        })
        .then(function (pageScore) {
          return user.save(function (err) {
            if(err) return next(err);
            requestUtils.data(res, pageScore);
          });
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
        return qScorePage(res.agenda, user._id, user.facebookObj.id)
          .then(function (job) {
            console.log('created job for user:', job.attrs);
            requestUtils.data(res, user.setupStatus);
            return job;
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
      return facebook.userInfo(user.facebook.id, user.facebook.token)
        .then(function (userInfo) {
          requestUtils.data(res, user.profile);
          return user;
        })
        .catch(function (err) {
          requestUtils.missing(res);
          return err;
        });
    })
    .catch(next);
};

exports.currentUserChangePassword = function(req, res, next) {
  var
  oldPass = String(req.body.oldPassword),
  newPass = String(req.body.newPassword);

  qUserById(req.user._id, res, '_id salt hashedPassword')
    .then(function (user) {

      if( ! user.authenticate(oldPass)) {
        res.send(403);
        return;
      }

      user.password = newPass;

      return user.save(function (err) {
        if(err) return next(err);
        requestUtils.ok(res);
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

  qUserById(userId, res)
    .then(function (user) {
      if(!user.facebookObj || !user.facebookObj.id)
        return requestUtils.missing(res);

      // find a job that matches this criteria:
      return qGetPageScore(res.agenda, userId, user.facebookObj.id)
        .then(function (result) {
          requestUtils.data(res, result);
          return result;
        });
    })
    .catch(next);
};

exports.currentUserCloseAccount = function(req, res, next) {

  var
  userId = req.user._id;

  //
  // Prepare thermo-nuclear wipe out of user account
  //

  qUserById(userId, res)
    .then(function (user) {

      Q.allSettled([

        // stage 1: wipe out jobs
        Q.nfcall(UserJob.nukeUserJobs.bind(UserJob), res.agenda, userId),

        // stage 2: wipe out uploads
        Q.nfcall(UserUpload.nukeUserUploads.bind(UserUpload), userId),

        // stage 3: wipe out schedules
        Q.nfcall(UserSchedule.nukeUserSchedules.bind(UserSchedule), res.agenda, userId),

        // TODO: stage 4: wipe out groups (that this user is the exclusive owner for?)
        // Q.nfcall(Group.nukeUserGroups.bind(Group), userId)

        Q.nfcall(user.remove.bind(user))

      ]).then(function (results) {

        var
        errors = results
          .filter(function (r) {
            return r.state !== 'fulfilled';
          })
          .map(function (r) {
            return r.reason;
          });

        if(errors.length) {
          console.error('Errors while removing account:', errors);
        }

        res.send(200);
      });
    })
    .catch(next);
};