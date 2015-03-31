'use strict';

var
_ = require('lodash'),
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
BillingMethodSchema = new Schema({
  order: Number,
  groupDefault: Boolean,
  name: {
    type: String,
    required: true
  },
  adapter: {
    factoryClass: String,
    options: Object
  },
  active: {
    type: Boolean,
    default: true
  }
});

BillingMethodSchema.statics = {
};

BillingMethodSchema.methods = {
};

module.exports = mongoose.model('BillingMethod', BillingMethodSchema);