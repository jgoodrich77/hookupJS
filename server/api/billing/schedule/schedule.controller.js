'use strict';

var _ = require('lodash');
var BillingSchedule = require('./schedule.model');
var requestUtils = require('../../requestUtils');

exports.listAll = function(req, res, next) {
  BillingSchedule.find({}, '_id name groupDefault description discount interval active')
    .sort({ order: 1, name: 1 })
    .exec(requestUtils.nData(res));
};

exports.listActive = function(req, res, next) {
  BillingSchedule.find({active: true}, '_id name groupDefault description discount interval')
    .sort({ order: 1, name: 1 })
    .exec(requestUtils.nData(res));
};