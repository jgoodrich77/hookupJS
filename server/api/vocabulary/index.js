'use strict';
var express = require('express');
var controller = require('./vocabulary.controller');
var config = require('../../config/environment');
var auth = require('../../components/auth');

var router = express.Router();

// facebook public login/signup:
// current user information
router.get('/latest/:id', auth.isAuthenticated(), controller.latestVocab);
router.get('/re-run/:id', auth.isAuthenticated(), controller.reRunVocab);
router.get('/is-running/:id', auth.isAuthenticated(), controller.isRunning);

module.exports = router;
