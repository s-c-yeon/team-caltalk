const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');
const env = require('../../src/config/env');

const TEAM_NAME = 'BE-05 Test Team';

let teamId;
let leaderUserId;
let memberUserId;
let leaderToken;
let memberToken;

function tokenFor(userId, email) {
  return jwt.sign({ sub: userId, email }, env.jwtSecret, { expiresIn: '1h' });
}

function validSchedulePayload(overrides = {}) {
  return {
    title: '주간 회의',
    start_at: '2026-08-01T01:00:00Z',
    end_at: '2026-08-01T02:00:00Z',
    target_type: 'all',
    ...overrides,
  };
}

test.before(async () => {
  const passwordHash = await bcrypt.hash('password123', 4);

  const leader = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be05-leader@caltalk.local', passwordHash]
  );
  leaderUserId = leader.rows[0].id;

  const member = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be05-member@caltalk.local', passwordHash]
  );
  memberUserId = member.rows[0].id;

  const team = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [TEAM_NAME, 'BE05TEST']
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

  leaderToken = tokenFor(leaderUserId, 'be05-leader@caltalk.local');
  memberToken = tokenFor(memberUserId, 'be05-member@caltalk.local');
});

test.after(async () => {
  await pool.query('DELETE FROM schedules WHERE team_id = $1', [teamId]);
  await pool.query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
  await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);
  await pool.query('DELETE FROM users WHERE id = ANY($1)', [[leaderUserId, memberUserId]]);
  await pool.end();
});

test('팀장이 일정 생성 시 201 반환됨', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload());

  assert.equal(res.status, 201);
  assert.equal(res.body.title, '주간 회의');
  assert.equal(res.body.team_id, teamId);
});

test('팀원이 일정 생성 시도 시 403 반환됨(BR-03)', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send(validSchedulePayload());

  assert.equal(res.status, 403);
});

test('제목이 공백만으로 구성되면 400 반환됨', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ title: '   ' }));

  assert.equal(res.status, 400);
});

test('제목이 101자 이상이면 400 반환됨', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ title: 'a'.repeat(101) }));

  assert.equal(res.status, 400);
});

test('제목이 정확히 1자이면 생성이 허용됨(경계값)', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ title: 'a' }));

  assert.equal(res.status, 201);
});

test('제목이 정확히 100자이면 생성이 허용됨(경계값)', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ title: 'a'.repeat(100) }));

  assert.equal(res.status, 201);
});

test('시작 일시가 종료 일시보다 앞서지 않으면(같거나 이후) 400 반환됨', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(
      validSchedulePayload({ start_at: '2026-08-01T02:00:00Z', end_at: '2026-08-01T01:00:00Z' })
    );

  assert.equal(res.status, 400);
});

test("대상이 'all'인데 target_member_id를 함께 지정하면 400 반환됨", async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ target_type: 'all', target_member_id: memberUserId }));

  assert.equal(res.status, 400);
});

test("대상이 'member'인데 target_member_id가 없으면 400 반환됨", async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ target_type: 'member' }));

  assert.equal(res.status, 400);
});

test('target_member_id에 배열(복수 대상)을 지정하면 400 반환됨(대상 단일 선택 위반)', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ target_type: 'member', target_member_id: [memberUserId, leaderUserId] }));

  assert.equal(res.status, 400);
});

test('팀장이 대상=특정 팀원으로 일정을 정상 생성할 수 있음', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ target_type: 'member', target_member_id: memberUserId }));

  assert.equal(res.status, 201);
  assert.equal(res.body.target_type, 'member');
  assert.equal(res.body.target_member_id, memberUserId);
});

test('팀장이 일정을 수정하면 200과 변경된 필드가 반영됨', async () => {
  const created = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ title: '수정 전' }));

  const res = await request(app)
    .patch(`/api/teams/${teamId}/schedules/${created.body.id}`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send({ title: '수정 후' });

  assert.equal(res.status, 200);
  assert.equal(res.body.title, '수정 후');
});

test('팀원이 일정 수정을 시도하면 403 반환됨(BR-03)', async () => {
  const created = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload());

  const res = await request(app)
    .patch(`/api/teams/${teamId}/schedules/${created.body.id}`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ title: '팀원이 수정 시도' });

  assert.equal(res.status, 403);
});

test('존재하지 않는 일정을 수정하려 하면 404 반환됨', async () => {
  const res = await request(app)
    .patch(`/api/teams/${teamId}/schedules/999999`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send({ title: '없는 일정' });

  assert.equal(res.status, 404);
});

test('동일 일정에 순차적으로 PATCH 2회를 보내면 나중 요청이 최종 반영됨(Last-Write-Wins, BR-10)', async () => {
  const created = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ title: '동시수정 원본' }));

  const first = await request(app)
    .patch(`/api/teams/${teamId}/schedules/${created.body.id}`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send({ title: '먼저 저장' });
  assert.equal(first.status, 200);

  const second = await request(app)
    .patch(`/api/teams/${teamId}/schedules/${created.body.id}`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send({ title: '나중에 저장' });
  assert.equal(second.status, 200);
  assert.equal(second.body.title, '나중에 저장');

  const columns = Object.keys(second.body);
  assert.ok(!columns.includes('version'));
});

test('팀장이 일정을 삭제하면 200 반환되고 목록에서 제거됨', async () => {
  const created = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload({ title: '삭제될 일정' }));

  const res = await request(app)
    .delete(`/api/teams/${teamId}/schedules/${created.body.id}`)
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(res.status, 200);

  const afterDelete = await request(app)
    .patch(`/api/teams/${teamId}/schedules/${created.body.id}`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send({ title: '삭제된 일정 수정 시도' });
  assert.equal(afterDelete.status, 404);
});

test('팀원이 일정 삭제를 시도하면 403 반환됨(BR-03)', async () => {
  const created = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send(validSchedulePayload());

  const res = await request(app)
    .delete(`/api/teams/${teamId}/schedules/${created.body.id}`)
    .set('Authorization', `Bearer ${memberToken}`);

  assert.equal(res.status, 403);
});
