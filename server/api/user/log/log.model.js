'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
UserLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  detail: Object,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

UserLogSchema.statics = {
  Category: {
    account: 'account',
    group:   'group',
    billing: 'billing'
  },

  Action: {
    Account: {
      login:          'login',
      logout:         'logout',
      create:         'create',
      close:          'close',
      addBilling:     'add-billing',
      updateBilling:  'update-billing',
      updateProfile:  'update-profile',
      updatePassword: 'update-password'
    },
    Group: {
      create:         'create',
      update:         'update',
      remove:         'remove',
      join:           'join',
      leave:          'leave',
      invite:         'invite',
      invited:        'invited',
      recruit:        'recruit'
    },
    Billing: {
      add:            'add',
      update:         'update',
      remove:         'remove',
      charge:         'charge',
      error:          'error'
    }
  }
};

UserLogSchema.methods = {
  // ...
};

module.exports = mongoose.model('UserLog', UserLogSchema);