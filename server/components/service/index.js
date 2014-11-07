/**
** Factory Loader for various services.
**/

'use strict';

var
serviceAdapters = [
  require('./adapter/facebook-page.js'),
  require('./adapter/facebook-user.js'),
  require('./adapter/google-cse.js'),
  require('./adapter/google-plus.js'),
  require('./adapter/twitter.js')
],
serviceTypes = serviceAdapters.map(function (v) {
  return v.type;
});

module.exports = {
  typeId: function(type) {
    return serviceTypes.indexOf(type);
  },
  hasType: function(type) {
    return this.typeId(type) !== -1;
  },
  getByType: function(type) {
    var
    typeIndex = this.typeId(type);

    if(typeIndex === -1) {
      throw 'Invalid service adapter type was provided.';
    }

    return serviceAdapters[typeIndex];
  }
};