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

function userCheck(req) {
  if(!req.user) {
    throw new Error('Unable to determine user role, user is not logged in!!');
  }
}

function filterDocument(req, detail) {
  userCheck(req);

  return function (err, doc) {
    if(err) throw err;
    if(!doc) return false;

    if(!!doc.members) { //
      var role = doc.findUserRole(req.user._id);

      // see if user has clearance for detail:
      if(!doc.roleAllowsDetail(role, detail)) {
        throw new Error('User attempted to access restricted group detail.');
      }
    }
    else {
      throw new Error('Unable to compare document with current user, members property not loaded in query!');
    }

    var filtered = doc.getDetail(detail);
    filtered.role = role; // always include role (read-only)

    return filtered;
  };
}

function filterCollection(req, detail) {
  var filterFn = filterDocument(req, detail);
  return function (err, collection) {
    if(err) throw err;
    if(!collection.length) return false;

    var
    fcollection = collection.map(function (doc) {
      return filterFn(null, doc);
    });

    return fcollection;
  };
}

function filterSendDocument(res, req, detail) {
  var filterFn = filterDocument(req, detail);
  return function (err, doc) {
    try {
      var fdoc = filterFn(err, doc);
      if(!fdoc) return requestUtils.missing(res);
      return requestUtils.data(res, fdoc);
    }
    catch(E) {
      console.log('Error loading document:', E);
      requestUtils.error(res, E);
    }
  };
}

function filterSendCollection(res, req, detail) {
  var filterFn = filterCollection(req, detail);
  return function (err, collection) {
    try {
      var fcollection = filterFn(err, collection);
      if(!fcollection) return requestUtils.data(res, []);
      return requestUtils.data(res, fcollection);
    }
    catch(E) {
      console.log('Error loading collection:', E);
      requestUtils.error(res, E);
    }
  };
}

function subscribedCriteria(obj, req) {
  userCheck(req);

  obj.active = true;
  obj.members = {
    $elemMatch : {
      user: req.user._id
    }
  };

  return obj;
}

// admin functionality
exports.globalQuery = function(req, res, next) {
  next();
};
exports.globalGet = function(req, res, next) {
  next();
};
exports.globalUpdate = function(req, res, next) {
  next();
};
exports.globalGetBilling = function(req, res, next) {
  next();
};
exports.globalGetServices = function(req, res, next) {
  next();
};
exports.globalGetMembers = function(req, res, next) {
  next();
};
exports.globalUpdatePlan = function(req, res, next) {
  next();
};
exports.globalUpdateBilling = function(req, res, next) {
  next();
};
exports.globalUpdateServices = function(req, res, next) {
  next();
};
exports.globalUpdateMembers = function(req, res, next) {
  next();
};

// user functionality
exports.subscribedQuery = function(req, res, next) {
  Group.find(subscribedCriteria({}, req))
    .sort({ name: 1 })
    .exec(filterSendCollection(res, req, 'basic'));
};
exports.subscribedGet = function(req, res, next) {
  Group.findOne(subscribedCriteria({ _id: req.params.id }, req))
    .exec(filterSendDocument(res, req, 'basic'));
};
exports.subscribedGetBilling = function(req, res, next) {
  Group.findOne(subscribedCriteria({ _id: req.params.id }, req))
    .exec(filterSendDocument(res, req, 'billing'));
};
exports.subscribedGetServices = function(req, res, next) {
  Group.findOne(subscribedCriteria({ _id: req.params.id }, req))
    .exec(filterSendDocument(res, req, 'services'));
};
exports.subscribedGetMembers = function(req, res, next) {
  Group.findOne(subscribedCriteria({ _id: req.params.id }, req))
    .exec(filterSendDocument(res, req, 'members'));
};
exports.subscribedUpdate = function(req, res, next) {
  next();
};
exports.subscribedUpdatePlan = function(req, res, next) {
  next();
};
exports.subscribedUpdateBilling = function(req, res, next) {
  next();
};
exports.subscribedUpdateServices = function(req, res, next) {
  next();
};
exports.subscribedUpdateMembers = function(req, res, next) {
  next();
};
exports.create = function(req, res, next) {
  next();
};