'use strict';

/**
 * Facebook controller
 */

var _ = require('lodash');
var Q = require('q');
var Group = require('./group.model');
var User = require('../user/user.model');
var requestUtils = require('../requestUtils');