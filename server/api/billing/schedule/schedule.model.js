'use strict';

var
_ = require('lodash'),
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
INT_DAILY     = 'daily',
INT_WEEKLY    = 'weekly',
INT_BIWEEKLY  = 'biweekly',
INT_MONTHLY   = 'monthly',
INT_QUARTERLY = 'quarterly',
INT_YEARLY    = 'yearly',

DCMETH_PERC   = 'percent',
DCMETH_FIXED  = 'fixed';

var
BillingScheduleSchema = new Schema({
  order: Number,
  groupDefault: Boolean,
  interval: {
    type: String,
    required: true,
    enum: [
      INT_DAILY,,
      INT_WEEKLY,
      INT_BIWEEKLY,
      INT_MONTHLY,
      INT_QUARTERLY,
      INT_YEARLY
    ]
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  discount: {
    amount: Number,
    method: {
      type: String,
      enum: [
        DCMETH_PERC,
        DCMETH_FIXED
      ]
    }
  },
  active: {
    type: Boolean,
    default: true
  }
});

BillingScheduleSchema.statics = {
  INT_DAILY: INT_DAILY,
  INT_WEEKLY: INT_WEEKLY,
  INT_BIWEEKLY: INT_BIWEEKLY,
  INT_MONTHLY: INT_MONTHLY,
  INT_QUARTERLY: INT_QUARTERLY,
  INT_YEARLY: INT_YEARLY,
  DCMETH_PERC: DCMETH_PERC,
  DCMETH_FIXED: DCMETH_FIXED
};

BillingScheduleSchema.methods = {
};

module.exports = mongoose.model('BillingSchedule', BillingScheduleSchema);