'use strict';

var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

var
ServiceSchema = new Schema({
  name: String,
  description: String,
  free: Boolean,
  adapter: {
    factoryClass: String,
    defaultParams: Object
  }
});

mongoose.model('Service', ServiceSchema);
