/**
 * Error responses
 */

'use strict';

var
util = require('util'),
isError = util.isError,
format = util.format;

function sendErrorView(req, res, viewFile, code, detail) {

  if(req.xhr) { // send via JSON (cleaner for RPC)
    return res.json(code, detail);
  }

  res.status(code);
  res.render(viewFile, function (err) {
    if (err) { // export as json instead
      return res.json(code, detail);
    }

    res.render(viewFile);
  });
}

module.exports[404] = function pageNotFound(req, res, next) {
  sendErrorView(req, res, '404', 404, {
    message: format('Resource requested (%s) was not found', req.path),
    path: req.path,
    query: req.body,
    cookies: req.cookies
  });
};

module.exports[500] = function serviceIsBroken(error, req, res, next) {

  var
  isErrorObject = isError(error),
  errorMessage = isErrorObject ? error.message : error;

  // log error to console:
  console.error(isErrorObject ? error.stack : error);

  sendErrorView(req, res, '500', 500, {
    message: format('Resource requested (%s) has a server-side problem', req.path),
    error: errorMessage,
    path: req.path,
    query: req.body,
    cookies: req.cookies
  });
};
