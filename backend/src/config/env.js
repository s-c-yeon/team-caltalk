require('dotenv').config();

const REQUIRED_KEYS = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];

const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`필수 환경변수가 누락되었습니다: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  port: Number(process.env.PORT),
};
