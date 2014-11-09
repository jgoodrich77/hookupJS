'use strict';

var _ = require('lodash');
var Plan = require('./plan.model');
var requestUtils = require('../requestUtils');

exports.listAll = function(req, res, next) {
  Plan.find({}, '_id name description groupDefault monthlyCost active')
    .sort({ order: 1, name: 1 })
    .exec(requestUtils.nData(res));
};

exports.listActive = function(req, res, next) {
  Plan.find({active: true}, '_id name description groupDefault monthlyCost')
    .sort({ order: 1, name: 1 })
    .exec(requestUtils.nData(res));
};