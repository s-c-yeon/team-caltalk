const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');
const env = require('../../src/config/env');

const TEAM_NAME = 'BE-08 Test Team';

let teamId;
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
    ['be08-leader@caltalk.local', passwordHash]
  );
  leaderUserId = leader.rows[0].id;

  const member = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be08-member@caltalk.local', passwordHash]
  );
  memberUserId = member.rows[0].id;

  const outsider = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be08-outsider@caltalk.local', passwordHash]
  );
  outsiderUserId = outsider.rows[0].id;

  const team = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [TEAM_NAME, 'BE08TEST']
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

  leaderToken = tokenFor(leaderUserId, 'be08-leader@caltalk.local');
  memberToken = tokenFor(memberUserId, 'be08-member@caltalk.local');
  outsiderToken = tokenFor(outsiderUserId, 'be08-outsider@caltalk.local');
});

test.after(async () => {
  await pool.query(
    `DELETE FROM schedule_change_requests
     WHERE chat_message_id IN (SELECT id FROM chat_messages WHERE team_id = $1)`,
    [teamId]
  );
  await pool.query('DELETE FROM chat_messages WHERE team_id = $1', [teamId]);
  await pool.query('DELETE FROM schedules WHERE team_id = $1', [teamId]);
  await pool.query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
  await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);
  await pool.query('DELETE FROM users WHERE id = ANY($1)', [
    [leaderUserId, memberUserId, outsiderUserId],
  ]);
  await pool.end();
});

test('변경 요청 목록에 원본 채팅 메시지(발신자/본문/시각)가 조인되어 포함됨(SC-07)', async () => {
  const sent = await request(app)
    .post(`/api/teams/${teamId}/chat-messages`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ type: 'change_request', content: '회의를 내일로 옮겨주세요.', request_type: 'create' });
  assert.equal(sent.status, 201);

  const res = await request(app)
    .get(`/api/teams/${teamId}/schedule-change-requests`)
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(res.status, 200);
  const item = res.body.find((i) => i.id === sent.body.schedule_change_request.id);
  assert.ok(item, '방금 생성한 요청이 목록에 포함되어야 함');
  assert.equal(item.chat_message.sender_id, memberUserId);
  assert.equal(item.chat_message.content, '회의를 내일로 옮겨주세요.');
  assert.ok(item.chat_message.created_at);
  assert.equal(item.request_type, 'create');
});

test('응답 스키마에 status/approved/rejected 필드가 존재하지 않음(§1.2, §10.2)', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedule-change-requests`)
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(res.status, 200);
  for (const item of res.body) {
    const keys = Object.keys(item);
    assert.ok(!keys.includes('status'));
    assert.ok(!keys.includes('approved'));
    assert.ok(!keys.includes('rejected'));
  }
});

test('팀원 계정으로도 목록 조회가 가능함(별도 승인/반려 엔드포인트 없이 조회 전용)', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedule-change-requests`)
    .set('Authorization', `Bearer ${memberToken}`);

  assert.equal(res.status, 200);
});

test('미소속 팀 조회 시 403 반환됨(BR-02)', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/schedule-change-requests`)
    .set('Authorization', `Bearer ${outsiderToken}`);

  assert.equal(res.status, 403);
});

test('인증 토큰 없이 요청 시 401 반환됨', async () => {
  const res = await request(app).get(`/api/teams/${teamId}/schedule-change-requests`);

  assert.equal(res.status, 401);
});

test('BE-05 일정 수정 API로 대상 일정을 수정해도 연결된 요청 레코드는 어떤 필드도 변경되지 않음', async () => {
  const createdSchedule = await request(app)
    .post(`/api/teams/${teamId}/schedules`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send({
      title: '반영 전 일정',
      start_at: '2026-08-01T01:00:00Z',
      end_at: '2026-08-01T02:00:00Z',
      target_type: 'all',
    });
  assert.equal(createdSchedule.status, 201);

  const sentMessage = await request(app)
    .post(`/api/teams/${teamId}/chat-messages`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({
      type: 'change_request',
      content: '이 일정을 1시간 뒤로 옮겨주세요.',
      request_type: 'update',
      target_schedule_id: createdSchedule.body.id,
    });
  assert.equal(sentMessage.status, 201);
  const originalRequest = sentMessage.body.schedule_change_request;

  const updated = await request(app)
    .patch(`/api/teams/${teamId}/schedules/${createdSchedule.body.id}`)
    .set('Authorization', `Bearer ${leaderToken}`)
    .send({ start_at: '2026-08-01T02:00:00Z', end_at: '2026-08-01T03:00:00Z' });
  assert.equal(updated.status, 200);

  const listAfter = await request(app)
    .get(`/api/teams/${teamId}/schedule-change-requests`)
    .set('Authorization', `Bearer ${leaderToken}`);
  const itemAfter = listAfter.body.find((i) => i.id === originalRequest.id);

  assert.ok(itemAfter, '일정 수정 후에도 요청 레코드는 그대로 목록에 남아 있어야 함');
  assert.equal(itemAfter.request_type, originalRequest.request_type);
  assert.equal(itemAfter.target_schedule_id, originalRequest.target_schedule_id);
  assert.equal(itemAfter.requested_by, originalRequest.requested_by);
  assert.equal(itemAfter.created_at, originalRequest.created_at);
});
