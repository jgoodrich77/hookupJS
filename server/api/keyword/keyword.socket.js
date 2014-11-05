/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var keyword = require('./keyword.model');

exports.register = function(socket) {
  keyword.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  keyword.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('keyword:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('keyword:remove', doc);
}
