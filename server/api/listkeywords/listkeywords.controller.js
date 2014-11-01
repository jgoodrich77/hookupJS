/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /keywords              ->  index
 * POST    /keywords              ->  create
 * GET     /keywords/:id          ->  show
 * PUT     /keywords/:id          ->  update
 * DELETE  /keywords/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Keyword = require('./listkeywords.model');

// Get list of things
exports.index = function(req, res) {
  Keyword.find(function (err, keywords) {
    if(err) { return handleError(res, err); }
    return res.json(200, keywords);
  });
};

// Get a single thing
exports.show = function(req, res) {
  Keyword.findById(req.params.id, function (err, keyword) {
    if(err) { return handleError(res, err); }
    if(!keyword) { return res.send(404); }
    return res.json(keyword);
  });
};

// Creates a new thing in the DB.
exports.create = function(req, res) {
  Keyword.create(req.body, function(err, keyword) {
    if(err) { return handleError(res, err); }
    return res.json(201, keyword);
  });
};

// Updates an existing thing in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Keyword.findById(req.params.id, function (err, keyword) {
    if (err) { return handleError(res, err); }
    if(!keyword) { return res.send(404); }
    var updated = _.merge(keyword, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, keyword);
    });
  });
};

// Deletes a thing from the DB.
exports.destroy = function(req, res) {
  Keyword.findById(req.params.id, function (err, keyword) {
    if(err) { return handleError(res, err); }
    if(!keyword) { return res.send(404); }
    keyword.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
