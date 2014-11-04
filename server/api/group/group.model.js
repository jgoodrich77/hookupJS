'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
GroupSchema = new Schema({
  name: String,
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    relationship: {
      type: String,
      enum: [
        'owner',
        'editor',
        'viewer'
      ]
    }
  }],
  services: [{
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service'
    },
    params: Object
  }]
});

mongoose.model('Group', GroupSchema);
