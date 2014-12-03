'use strict';

var User = require('./user.model');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var requestUtils = require('../requestUtils');

var facebook = require('../../components/facebook');

exports.setupFinalize = function(req, res, next) {
  User.findById(req.params.id, '-salt', function (err, user) {
    if (err) return next(err);
    if (!user || user.setupStep !== 4) return requestUtils.missing(res);

      user.setupStep = -1;

      return user.save(function (err) {
        if(err) return next(err);
        requestUtils.ok(res);
      });
  });
};

exports.setupToS = function(req, res, next) {
  User.findById(req.params.id, '-salt', function (err, user) {
    if (err) return next(err);
    if (!user || user.setupStep !== 3) return requestUtils.missing(res);

      user.agreeToS  = Date.now();
      user.setupStep = 4;

      return user.save(function (err) {
        if(err) return next(err);

        requestUtils.data(res, user.setupStatus);
      });
  });
};

exports.setupFacebookObject = function(req, res, next) {
  var
  nObjectId    = req.body.objectId,
  nAccessToken = req.body.accessToken;

  User.findById(req.params.id, '-salt', function (err, user) {
    if (err) return next(err);
    if (!user || user.setupStep !== 2) return requestUtils.missing(res);

    facebook.pageInfo(nObjectId, nAccessToken)
      .then(function (result) {

        user.facebookObj.id    = nObjectId;
        user.facebookObj.token = nAccessToken;
        user.setupStep = 3;

        return user.save(function (err) {
          if(err) return next(err);

          requestUtils.data(res, user.setupStatus);
        });
      })
      .catch(next);
  });
};

exports.setupPassword = function(req, res, next) {
  var nPassword = req.body.password;
  User.findById(req.params.id, '-salt', function (err, user) {
    if (err) return next(err);
    if (!user || !!user.hashedPassword) return requestUtils.missing(res);

    user.password = nPassword;
    user.setupStep = 2;

    return user.save(function (err) {
      if(err) return next(err);

      requestUtils.data(res, user.setupStatus);
    });
  });
};

exports.facebookLogin = function(req, res, next) {
  var
  userId    = req.params.id,
  userToken = req.body.token;

  facebook.userInfo(userToken)
    .then(function (fbResult) {

      if(fbResult.id !== userId) {
        return requestUtils.error(res, new Error('User ID does not match facebook access token.'));
      }

      User.findByFacebookId(userId, '-salt', function (err, user) {
        if (err) return next(err);
        if (!user) {
          user = User.createFromFacebook(userId, userToken, fbResult);
        }
        else {
          user.updateFromFacebook(userToken, fbResult);
        }

        return user.save(function (err) {
          if(err) return next(err);

          ////// if the setup is complete, send an authorized token? ///////
          // if (err) return validationError(res, err);
          // var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
          // res.json({ token: token });

          requestUtils.data(res, user.setupStatus);
        });
      });
    })
    .catch(next)
};