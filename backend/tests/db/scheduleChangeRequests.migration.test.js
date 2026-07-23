const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../../src/db/pool');

async function createChatMessage() {
  const { rows } = await pool.query(
    `INSERT INTO chat_messages (team_id, chat_date, sender_id, message_type, content)
     VALUES (1, CURRENT_DATE, 1, 'change_request', '테스트 변경 요청 메시지')
     RETURNING id`
  );
  return rows[0].id;
}

test.after(async () => {
  await pool.end();
});

test('schedule_change_requests 테이블에 필수 컬럼이 존재함 (DB-05)', async () => {
  const { rows } = await pool.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'schedule_change_requests'`
  );
  const columns = Object.fromEntries(rows.map((r) => [r.column_name, r]));

  assert.ok(columns.id, 'id 컬럼 존재');
  assert.equal(columns.chat_message_id.is_nullable, 'NO');
  assert.equal(columns.requested_by.is_nullable, 'NO');
  assert.equal(columns.request_type.is_nullable, 'NO');
  assert.equal(columns.target_schedule_id.is_nullable, 'YES');
  assert.ok(columns.created_at, 'created_at 컬럼 존재');
});

test('status/approved/rejected 등 상태 필드나 처리 이력 컬럼이 존재하지 않음 (§1.2, §10.2)', async () => {
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'schedule_change_requests'`
  );
  const columnNames = rows.map((r) => r.column_name);

  for (const forbidden of ['status', 'approved', 'rejected', 'processed_at', 'processed_by']) {
    assert.ok(!columnNames.includes(forbidden), `${forbidden} 컬럼이 존재하면 안 됨`);
  }
});

test('chat_rooms와 마찬가지로 처리 이력 전용 테이블이 별도로 생성되지 않음', async () => {
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('schedule_change_request_history', 'schedule_change_request_logs')`
  );

  assert.equal(rows.length, 0);
});

test('request_type은 create/update/cancel만 허용함', async () => {
  const chatMessageId = await createChatMessage();

  await assert.rejects(
    pool.query(
      `INSERT INTO schedule_change_requests (chat_message_id, requested_by, request_type)
       VALUES ($1, 1, 'approve')`,
      [chatMessageId]
    )
  );
});

test('chat_message_id는 UNIQUE 제약이 걸려 메시지 1건당 최대 1개의 요청만 존재함', async () => {
  const chatMessageId = await createChatMessage();

  await pool.query(
    `INSERT INTO schedule_change_requests (chat_message_id, requested_by, request_type)
     VALUES ($1, 1, 'create')`,
    [chatMessageId]
  );

  await assert.rejects(
    pool.query(
      `INSERT INTO schedule_change_requests (chat_message_id, requested_by, request_type)
       VALUES ($1, 1, 'create')`,
      [chatMessageId]
    ),
    '동일 chat_message_id로 두 번째 요청 INSERT는 UNIQUE 위반으로 거부되어야 함'
  );
});

test('chat_message_id, requested_by, target_schedule_id는 각각 올바른 테이블을 참조하는 FK임', async () => {
  const { rows } = await pool.query(
    `SELECT
       kcu.column_name,
       ccu.table_name AS foreign_table_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
     JOIN information_schema.constraint_column_usage ccu
       ON tc.constraint_name = ccu.constraint_name
     WHERE tc.table_name = 'schedule_change_requests' AND tc.constraint_type = 'FOREIGN KEY'`
  );
  const fkByColumn = Object.fromEntries(rows.map((r) => [r.column_name, r.foreign_table_name]));

  assert.equal(fkByColumn.chat_message_id, 'chat_messages');
  assert.equal(fkByColumn.requested_by, 'users');
  assert.equal(fkByColumn.target_schedule_id, 'schedules');
});
