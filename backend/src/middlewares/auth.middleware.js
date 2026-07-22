const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { HttpError } = require('./errorHandler.middleware');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new HttpError(401, 'UNAUTHENTICATED', '인증 토큰이 필요합니다.'));
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(new HttpError(401, 'UNAUTHENTICATED', '유효하지 않은 토큰입니다.'));
  }
}

module.exports = authMiddleware;
