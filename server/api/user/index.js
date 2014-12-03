'use strict';
var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../components/auth');

var router = express.Router();

// router.get('/', auth.hasRole('admin'), controller.index);
// router.delete('/:id', auth.hasRole('admin'), controller.destroy);
// router.get('/me', auth.isAuthenticated(), controller.me);
// router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
// router.get('/:id', auth.isAuthenticated(), controller.show);
// router.post('/', controller.create);

router.put('/facebook/:id', controller.facebookLogin);
router.put('/setup-password/:id', controller.setupPassword);
router.put('/setup-fb-object/:id', controller.setupFacebookObject);

module.exports = router;
