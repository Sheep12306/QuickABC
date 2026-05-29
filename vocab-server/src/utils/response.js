function success(data, msg = 'ok') {
  return { code: 200, msg, data };
}

function fail(code, msg) {
  return { code, msg };
}

function error(msg, err) {
  return { code: 500, msg, error: err?.message || err };
}

module.exports = { success, fail, error };
