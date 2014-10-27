'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var mongoose = require('mongoose');
var config   = require('./server/config/environment');

var urlParse = require('url').parse;
var parsed = urlParse('http://www.amazon.com/foo/bar');
console.log(parsed.hostname);

