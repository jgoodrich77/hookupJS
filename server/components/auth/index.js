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
validateJwt = expressJwt({
  secret: config.secrets.session
});

module.exports = {
  isAuthenticated: function () {
    return compose()
      // Validate jwt
      .use(function (req, res, next) {
        // allow access_token to be passed through query parameter as well
        if(req.query && req.query.hasOwnProperty('access_token')) {
          req.headers.authorization = 'Bearer ' + req.query.access_token;
        }
        validateJwt(req, res, next);
      })
      // Attach user to request
      .use(function (req, res, next) {
        User.findOne({_id: req.user._id, activated: true}, function (err, user) {
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