'use strict';

var
express = require('express'),
controller = require('./score.controller'),
config = require('../../../config/environment'),
auth = require('../../../components/auth'),
router = express.Router();

module.exports = router;