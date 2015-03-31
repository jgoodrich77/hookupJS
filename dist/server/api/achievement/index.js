'use strict';

var express = require('express');
var controller = require('./achievement.controller');
var auth = require('../../components/auth');

var router = express.Router();

// admin actions
router.get ('/global.query',   auth.hasRole('admin'), controller.globalQuery);

// user actions
router.get ('/self.query',     auth.isAuthenticated(), controller.selfQuery);

module.exports = router;
