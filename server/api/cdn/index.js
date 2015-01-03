'use strict';

'use strict';
var express = require('express');
var controller = require('./cdn.controller');

var router = express.Router();
router.get('/:id', controller.display);
module.exports = router;
