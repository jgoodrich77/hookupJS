'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
ScheduleSchema = new Schema({

});

module.exports = mongoose.model('Schedule', ScheduleSchema);