const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/db/pool');
const env = require('../../src/config/env');

const TEAM_NAME = 'BE-09 Test Team';

let teamId;
let leaderUserId;
let leaderToken;

function tokenFor(userId, email) {
  return jwt.sign({ sub: userId, email }, env.jwtSecret, { expiresIn: '1h' });
}

test.before(async () => {
  const passwordHash = await bcrypt.hash('password123', 4);

  const leader = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be09-leader@caltalk.local', passwordHash]
  );
  leaderUserId = leader.rows[0].id;

  const team = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [TEAM_NAME, 'BE09TEST']
  );
  teamId = team.rows[0].id;

  await pool.query(
    `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'leader')`,
    [teamId, leaderUserId]
  );

  await pool.query(
    `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, created_by)
     VALUES
       ($1, '경계 안쪽 일정(23:30 UTC)', '2026-07-15T23:30:00Z', '2026-07-15T23:45:00Z', 'all', $2),
       ($1, '경계 밖 일정(자정 정각)', '2026-07-16T00:00:00Z', '2026-07-16T00:15:00Z', 'all', $2)`,
    [teamId, leaderUserId]
  );

  await pool.query(
    `INSERT INTO chat_messages (team_id, chat_date, sender_id, message_type, content, created_at)
     VALUES
       ($1, '2026-07-15', $2, 'change_request', '경계 안쪽 메시지', '2026-07-15T23:30:00Z'),
       ($1, '2026-07-16', $2, 'general', '경계 밖 메시지', '2026-07-16T00:00:00Z')`,
    [teamId, leaderUserId]
  );

  leaderToken = tokenFor(leaderUserId, 'be09-leader@caltalk.local');
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
  await pool.query('DELETE FROM users WHERE id = $1', [leaderUserId]);
  await pool.end();
});

test('캘린더(day)와 채팅 이력이 동일한 date에 대해 동일한 UTC 자정 기준 하루 범위를 사용함(BR-07)', async () => {
  const scheduleRes = await request(app)
    .get(`/api/teams/${teamId}/schedules`)
    .query({ view: 'day', date: '2026-07-15' })
    .set('Authorization', `Bearer ${leaderToken}`);
  const chatRes = await request(app)
    .get(`/api/teams/${teamId}/chat-messages`)
    .query({ date: '2026-07-15' })
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.equal(scheduleRes.status, 200);
  assert.equal(chatRes.status, 200);

  assert.deepEqual(
    scheduleRes.body.map((s) => s.title),
    ['경계 안쪽 일정(23:30 UTC)']
  );
  assert.deepEqual(
    chatRes.body.map((m) => m.content),
    ['경계 안쪽 메시지']
  );
});

test('자정 정각(UTC) 경계는 다음 날짜 조회에서만 나타남(두 API 모두 동일한 경계 처리)', async () => {
  const scheduleRes = await request(app)
    .get(`/api/teams/${teamId}/schedules`)
    .query({ view: 'day', date: '2026-07-16' })
    .set('Authorization', `Bearer ${leaderToken}`);
  const chatRes = await request(app)
    .get(`/api/teams/${teamId}/chat-messages`)
    .query({ date: '2026-07-16' })
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.deepEqual(
    scheduleRes.body.map((s) => s.title),
    ['경계 밖 일정(자정 정각)']
  );
  assert.deepEqual(
    chatRes.body.map((m) => m.content),
    ['경계 밖 메시지']
  );
});

test('채팅 응답의 각 메시지에 type 필드가 포함되어 프론트가 별도 호출 없이 뱃지를 표시할 수 있음', async () => {
  const res = await request(app)
    .get(`/api/teams/${teamId}/chat-messages`)
    .query({ date: '2026-07-15' })
    .set('Authorization', `Bearer ${leaderToken}`);

  assert.ok(res.body.length > 0);
  for (const message of res.body) {
    assert.ok('type' in message, 'type 필드가 응답에 포함되어야 함');
    assert.ok(['general', 'change_request'].includes(message.type));
  }
});

test('별도의 캘린더-채팅 통합 엔드포인트가 추가되지 않았음(app.js 라우트 마운트 목록 확인)', () => {
  const appSource = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'app.js'), 'utf8');
  const mountPaths = [...appSource.matchAll(/app\.use\('([^']+)'/g)].map((m) => m[1]);

  assert.deepEqual(mountPaths, [
    '/api/auth',
    '/api/teams/:teamId/schedules',
    '/api/teams/:teamId/chat-messages',
    '/api/teams/:teamId/schedule-change-requests',
    '/api/teams',
  ]);
  assert.ok(!mountPaths.some((p) => p.includes('calendar')));
});
