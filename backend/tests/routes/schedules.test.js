const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');
const env = require('../../src/config/env');

const TEAM_NAME = 'BE-04 Test Team';
const OTHER_TEAM_NAME = 'BE-04 Other Team';

let teamId;
let otherTeamId;
let leaderUserId;
let memberUserId;
let outsiderUserId;
let leaderToken;
let memberToken;
let outsiderToken;

function tokenFor(userId, email) {
  return jwt.sign({ sub: userId, email }, env.jwtSecret, { expiresIn: '1h' });
}

test.before(async () => {
  const passwordHash = await bcrypt.hash('password123', 4);

  const leader = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be04-leader@caltalk.local', passwordHash]
  );
  leaderUserId = leader.rows[0].id;

  const member = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be04-member@caltalk.local', passwordHash]
  );
  memberUserId = member.rows[0].id;

  const outsider = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be04-outsider@caltalk.local', passwordHash]
  );
  outsiderUserId = outsider.rows[0].id;

  const team = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [TEAM_NAME, 'BE04TEST']
  );
  teamId = team.rows[0].id;

  const otherTeam = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [OTHER_TEAM_NAME, 'BE04OTHR']
  );
  otherTeamId = otherTeam.rows[0].id;

  await pool.query(
    `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'leader')`,
    [teamId, leaderUserId]
  );
  await pool.query(
    `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')`,
    [teamId, memberUserId]
  );

  await pool.query(
    `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, created_by)
     VALUES
       ($1, '이번 주 일정', '2026-07-15T01:00:00Z', '2026-07-15T02:00:00Z', 'all', $2),
       ($1, '지난 주 일정', '2026-07-08T01:00:00Z', '2026-07-08T02:00:00Z', 'all', $2),
       ($1, '지난 달 일정', '2026-06-20T01:00:00Z', '2026-06-20T02:00:00Z', 'all', $2),
       ($3, '다른 팀 일정', '2026-07-15T01:00:00Z', '2026-07-15T02:00:00Z', 'all', $2)`,
    [teamId, leaderUserId, otherTeamId]
  );

  leaderToken = tokenFor(leaderUserId, 'be04-leader@caltalk.local');
  memberToken = tokenFor(memberUserId, 'be04-member@caltalk.local');
  outsiderToken = tokenFor(outsiderUserId, 'be04-outsider@caltalk.local');
});

test.after(async () => {
  await pool.query('DELETE FROM schedules WHERE team_id = ANY($1)', [[teamId, otherTeamId]]);
  await pool.query('DELETE FROM team_members WHERE team_id = ANY($1)', [[teamId, otherTeamId]]);
  await pool.query('DELETE FROM teams WHERE id = ANY($1)', [[teamId, otherTeamId]]);
  await pool.query('DELETE FROM users WHERE id = ANY($1)', [
    [leaderUserId, memberUserId, outsiderUserId],
  ]);
  await pool.end();
});

test('view=month, date=2026-07-15 요청 시 7월 범위 일정만 반환됨(다른 팀/다른 달 일정 제외)', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedules`)
    .query({ view: 'month', date: '2026-07-15' })
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(res.status, 200);
  const titles = res.body.map((s) => s.title).sort();
  assert.deepEqual(titles, ['이번 주 일정', '지난 주 일정'].sort());
  assert.ok(res.body.every((s) => s.team_id === teamId));
});

test('view=week, date=2026-07-15 요청 시 해당 주 범위 일정만 반환됨', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedules`)
    .query({ view: 'week', date: '2026-07-15' })
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(res.status, 200);
  const titles = res.body.map((s) => s.title);
  assert.deepEqual(titles, ['이번 주 일정']);
});

test('view=day, date=2026-07-15 요청 시 해당 날짜 일정만 반환됨', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedules`)
    .query({ view: 'day', date: '2026-07-15' })
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(res.status, 200);
  const titles = res.body.map((s) => s.title);
  assert.deepEqual(titles, ['이번 주 일정']);
});

test('팀원(role=member) 계정도 팀장과 동일하게 조회 가능함(BR-04는 CUD만 제한)', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedules`)
    .query({ view: 'day', date: '2026-07-15' })
    .set('Authorization', `Bearer ${memberToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
});

test('미소속 팀 조회 시 403 반환됨(BR-02)', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedules`)
    .query({ view: 'day', date: '2026-07-15' })
    .set('Authorization', `Bearer ${outsiderToken}`);

  assert.equal(res.status, 403);
});

test('인증 토큰 없이 요청 시 401 반환됨(BR-01)', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedules`)
    .query({ view: 'day', date: '2026-07-15' });

  assert.equal(res.status, 401);
});

test('view 파라미터가 유효하지 않으면 400 반환됨', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedules`)
    .query({ view: 'year', date: '2026-07-15' })
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(res.status, 400);
});

test('date 파라미터가 누락되면 400 반환됨', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedules`)
    .query({ view: 'day' })
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(res.status, 400);
});
