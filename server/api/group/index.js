'use strict';

var express = require('express');
var controller = require('./group.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

// admin only functionality
router.get('/list/all', auth.hasRole('admin'), controller.listAll);

// logged-in user functionality
router.get('/list/subscribed', auth.isAuthenticated(), controller.listSubscribed);
router.get('/list/services/:groupId', auth.isAuthenticated(), controller.listServices);
router.get('/list/service-plans', auth.isAuthenticated(), controller.listServicePlans);
router.get('/list/billing-schedules', auth.isAuthenticated(), controller.listBillingSchedules);
router.get('/list/billing-methods', auth.isAuthenticated(), controller.listBillingMethods);
router.get('/get/basic', auth.isAuthenticated(), controller.getBasic);
router.get('/get/detail', auth.isAuthenticated(), controller.getDetail);

module.exports = router;
