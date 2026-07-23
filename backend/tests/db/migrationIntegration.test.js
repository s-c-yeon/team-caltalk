const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Pool } = require('pg');
const env = require('../../src/config/env');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'src', 'db', 'migrations');
const MIGRATE_SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'migrate.js');
const SEED_SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'seed.js');

const EXPECTED_TABLES = [
  'users',
  'teams',
  'team_members',
  'schedules',
  'chat_messages',
  'schedule_change_requests',
];

const TEST_DB_NAME = 'team_caltalk_migration_check';

const adminUrl = new URL(env.databaseUrl);
adminUrl.pathname = '/postgres';
const adminPool = new Pool({ connectionString: adminUrl.toString() });

const testDbUrl = new URL(env.databaseUrl);
testDbUrl.pathname = `/${TEST_DB_NAME}`;

let testPool;

test.before(async () => {
  await adminPool.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`);
  await adminPool.query(`CREATE DATABASE ${TEST_DB_NAME}`);
});

test.after(async () => {
  if (testPool) {
    await testPool.end();
  }
  await adminPool.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`);
  await adminPool.end();
});

test('DB-08: 마이그레이션 파일명이 NNN_create_<table>.sql 규칙과 001~006 순번을 유지함', () => {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  assert.equal(files.length, 6);
  files.forEach((file, index) => {
    const expectedPrefix = String(index + 1).padStart(3, '0');
    assert.match(file, new RegExp(`^${expectedPrefix}_create_[a-z_]+\\.sql$`));
  });
});

test('DB-08: 빈 DB에서 001~006 마이그레이션 재실행 시 에러 없이 6개 테이블이 모두 생성됨', () => {
  const result = spawnSync(process.execPath, [MIGRATE_SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: testDbUrl.toString() },
  });

  assert.equal(result.status, 0, result.stderr);

  testPool = new Pool({ connectionString: testDbUrl.toString() });
});

test('DB-08: 재현된 스키마에 6개 테이블이 모두 존재함', async () => {
  const { rows } = await testPool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );
  const tableNames = rows.map((r) => r.table_name);

  for (const table of EXPECTED_TABLES) {
    assert.ok(tableNames.includes(table), `${table} 테이블이 존재해야 함`);
  }
});

test('DB-08: 동일 마이그레이션을 재실행해도(이미 적용된 파일은 skip) 에러가 발생하지 않음', () => {
  const result = spawnSync(process.execPath, [MIGRATE_SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: testDbUrl.toString() },
  });

  assert.equal(result.status, 0, result.stderr);
});

test('DB-08: DB-07 시드 스크립트가 재현된 빈 DB에서도 정상적으로 데이터를 채움', async () => {
  const result = spawnSync(process.execPath, [SEED_SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: testDbUrl.toString() },
  });

  assert.equal(result.status, 0, result.stderr);

  const { rows } = await testPool.query(
    `SELECT
       (SELECT count(*) FROM users WHERE email LIKE 'seed-%@caltalk.local') AS seed_users,
       (SELECT count(*) FROM schedules) AS schedules,
       (SELECT count(*) FROM chat_messages) AS messages,
       (SELECT count(*) FROM schedule_change_requests) AS change_requests`
  );
  const row = rows[0];

  assert.equal(Number(row.seed_users), 3);
  assert.ok(Number(row.schedules) >= 1);
  assert.ok(Number(row.messages) >= 2);
  assert.ok(Number(row.change_requests) >= 1);
});
