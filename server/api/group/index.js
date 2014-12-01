'use strict';

var express = require('express');
var controller = require('./group.controller');
var auth = require('../../components/auth');

var router = express.Router();

// admin actions
router.get ('/global.query',                   auth.hasRole('admin'), controller.globalQuery);
router.get ('/global.get/:id',                 auth.hasRole('admin'), controller.globalGet);
router.get ('/global.get.billing/:id',         auth.hasRole('admin'), controller.globalGetBilling);
router.get ('/global.get.services/:id',        auth.hasRole('admin'), controller.globalGetServices);
router.get ('/global.get.members/:id',         auth.hasRole('admin'), controller.globalGetMembers);
router.put ('/global.update/:id',              auth.hasRole('admin'), controller.globalUpdate);
router.put ('/global.update.plan/:id',         auth.hasRole('admin'), controller.globalUpdatePlan);
router.put ('/global.update.billing/:id',      auth.hasRole('admin'), controller.globalUpdateBilling);
router.put ('/global.update.services/:id',     auth.hasRole('admin'), controller.globalUpdateServices);
router.put ('/global.update.members/:id',      auth.hasRole('admin'), controller.globalUpdateMembers);

// user actions
router.post('/create',                         auth.isAuthenticated(), controller.create);
router.get ('/subscribed.query',               auth.isAuthenticated(), controller.subscribedQuery);
router.get ('/subscribed.get/:id',             auth.isAuthenticated(), controller.subscribedGet);
router.get ('/subscribed.get.billing/:id',     auth.isAuthenticated(), controller.subscribedGetBilling);
router.get ('/subscribed.get.services/:id',    auth.isAuthenticated(), controller.subscribedGetServices);
router.get ('/subscribed.get.members/:id',     auth.isAuthenticated(), controller.subscribedGetMembers);
router.put ('/subscribed.update/:id',          auth.isAuthenticated(), controller.subscribedUpdate);
router.put ('/subscribed.update.plan/:id',     auth.isAuthenticated(), controller.subscribedUpdatePlan);
router.put ('/subscribed.update.billing/:id',  auth.isAuthenticated(), controller.subscribedUpdateBilling);
router.put ('/subscribed.update.services/:id', auth.isAuthenticated(), controller.subscribedUpdateServices);
router.put ('/subscribed.invite.member/:id',   auth.isAuthenticated(), controller.subscribedInviteMember);
router.put ('/subscribed.invite.cancel/:id',   auth.isAuthenticated(), controller.subscribedInviteCancel);

module.exports = router;
