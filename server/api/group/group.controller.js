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

var
groupColumnMinimal = [
  '_id',
  'name'
].join(' '),

groupColumnsDetail = [
  '_id',
  'name',
  'primaryDomain',
  'description',
  'active',
  'servicePlan',
  'billingSchedule',
  'billingMethod',
  'services'
].join(' '),

groupColumnsBasic = [
  '_id',
  'name',
  'description',
  'active'
].join(' '),

groupColumnsDetailSubscribed = [
  '_id',
  'name',
  'primaryDomain',
  'description',
  'servicePlan',
  'billingSchedule',
  'billingMethod',
  'services',
  'members'
].join(' '),

groupColumnsBasicSubscribed = [
  '_id',
  'name',
  'description',
  'members'
].join(' ');

function injectSendDocumentSubscription(res, req, detailed) {
  return function (err, doc) {
    if(err) return requestUtils.error(res, err);
    if(!doc) return requestUtils.missing(res);

    requestUtils.data(res, doc.getSubscriptionDetail(req.user._id, detailed));
  };
}

function injectSendCollectionSubscription(res, req, detailed) {
  return function (err, collection) {
    if(err) return requestUtils.error(res, err);
    if(!collection.length) return requestUtils.data(res, []); // save resources

    requestUtils.data(res, collection.map(function (doc) {
      return doc.getSubscriptionDetail(req.user._id, detailed);
    }));
  }
}

function subscribedCriteria(obj, req) {

  obj.active = true;
  obj.members = {
    $elemMatch : {
      user: req.user._id
    }
  };

  return obj;
}

// ADMIN: list all groups in system
exports.list = function(req, res, next) {
  Group.find({}, groupColumnsBasic)
    .sort({ name: 1 })
    .exec(requestUtils.nData(res));
};

// ADMIN: get basic information for a single group
exports.getBasic = function(req, res, next) {
  Group.findById(req.param('id'), groupColumnsBasic)
    .exec(requestUtils.oneRec(res));
};

// ADMIN: get detailed information for a single group
exports.getDetail= function(req, res, next) {
  Group.findById(req.param('id'), groupColumnsDetail)
    .exec(requestUtils.oneRec(res));
};

// USER: get basic information for a single group
exports.getBasicSubscribed = function(req, res, next) {
  Group.findOne(subscribedCriteria({
    _id: req.param('id')
  }, req), groupColumnsBasicSubscribed)
    .exec(injectSendDocumentSubscription(res, req));
};

// USER: get detailed information for a single group
exports.getDetailSubscribed= function(req, res, next) {
  Group.findOne(subscribedCriteria({
    _id: req.param('id')
  }, req), groupColumnsDetailSubscribed)
    .exec(injectSendDocumentSubscription(res, req, true));
};

// list all groups that the current user has access to
exports.listSubscribed = function(req, res, next) {
  Group.find(subscribedCriteria({}, req), groupColumnsBasicSubscribed)
    .sort({ name: 1 })
    .exec(injectSendCollectionSubscription(res, req));
};

// list all services defined in the supplied group
// exports.listServices = function(req, res, next) {
//   Group.findById(req.param('id'), groupColumnMinimal)
//     .populate('services', '_id name')
//     .exec(function (err, group) {
//       if(err) {
//         return next(err);
//       }
//       if(!group) {
//         return requestUtils.missing(res);
//       }

//       return requestUtils.data(res, group.services);
//     });
// };