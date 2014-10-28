'use strict';

var express = require('express');
var controller = require('./keyword.controller');

var router = express.Router();

router.get('/keywords', controller.index);
router.get('/keywords/:id', controller.show);
router.post('/keywords', controller.create);
router.put('/keywords/:id', controller.update);
router.patch('/keywords/:id', controller.update);
router.delete('/keywords/:id', controller.destroy);

module.exports = router;
