'use strict';

function respondError(res, err) {
  return res.json(500, err);
}
function respondData(res, data) {
  return res.json(201, data);
}
function respondOK(res) {
  return res.send(200);
}
function respondMissing(res) {
  return res.send(404);
}
function qHandlerError(res) {
  return function (err) {
    respondError(res, err);
    return err;
  }
}
function qHandlerData(res) {
  return function (data) {
    respondData(res, data);
    return data;
  }
}
function qHandlerOk(res) {
  return function (output) {
    respondOK();
    return output;
  }
}
function nHandlerError(res) {
  return function (err) {
    if(err) {
      return respondError(res, err);
    }

    return err;
  }
}
function nHandlerData(res) {
  return function (err, data) {
    if(!!err) {
      return respondError(res, err);
    }

    return respondData(res, data);
  }
}
function nHandlerDataOneRec(res) {
  return function (err, rec) {
    if(!!err) {
      return respondError(res, err);
    }
    if(!rec) {
      return respondMissing(res);
    }

    return respondData(res, rec);
  }
}
function nHandlerOk(res) {
  return function (err, output) {
    if(!!err) {
      return respondError(res, err);
    }

    return respondOK(output);
  }
}

module.exports = {
  error:   respondError,
  data:    respondData,
  ok:      respondOK,
  missing: respondMissing,
  qError:  qHandlerError,
  qData:   qHandlerData,
  qOk:     qHandlerOk,
  nError:  nHandlerError,
  nData:   nHandlerData,
  oneRec:  nHandlerDataOneRec,
  nOk:     nHandlerOk
};