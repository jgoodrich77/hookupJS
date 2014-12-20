'use strict';

angular
.module('auditpagesApp')
.service('$inherit', function() {
  return function(constructor, parentClassOrObject) {
    if ( parentClassOrObject.constructor == Function ) { // Normal Inheritance
      constructor.prototype = new parentClassOrObject;
      constructor.prototype.constructor = this;
      constructor.prototype.parent = parentClassOrObject.prototype;
    }
    else { // Pure Virtual Inheritance
      constructor.prototype = parentClassOrObject;
      constructor.prototype.constructor = this;
      constructor.prototype.parent = parentClassOrObject;
    }
    return constructor;
  };
});