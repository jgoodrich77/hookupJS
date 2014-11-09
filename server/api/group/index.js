'use strict';

var express = require('express');
var controller = require('./group.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

// admin only functionality
router.get('/list',        auth.hasRole('admin'), controller.list);
router.get('/get/basic',   auth.hasRole('admin'), controller.getBasic);
router.get('/get/detail',  auth.hasRole('admin'), controller.getDetail);

// logged-in user functionality
router.get('/list-subscribed',        auth.isAuthenticated(), controller.listSubscribed);
router.get('/get-subscribed/basic',   auth.isAuthenticated(), controller.getBasicSubscribed);
router.get('/get-subscribed/detail',  auth.isAuthenticated(), controller.getDetailSubscribed);

module.exports = router;
