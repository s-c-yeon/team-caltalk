const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/user.model');
const { HttpError } = require('../middlewares/errorHandler.middleware');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 10;

async function signup(email, password) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new HttpError(400, 'VALIDATION_ERROR', '올바른 이메일 형식이 아닙니다.');
  }
  if (!password || password.length < 8) {
    throw new HttpError(400, 'VALIDATION_ERROR', '비밀번호는 8자 이상이어야 합니다.');
  }

  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', '이미 사용 중인 이메일입니다.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return userModel.create(email, passwordHash);
}

async function login(email, password) {
  if (!email || !password) {
    throw new HttpError(400, 'VALIDATION_ERROR', '이메일과 비밀번호를 입력해주세요.');
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: '7d' });
  return {
    token,
    user: { id: user.id, email: user.email, created_at: user.created_at },
  };
}

module.exports = { signup, login };
