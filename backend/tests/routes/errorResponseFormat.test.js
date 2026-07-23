const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');
const env = require('../../src/config/env');

const TEAM_NAME = 'BE-11 Test Team';

let teamId;
let leaderUserId;
let outsiderUserId;
let leaderToken;
let outsiderToken;

function tokenFor(userId, email) {
  return jwt.sign({ sub: userId, email }, env.jwtSecret, { expiresIn: '1h' });
}

function assertStandardErrorShape(body) {
  assert.deepEqual(Object.keys(body), ['error']);
  assert.deepEqual(Object.keys(body.error).sort(), ['code', 'message']);
  assert.equal(typeof body.error.message, 'string');
  assert.equal(typeof body.error.code, 'string');
}

test.before(async () => {
  const passwordHash = await bcrypt.hash('password123', 4);

  const leader = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be11-leader@caltalk.local', passwordHash]
  );
  leaderUserId = leader.rows[0].id;

  const outsider = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be11-outsider@caltalk.local', passwordHash]
  );
  outsiderUserId = outsider.rows[0].id;

  const team = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [TEAM_NAME, 'BE11TEST']
  );
  teamId = team.rows[0].id;

  await pool.query(
    `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'leader')`,
    [teamId, leaderUserId]
  );

  leaderToken = tokenFor(leaderUserId, 'be11-leader@caltalk.local');
  outsiderToken = tokenFor(outsiderUserId, 'be11-outsider@caltalk.local');
});

test.after(async () => {
  await pool.query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
  await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);
  await pool.query('DELETE FROM users WHERE id = ANY($1)', [[leaderUserId, outsiderUserId]]);
  await pool.end();
});

test('401 응답이 { error: { message, code } } 형식으로 통일되어 있음', async () => {
  const res = await request(app).get(`/api/teams/${teamId}/schedules?view=day&date=2026-07-15`);

  assert.equal(res.status, 401);
  assertStandardErrorShape(res.body);
});

test('403 응답이 { error: { message, code } } 형식으로 통일되어 있음', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedules?view=day&date=2026-07-15`)
    .set('Authorization', `Bearer ${outsiderToken}`);

  assert.equal(res.status, 403);
  assertStandardErrorShape(res.body);
});

test('400 응답이 { error: { message, code } } 형식으로 통일되어 있음', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send({ title: '', start_at: '2026-08-01T01:00:00Z', end_at: '2026-08-01T02:00:00Z', target_type: 'all' });

  assert.equal(res.status, 400);
  assertStandardErrorShape(res.body);
});

test('404 응답(존재하지 않는 리소스)이 { error: { message, code } } 형식으로 통일되어 있음', async () => {
  const res = await request(app)
    .patch(`/api/teams/${teamId}/schedules/999999`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send({ title: '없는 일정' });

  assert.equal(res.status, 404);
  assertStandardErrorShape(res.body);
});

test('404 응답(존재하지 않는 라우트)이 { error: { message, code } } 형식으로 통일되어 있음', async () => {
  const res = await request(app)
    .get('/api/this-route-does-not-exist')
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(res.status, 404);
  assertStandardErrorShape(res.body);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});
