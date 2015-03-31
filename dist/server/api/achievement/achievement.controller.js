/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /groups              ->  index
 * POST    /groups              ->  create
 * GET     /groups/:id          ->  show
 * PUT     /groups/:id          ->  update
 * DELETE  /groups/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Q = require('q');
var Achievement = require('./achievement.model');
var requestUtils = require('../requestUtils');

exports.globalQuery = function(req, res, next) { // get achievement information for all global users
  next();
};

exports.selfQuery = function(req, res, next) { // get achievement information for current user.
  next();
};