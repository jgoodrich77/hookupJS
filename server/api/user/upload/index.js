'use strict';
var express = require('express');
var controller = require('./upload.controller');
var config = require('../../../config/environment');
var auth = require('../../../components/auth');

var router = express.Router();

router.get('/',       auth.isAuthenticated(), controller.index);
router.get('/:id',    auth.isAuthenticated(), controller.show);
router.post('/',      auth.isAuthenticated(), controller.create);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);

module.exports = router;
