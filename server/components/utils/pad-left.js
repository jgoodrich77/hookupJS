'use strict';

module.exports = function (nr, n, str) {
  return Array(n-String(nr).length+1).join(str||'0')+nr;
};