'use strict';

var express = require('express');
var controller = require('./schedule.controller');
var auth = require('../../../components/auth');

var router = express.Router();

// admin only functionality
router.get('/list/all', auth.hasRole('admin'), controller.listAll);

// logged-in user functionality

// public functionality
router.get('/list/active', controller.listActive);

module.exports = router;
