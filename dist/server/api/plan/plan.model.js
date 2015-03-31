'use strict';

var
_ = require('lodash'),
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
PlanSchema = new Schema({
  order: Number,
  groupDefault: Boolean,
  name: {
    type: String,
    required: true
  },
  description: String,
  monthlyCost: Number,
  config: Object,
  active: {
    type: Boolean,
    default: true
  }
});

PlanSchema.statics = {
};

PlanSchema.methods = {
};

module.exports = mongoose.model('Plan', PlanSchema);