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
  var user = req.user._id;
  Group.find({ members: {
    $elemMatch : {
      user: user
    }
  } }, '_id name description members')
    .sort({ name: 1 })
    .exec(function (err, rows) {
      if(err) return next(err);

      requestUtils.data(res, rows.map(function (row) {
        return row.getSubscriptionDetail(user);
      }).filter(function (v) {
        return v !== false;
      }))
    });
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

exports.listServicePlans = function(req, res, next) {

  // TODO: should be stored / configurable in mongo.
  requestUtils.data(res, [{
      id: 'bronze',
      name: 'Bronze Plan',
      description: 'Description goes here',
      baseCost: 0
    },{
      id: 'silver',
      name: 'Silver Plan',
      description: 'Description goes here',
      baseCost: 250
    },{
      id: 'gold',
      name: 'Gold Plan',
      description: 'Description goes here',
      baseCost: 1000
    }]);
};
exports.listBillingSchedules = function(req, res, next) {

  // TODO: should be stored / configurable in mongo.
  requestUtils.data(res, [{
      id: 'monthly',
      name: 'Monthly',
      description: 'Description goes here',
      discount: 0
    },{
      id: 'quarterly',
      name: 'Quarterly',
      description: 'Description goes here',
      discount: 5
    },{
      id: 'annually',
      name: 'Annually',
      description: 'Description goes here',
      discount: 15
    }]);
};
exports.listBillingMethods = function(req, res, next) {

  // TODO: should be stored / configurable in mongo.
  requestUtils.data(res, [{
      id: 'creditcard',
      name: 'Credit card',
      options: {
        types: [
          ['mastercard', 'Mastercard'],
          ['visa', 'Visa'],
          ['amex', 'American Express']
        ]
      }
    },{
      id: 'paypal',
      name: 'Paypal',
      options: {}
    }]);
};