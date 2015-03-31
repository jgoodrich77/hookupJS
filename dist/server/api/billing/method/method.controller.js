'use strict';

var _ = require('lodash');
var BillingMethod = require('./method.model');
var requestUtils = require('../../requestUtils');

exports.listAll = function(req, res, next) {
  BillingMethod.find({}, '_id name groupDefault adapter.factoryClass adapter.options.types active')
    .sort({ order: 1, name: 1 })
    .exec(requestUtils.nData(res));
};

exports.listActive = function(req, res, next) {
  BillingMethod.find({active: true}, '_id name groupDefault adapter.factoryClass adapter.options.types')
    .sort({ order: 1, name: 1 })
    .exec(requestUtils.nData(res));
};