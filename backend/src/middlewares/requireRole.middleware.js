const { HttpError } = require('./errorHandler.middleware');

function requireRole(role) {
  return function requireRoleMiddleware(req, res, next) {
    if (!req.teamMembership || req.teamMembership.role !== role) {
      return next(new HttpError(403, 'FORBIDDEN_ROLE', '이 작업을 수행할 권한이 없습니다.'));
    }
    next();
  };
}

module.exports = requireRole;
