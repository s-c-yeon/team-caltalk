class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: '요청한 경로를 찾을 수 없습니다.', code: 'NOT_FOUND' } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.status ? err.message : '서버 오류가 발생했습니다.';
  if (!err.status) {
    console.error(err);
  }
  res.status(status).json({ error: { message, code } });
}

module.exports = { HttpError, notFoundHandler, errorHandler };
