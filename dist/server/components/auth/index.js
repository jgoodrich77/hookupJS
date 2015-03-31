'use strict';

var
express = require('express'),
expressJwt = require('express-jwt'),
jwt = require('jsonwebtoken'),
compose = require('composable-middleware'),
config = require('../../config/environment');

var
User = require('../../api/user/user.model');

var
cookieToken = 'token',
queryToken = 'access_token',
validateJwt = expressJwt({
  secret: config.secrets.session
});

module.exports = {
  isAuthenticated: function () {
    return compose()
      // Validate jwt
      .use(function (req, res, next) {

        if(!req.headers.authorization) {

          var
          token = !!req.cookies && req.cookies.hasOwnProperty(cookieToken)
            ? JSON.parse(req.cookies[cookieToken])
            : false;

          // allow access_token to be passed through query parameter as well
          if(!token && (!!req.query && req.query.hasOwnProperty(queryToken))) {
            token = req.query[queryToken];
          }

          if(!token) { // no authorization token found
            return next(new Error('User is not authorized'));
          }

          req.headers.authorization = 'Bearer ' + token;
        }

        validateJwt(req, res, next);
      })
      // Attach user to request
      .use(function (req, res, next) {
        User.findOne({_id: req.user._id}, function (err, user) {
          if (err) return next(err);
          if (!user) return res.send(401);

          req.user = user;
          next();
        });
      });
  },
  hasRole: function (roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');

  return compose()
    .use(this.isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
        next();
      }
      else {
        res.send(403);
      }
    });
  }
};