/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /services              ->  index
 * POST    /services              ->  create
 * GET     /services/:id          ->  show
 * PUT     /services/:id          ->  update
 * DELETE  /services/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Service = require('./service.model');

exports.index = function(req, res) {
  Service.find(function (err, services) {
    if(err) { return handleError(res, err); }
    return res.json(200, services);
  });
};

exports.show = function(req, res) {
  Service.findById(req.params.id, function (err, service) {
    if(err) { return handleError(res, err); }
    if(!service) { return res.send(404); }
    return res.json(service);
  });
};

exports.create = function(req, res) {
  Service.create(req.body, function(err, service) {
    if(err) { return handleError(res, err); }
    return res.json(201, service);
  });
};

exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Service.findById(req.params.id, function (err, service) {
    if (err) { return handleError(res, err); }
    if(!service) { return res.send(404); }
    var updated = _.merge(service, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, service);
    });
  });
};

exports.destroy = function(req, res) {
  Service.findById(req.params.id, function (err, service) {
    if(err) { return handleError(res, err); }
    if(!service) { return res.send(404); }
    service.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
