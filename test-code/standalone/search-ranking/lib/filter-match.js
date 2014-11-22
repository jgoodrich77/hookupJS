'use strict';

var
util = require('util');

function FilterMatch(spec) {

  var matches;

  function testCondition(row, column, condition) {
    var
    value = row[column],
    conditionType = typeof condition,
    passes = false;

    if((typeof value !== 'string' && !util.isArray(value)) && conditionType !== 'function') { // invalid value to test
      return false;
    }

    if(condition instanceof RegExp) { // condition is a regular expression match:
      passes = condition.test(value);
    }
    else if(conditionType === 'object' && !util.isArray(condition)) {
      throw new Error('Invalid filter match condition. Must be a string / array / function / RegExp.');
    }
    else if(conditionType === 'function') {
      passes = condition(value);
    }
    else if(!!condition) {
      if(!util.isArray(condition)) {
        condition = [condition];
      }

      passes = !condition.every(function (c) {
        return value.indexOf(c) === -1;
      });
    }

    return passes;
  }

  switch(typeof spec) {
    case 'array':
    case 'number':
    case 'string': // match string over all values
    matches = function(v) {
      return !Object.keys(v).every(function (key) {
        return !testCondition(v, key, spec);
      });
    };
    break;
    case 'object': // match specific columns
    var
    specKeys = Object.keys(spec || {});

    matches = function(v) {
      if(!specKeys.length) { // not filtering anything
        return true;
      }

      return !specKeys.every(function (key) {
        return !testCondition(v, key, spec[key]);
      });
    };
    break;
    case 'function': // custom value test fn
    matches = spec;
    break;
    default: // match passthru
    matches = function(v) {
      return true;
    };
    break;
  }

  this.test = function (v) {
    return matches(v);
  };
}

module.exports = FilterMatch;