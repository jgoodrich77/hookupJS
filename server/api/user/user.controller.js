'use strict';

var User = require('./user.model');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var requestUtils = require('../requestUtils');

var Q = require('q');

var facebook = require('../../components/facebook');

function qUserById(id, res, cols) {
  var defer = Q.defer();

  User.findById(id, cols || '-salt -hashedPassword', function (err, user) {
    if (err) return defer.reject(err);
    if (!user) return requestUtils.missing(res);
    defer.resolve(user);
  });

  return defer.promise;
}

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

      User.findByFacebookId(userId, '-salt -hashedPassword', function (err, user) {
        if (err) return next(err);
        if (!user) {
          user = User.createFromFacebook(userId, userToken, fbResult);
        }
        else {
          user.updateFromFacebook(userToken, fbResult);
        }

        return user.save(function (err) {
          if(err) return next(err);

          var token = jwt.sign({
            _id: user._id
          }, config.secrets.session, {
            expiresInMinutes: config.sessionDuration
          });

          requestUtils.data(res, {
            step: user.setupStep,
            session: token
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

          user.facebookObj.id    = nObjectId;
          user.facebookObj.token = nAccessToken;
          user.setupStep = 2;

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

      user.facebookObj.id    = null;
      user.facebookObj.token = null;
      user.setupStep = 1;

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

      user.password = nPassword;
      user.setupStep = 3;

      return user.save(function (err) {
        if(err) return next(err);

        requestUtils.data(res, user.setupStatus);
      });
    })
    .catch(next);
};

// step 3
exports.setupFinalize = function(req, res, next) {
  qUserById(req.user._id, res)
    .then(function (user) {
      if(user.setupStep !== 3) return requestUtils.missing(res);

      user.setupStep = -1;

      return user.save(function (err) {
        if(err) return next(err);
        requestUtils.data(res, user.setupStatus);
      });
    })
    .catch(next);
};

exports.currentUser = function(req, res, next) {
  qUserById(req.user._id, res)
    .then(function (user) {
      requestUtils.data(res, user.profile);
    })
    .catch(next);
};

exports.currentUserFacebookObject = function(req, res, next) {
  qUserById(req.user._id, res)
    .then(function (user) {
      if(!user.facebookObj || !user.facebookObj.token)
        return requestUtils.missing(res);

      return facebook.basicPageInfo(user.facebookObj.id, user.facebookObj.token)
        .then(function (pageInfo) {
          if(!pageInfo) return requestUtils.missing(res);

          requestUtils.data(res, pageInfo);
        });
    })
    .catch(next);
};