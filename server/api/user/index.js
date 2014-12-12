'use strict';
var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../components/auth');

var router = express.Router();

// facebook public login/signup:
router.put('/facebook/:id', controller.facebookLogin);

// current user information
router.get('/me/facebook-object', auth.isAuthenticated(), controller.currentUserFacebookObject);
router.get('/me/facebook-score',  auth.isAuthenticated(), controller.currentUserFacebookScore);
router.get('/me',                 auth.isAuthenticated(), controller.currentUser);

router.put('/change-fb-object',   auth.isAuthenticated(), controller.changeFacebookObject);
router.put('/setup-fb-object',    auth.isAuthenticated(), controller.setupFacebookObject);
router.put('/setup-password',     auth.isAuthenticated(), controller.setupPassword);
router.put('/setup-finalize',     auth.isAuthenticated(), controller.setupFinalize);

module.exports = router;
