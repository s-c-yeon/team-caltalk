const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');
const env = require('../../src/config/env');

const TEAM_NAME = 'BE-06 Test Team';
const OTHER_TEAM_NAME = 'BE-06 Other Team';

let teamId;
let otherTeamId;
let memberUserId;
let outsiderUserId;
let memberToken;
let outsiderToken;

function tokenFor(userId, email) {
  return jwt.sign({ sub: userId, email }, env.jwtSecret, { expiresIn: '1h' });
}

test.before(async () => {
  const passwordHash = await bcrypt.hash('password123', 4);

  const member = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be06-member@caltalk.local', passwordHash]
  );
  memberUserId = member.rows[0].id;

  const outsider = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be06-outsider@caltalk.local', passwordHash]
  );
  outsiderUserId = outsider.rows[0].id;

  const team = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [TEAM_NAME, 'BE06TEST']
  );
  teamId = team.rows[0].id;

  const otherTeam = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [OTHER_TEAM_NAME, 'BE06OTHR']
  );
  otherTeamId = otherTeam.rows[0].id;

  await pool.query(
    `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')`,
    [teamId, memberUserId]
  );

  await pool.query(
    `INSERT INTO chat_messages (team_id, chat_date, sender_id, message_type, content, created_at)
     VALUES
       ($1, '2026-07-15', $2, 'general', '첫 번째 메시지', '2026-07-15T09:00:00Z'),
       ($1, '2026-07-15', $2, 'change_request', '두 번째 메시지(변경요청)', '2026-07-15T10:00:00Z'),
       ($1, '2026-07-14', $2, 'general', '전날 메시지(범위 밖)', '2026-07-14T09:00:00Z'),
       ($3, '2026-07-15', $2, 'general', '다른 팀 메시지', '2026-07-15T09:00:00Z')`,
    [teamId, memberUserId, otherTeamId]
  );

  memberToken = tokenFor(memberUserId, 'be06-member@caltalk.local');
  outsiderToken = tokenFor(outsiderUserId, 'be06-outsider@caltalk.local');
});

test.after(async () => {
  await pool.query('DELETE FROM chat_messages WHERE team_id = ANY($1)', [[teamId, otherTeamId]]);
  await pool.query('DELETE FROM team_members WHERE team_id = ANY($1)', [[teamId, otherTeamId]]);
  await pool.query('DELETE FROM teams WHERE id = ANY($1)', [[teamId, otherTeamId]]);
  await pool.query('DELETE FROM users WHERE id = ANY($1)', [[memberUserId, outsiderUserId]]);
  await pool.end();
});

test('date=2026-07-15 조회 시 해당 날짜(서버 UTC 자정 기준) 메시지만 시간순으로 반환됨(BR-06)', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/chat-messages`)
    .query({ date: '2026-07-15' })
    .set('Authorization', `Bearer ${memberToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 2);
  assert.deepEqual(
    res.body.map((m) => m.content),
    ['첫 번째 메시지', '두 번째 메시지(변경요청)']
  );
  assert.ok(res.body.every((m) => m.team_id === teamId));
});

test('type 필드가 general/change_request로 정확히 매핑되어 반환됨', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/chat-messages`)
    .query({ date: '2026-07-15' })
    .set('Authorization', `Bearer ${memberToken}`);

  assert.deepEqual(
    res.body.map((m) => m.type),
    ['general', 'change_request']
  );
});

test('미소속 팀 조회 시 403 반환됨(BR-02)', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/chat-messages`)
    .query({ date: '2026-07-15' })
    .set('Authorization', `Bearer ${outsiderToken}`);

  assert.equal(res.status, 403);
});

test('인증 토큰 없이 요청 시 401 반환됨', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/chat-messages`)
    .query({ date: '2026-07-15' });

  assert.equal(res.status, 401);
});

test('date 파라미터가 누락되면 400 반환됨', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/chat-messages`)
    .set('Authorization', `Bearer ${memberToken}`);

  assert.equal(res.status, 400);
});

test("type='general' 메시지 전송 시 201과 저장된 메시지가 반환되고 schedule_change_request는 null임", async () => {
  const expectedChatDate = new Date().toISOString().slice(0, 10);
  const res = await request(app)
    .post(`/api/teams/${teamId}/chat-messages`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ type: 'general', content: '오늘 회의 몇 시인가요?' });

  assert.equal(res.status, 201);
  assert.equal(res.body.chat_message.type, 'general');
  assert.equal(res.body.chat_message.content, '오늘 회의 몇 시인가요?');
  assert.equal(res.body.chat_message.chat_date, expectedChatDate);
  assert.equal(res.body.schedule_change_request, null);
});

test("type='change_request' 메시지도 저장은 되지만, 이 이슈(BE-06) 범위에서는 schedule_change_request 연동 없이 null로 반환됨(BE-07에서 연동 예정)", async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/chat-messages`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ type: 'change_request', content: '회의를 1시간 뒤로 옮겨주세요.' });

  assert.equal(res.status, 201);
  assert.equal(res.body.chat_message.type, 'change_request');
  assert.equal(res.body.schedule_change_request, null);
});

test('본문이 빈 문자열이면 400 반환됨', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/chat-messages`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ type: 'general', content: '' });

  assert.equal(res.status, 400);
});

test('본문이 501자 이상이면 400 반환됨', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/chat-messages`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ type: 'general', content: 'a'.repeat(501) });

  assert.equal(res.status, 400);
});

test('type이 유효하지 않으면 400 반환됨', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/chat-messages`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ type: 'announcement', content: '유효하지 않은 타입' });

  assert.equal(res.status, 400);
});

test('미소속 팀에 메시지 전송 시도 시 403 반환됨(BR-02)', async () => {
  const res = await request(app)
    .post(`/api/teams/${teamId}/chat-messages`)
    .set('Authorization', `Bearer ${outsiderToken}`)
    .send({ type: 'general', content: '미소속 팀 전송 시도' });

  assert.equal(res.status, 403);
});
