const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const pool = require('../../src/db/pool');
const chatMessagesService = require('../../src/services/chatMessages.service');

const TEAM_NAME = 'BE-07 Test Team';

let teamId;
let userId;

test.before(async () => {
  const passwordHash = await bcrypt.hash('password123', 4);
  const user = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id`,
    ['be07-member@caltalk.local', passwordHash]
  );
  userId = user.rows[0].id;

  const team = await pool.query(
    `INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id`,
    [TEAM_NAME, 'BE07TEST']
  );
  teamId = team.rows[0].id;

  await pool.query(`INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')`, [
    teamId,
    userId,
  ]);
});

test.after(async () => {
  await pool.query(
    `DELETE FROM schedule_change_requests
     WHERE chat_message_id IN (SELECT id FROM chat_messages WHERE team_id = $1)`,
    [teamId]
  );
  await pool.query('DELETE FROM chat_messages WHERE team_id = $1', [teamId]);
  await pool.query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
  await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  await pool.end();
});

test("type='change_request' 전송 시 chat_messages 1건 + schedule_change_requests 1건이 1:1 FK로 함께 생성됨(§4.1 최우선)", async () => {
  const result = await chatMessagesService.sendMessage(teamId, userId, {
    type: 'change_request',
    content: '회의를 내일로 옮겨주세요.',
    request_type: 'create',
  });

  assert.ok(result.schedule_change_request);
  assert.equal(result.schedule_change_request.chat_message_id, result.chat_message.id);

  const { rows } = await pool.query(
    'SELECT count(*) AS count FROM schedule_change_requests WHERE chat_message_id = $1',
    [result.chat_message.id]
  );
  assert.equal(Number(rows[0].count), 1);
});

test("type='general' 메시지는 본문에 '일정','변경' 단어가 포함되어도 요청 레코드를 생성하지 않음(BR-05, SC-06 7단계)", async () => {
  const result = await chatMessagesService.sendMessage(teamId, userId, {
    type: 'general',
    content: '저도 그날 일정 변경 없이 참석 가능합니다.',
  });

  assert.equal(result.schedule_change_request, null);

  const { rows } = await pool.query(
    'SELECT count(*) AS count FROM schedule_change_requests WHERE chat_message_id = $1',
    [result.chat_message.id]
  );
  assert.equal(Number(rows[0].count), 0);
});

test('동일 채팅 메시지에 요청이 2건 이상 생성되는 경로가 없음(chat_message_id UNIQUE 제약으로 1:1 강제)', async () => {
  const result = await chatMessagesService.sendMessage(teamId, userId, {
    type: 'change_request',
    content: '다른 변경 요청',
    request_type: 'create',
  });

  await assert.rejects(
    pool.query(
      `INSERT INTO schedule_change_requests (chat_message_id, requested_by, request_type) VALUES ($1, $2, 'create')`,
      [result.chat_message.id, userId]
    ),
    '동일 chat_message_id로 두 번째 요청을 생성하면 UNIQUE 제약 위반으로 거부되어야 함'
  );
});

test('schedule_change_requests 테이블에 상태(status/approved/rejected) 컬럼이 존재하지 않음', async () => {
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'schedule_change_requests'`
  );
  const columnNames = rows.map((r) => r.column_name);
  assert.ok(!columnNames.includes('status'));
  assert.ok(!columnNames.includes('approved'));
  assert.ok(!columnNames.includes('rejected'));
});

test("request_type이 'update'인데 target_schedule_id가 없으면 400 반환됨(요청 생성 실패)", async () => {
  await assert.rejects(
    chatMessagesService.sendMessage(teamId, userId, {
      type: 'change_request',
      content: '일정을 수정해주세요.',
      request_type: 'update',
    }),
    (err) => err.status === 400
  );

  const { rows } = await pool.query(
    `SELECT count(*) AS count FROM chat_messages WHERE team_id = $1 AND content = '일정을 수정해주세요.'`,
    [teamId]
  );
  assert.equal(
    Number(rows[0].count),
    0,
    '검증 실패 시 트랜잭션이 롤백되어 chat_messages도 생성되지 않아야 함'
  );
});
