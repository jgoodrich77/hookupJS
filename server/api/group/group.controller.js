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
var Group = require('./group.model');
var requestUtils = require('../requestUtils');

// get basic information for a single group
exports.getBasic = function(req, res, next) {
  Group.findById(req.param('id'), '_id name description')
    .exec(requestUtils.nData(res));
};

// get detailed information for a single group
exports.getDetail= function(req, res, next) {
  Group.findById(req.param('id'), '_id name description')
    .exec(requestUtils.nData(res));
};

// list all groups in system
exports.listAll = function(req, res, next) {
  Group.find({}, '_id name description')
    .sort({ name: 1 })
    .exec(requestUtils.nData(res));
};

// list all groups that the current user has access to
exports.listSubscribed = function(req, res, next) {
  Group.find({ 'members.user': req.user._id }, '_id name description')
    .sort({ name: 1 })
    .exec(requestUtils.nData(res));
};

// list all services defined in the supplied group
exports.listServices = function(req, res, next) {
  Group.findById(req.param('id'))
    .populate('services', '_id name')
    .exec(function (err, group) {
      if(err) {
        return next(err);
      }
      if(!group) {
        return requestUtils.missing(res);
      }

      return requestUtils.data(res, group.services);
    });
};
