const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');
const env = require('../../src/config/env');

const PASSWORD = 'password123';

let soleLeaderUserId;
let dualLeader1Id;
let dualLeader2Id;
let lastTeamLeaderId;
let lastTeamMemberId;
let outsiderUserId;

let soloTeamId;
let dualTeamId;
let lastTeamId;

const userIds = [];
const teamIds = [];

function tokenFor(userId, email) {
  return jwt.sign({ sub: userId, email }, env.jwtSecret, { expiresIn: '1h' });
}

async function createUser(email) {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    [email, passwordHash]
  );
  userIds.push(rows[0].id);
  return rows[0].id;
}

async function createTeam(name, inviteCode) {
  const { rows } = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [name, inviteCode]
  );
  teamIds.push(rows[0].id);
  return rows[0].id;
}

async function addMember(teamId, userId, role) {
  await pool.query(`INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)`, [
    teamId,
    userId,
    role,
  ]);
}

test.before(async () => {
  soleLeaderUserId = await createUser('be10-sole-leader@caltalk.local');
  dualLeader1Id = await createUser('be10-dual-leader1@caltalk.local');
  dualLeader2Id = await createUser('be10-dual-leader2@caltalk.local');
  lastTeamLeaderId = await createUser('be10-last-team-leader@caltalk.local');
  lastTeamMemberId = await createUser('be10-last-team-member@caltalk.local');
  outsiderUserId = await createUser('be10-outsider@caltalk.local');

  soloTeamId = await createTeam('BE-10 Solo Leader Team', 'BE10SOLO');
  dualTeamId = await createTeam('BE-10 Dual Leader Team', 'BE10DUAL');
  lastTeamId = await createTeam('BE-10 Last Team', 'BE10LAST');

  await addMember(soloTeamId, soleLeaderUserId, 'leader');
  await addMember(dualTeamId, dualLeader1Id, 'leader');
  await addMember(dualTeamId, dualLeader2Id, 'leader');
  await addMember(lastTeamId, lastTeamLeaderId, 'leader');
  await addMember(lastTeamId, lastTeamMemberId, 'member');
});

test.after(async () => {
  await pool.query('DELETE FROM team_members WHERE team_id = ANY($1)', [teamIds]);
  await pool.query('DELETE FROM teams WHERE id = ANY($1)', [teamIds]);
  await pool.query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
  await pool.end();
});

test('유일한 팀장의 탈퇴 시도는 400으로 차단되고 team_members에서 삭제되지 않음(BR-09, EX-01)', async () => {
  const token = tokenFor(soleLeaderUserId, 'be10-sole-leader@caltalk.local');
  const res = await request(app)
    .delete(`/api/teams/${soloTeamId}/members/me`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 400);

  const { rows } = await pool.query(
    'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
    [soloTeamId, soleLeaderUserId]
  );
  assert.equal(rows.length, 1, '유일 팀장의 team_members 레코드는 그대로 남아 있어야 함');
});

test('다른 팀장이 존재하면 팀장 탈퇴가 정상 처리되어 team_members에서 삭제됨', async () => {
  const token = tokenFor(dualLeader1Id, 'be10-dual-leader1@caltalk.local');
  const res = await request(app)
    .delete(`/api/teams/${dualTeamId}/members/me`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);

  const { rows } = await pool.query(
    'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
    [dualTeamId, dualLeader1Id]
  );
  assert.equal(rows.length, 0);

  const { rows: remaining } = await pool.query(
    'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
    [dualTeamId, dualLeader2Id]
  );
  assert.equal(remaining.length, 1, '남은 팀장은 그대로 유지되어야 함');
});

test('마지막 소속 팀에서 탈퇴해도 users 레코드는 유지되고 재로그인이 정상 동작함(BR-12, EX-04)', async () => {
  const token = tokenFor(lastTeamMemberId, 'be10-last-team-member@caltalk.local');
  const res = await request(app)
    .delete(`/api/teams/${lastTeamId}/members/me`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [lastTeamMemberId]);
  assert.equal(rows.length, 1, 'users 레코드는 삭제되지 않고 유지되어야 함');

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'be10-last-team-member@caltalk.local', password: PASSWORD });
  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.body.token);
});

test('탈퇴 후 소속 팀 목록 조회 시 빈 배열이 반환되고 서버 에러가 없음', async () => {
  const token = tokenFor(lastTeamMemberId, 'be10-last-team-member@caltalk.local');
  const res = await request(app).get('/api/teams').set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
});

test('미소속 팀 탈퇴 시도 시 403 반환됨(BR-02)', async () => {
  const token = tokenFor(outsiderUserId, 'be10-outsider@caltalk.local');
  const res = await request(app)
    .delete(`/api/teams/${dualTeamId}/members/me`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 403);
});

test('인증 토큰 없이 탈퇴 요청 시 401 반환됨', async () => {
  const res = await request(app).delete(`/api/teams/${dualTeamId}/members/me`);

  assert.equal(res.status, 401);
});
