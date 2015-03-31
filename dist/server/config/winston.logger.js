var winston = require('winston'),
    config  = require('./environment'),
    expressWinston = require('express-winston');

module.exports = expressWinston.logger(config.expressWinston);