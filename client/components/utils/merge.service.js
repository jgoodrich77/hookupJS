'use strict';

angular
.module('auditpagesApp')
.service('$merge', function () {

  // adapted from:
  // http://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/

  function isObjectLiteral(object) {
    return object && object.constructor && object.constructor.name === 'Object';
  }

  function deepExtend(destination, source) {
    for (var property in source) {
      if (isObjectLiteral(destination[property]) && isObjectLiteral(source[property])) {
        destination[property] = destination[property] || {};
        arguments.callee(destination[property], source[property]);
      } else {
        destination[property] = source[property];
      }
    }
    return destination;
  };

  return deepExtend;
});