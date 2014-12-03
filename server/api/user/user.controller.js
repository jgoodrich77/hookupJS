'use strict';

var User = require('./user.model');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var requestUtils = require('../requestUtils');

var facebook = require('../../components/facebook');

// var validationError = function(res, err) {
//   return res.json(422, err);
// };

// /**
//  * Get list of users
//  * restriction: 'admin'
//  */
// exports.index = function(req, res) {
//   User.find({}, '-salt -hashedPassword', function (err, users) {
//     if(err) return res.send(500, err);
//     res.json(200, users);
//   });
// };

// /**
//  * Creates a new user
//  */
// exports.create = function (req, res, next) {
//   var newUser = new User(req.body);
//   newUser.provider = 'local';
//   newUser.role = 'user';
//   newUser.save(function(err, user) {
//     if (err) return validationError(res, err);
//     var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
//     res.json({ token: token });
//   });
// };

// /**
//  * Get a single user
//  */
// exports.show = function (req, res, next) {
//   var userId = req.params.id;

//   User.findById(userId, function (err, user) {
//     if (err) return next(err);
//     if (!user) return res.send(401);
//     res.json(user.profile);
//   });
// };

// /**
//  * Deletes a user
//  * restriction: 'admin'
//  */
// exports.destroy = function(req, res) {
//   User.findByIdAndRemove(req.params.id, function(err, user) {
//     if(err) return res.send(500, err);
//     return res.send(204);
//   });
// };

// /**
//  * Change a users password
//  */
// exports.changePassword = function(req, res, next) {
//   var userId = req.user._id;
//   var oldPass = String(req.body.oldPassword);
//   var newPass = String(req.body.newPassword);

//   User.findById(userId, function (err, user) {
//     if(user.authenticate(oldPass)) {
//       user.password = newPass;
//       user.save(function(err) {
//         if (err) return validationError(res, err);
//         res.send(200);
//       });
//     } else {
//       res.send(403);
//     }
//   });
// };

// /**
//  * Get my info
//  */
// exports.me = function(req, res, next) {
//   var userId = req.user._id;
//   User.findOne({
//     _id: userId
//   }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
//     if (err) return next(err);
//     if (!user) return res.json(401);
//     res.json(user);
//   });
// };

// /**
//  * Authentication callback
//  */
// exports.authCallback = function(req, res, next) {
//   res.redirect('/');
// };

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