const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');
const env = require('../../src/config/env');

const TEAM_NAME = 'FE-05 Members Test Team';

let teamId;
let leaderUserId;
let memberUserId;
let outsiderUserId;
let leaderToken;
let outsiderToken;

function tokenFor(userId, email) {
  return jwt.sign({ sub: userId, email }, env.jwtSecret, { expiresIn: '1h' });
}

test.before(async () => {
  const passwordHash = await bcrypt.hash('password123', 4);

  const leader = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['fe05-leader@caltalk.local', passwordHash]
  );
  leaderUserId = leader.rows[0].id;

  const member = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['fe05-member@caltalk.local', passwordHash]
  );
  memberUserId = member.rows[0].id;

  const outsider = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['fe05-outsider@caltalk.local', passwordHash]
  );
  outsiderUserId = outsider.rows[0].id;

  const team = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [TEAM_NAME, 'FE05TEST']
  );
  teamId = team.rows[0].id;

  await pool.query(
    `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'leader')`,
    [teamId, leaderUserId]
  );
  await pool.query(
    `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')`,
    [teamId, memberUserId]
  );

  leaderToken = tokenFor(leaderUserId, 'fe05-leader@caltalk.local');
  outsiderToken = tokenFor(outsiderUserId, 'fe05-outsider@caltalk.local');
});

test.after(async () => {
  await pool.query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
  await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);
  await pool.query('DELETE FROM users WHERE id = ANY($1)', [
    [leaderUserId, memberUserId, outsiderUserId],
  ]);
  await pool.end();
});

test('팀원 목록 조회 시 email/role이 포함된 팀원 전체가 반환됨', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/members`)
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(res.status, 200);
  const emails = res.body.map((m) => m.email).sort();
  assert.deepEqual(emails, ['fe05-leader@caltalk.local', 'fe05-member@caltalk.local']);
  const leaderEntry = res.body.find((m) => m.email === 'fe05-leader@caltalk.local');
  assert.equal(leaderEntry.role, 'leader');
});

test('미소속 팀의 팀원 목록 조회 시 403 반환됨(BR-02)', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/members`)
    .set('Authorization', `Bearer ${outsiderToken}`);

  assert.equal(res.status, 403);
});

test('인증 토큰 없이 요청 시 401 반환됨', async () => {
  const res = await request(app).get(`/api/teams/${teamId}/members`);

  assert.equal(res.status, 401);
});
