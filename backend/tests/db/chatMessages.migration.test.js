const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../../src/db/pool');

test.after(async () => {
  await pool.end();
});

test('chat_messages 테이블에 필수 컬럼이 존재함 (DB-04)', async () => {
  const { rows } = await pool.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'chat_messages'`
  );
  const columns = Object.fromEntries(rows.map((r) => [r.column_name, r]));

  assert.ok(columns.id, 'id 컬럼 존재');
  assert.equal(columns.team_id.is_nullable, 'NO');
  assert.equal(columns.chat_date.data_type, 'date');
  assert.equal(columns.chat_date.is_nullable, 'NO');
  assert.ok(columns.sender_id, 'sender_id 컬럼 존재');
  assert.ok(columns.message_type, 'message_type 컬럼 존재');
  assert.ok(columns.content, 'content 컬럼 존재');
  assert.ok(columns.created_at, 'created_at 컬럼 존재');
});

test('content는 1자 이상 500자 이하 CHECK 제약을 가짐', async () => {
  await assert.rejects(
    pool.query(
      "INSERT INTO chat_messages (team_id, chat_date, sender_id, message_type, content) VALUES (1, CURRENT_DATE, 1, 'general', '')"
    )
  );

  await assert.rejects(
    pool.query(
      "INSERT INTO chat_messages (team_id, chat_date, sender_id, message_type, content) VALUES (1, CURRENT_DATE, 1, 'general', $1)",
      ['a'.repeat(501)]
    )
  );
});

test('message_type은 general 또는 change_request만 허용함', async () => {
  await assert.rejects(
    pool.query(
      "INSERT INTO chat_messages (team_id, chat_date, sender_id, message_type, content) VALUES (1, CURRENT_DATE, 1, 'invalid_type', '내용')"
    )
  );
});

test('team_id, sender_id는 각각 teams, users를 참조하는 FK임', async () => {
  const { rows } = await pool.query(
    `SELECT
       tc.constraint_name,
       kcu.column_name,
       ccu.table_name AS foreign_table_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
     JOIN information_schema.constraint_column_usage ccu
       ON tc.constraint_name = ccu.constraint_name
     WHERE tc.table_name = 'chat_messages' AND tc.constraint_type = 'FOREIGN KEY'`
  );
  const fkByColumn = Object.fromEntries(rows.map((r) => [r.column_name, r.foreign_table_name]));

  assert.equal(fkByColumn.team_id, 'teams');
  assert.equal(fkByColumn.sender_id, 'users');
});

test('(team_id, chat_date) 복합 인덱스가 존재함', async () => {
  const { rows } = await pool.query(
    `SELECT indexdef FROM pg_indexes WHERE tablename = 'chat_messages'`
  );
  const hasCompositeIndex = rows.some(
    (r) => r.indexdef.includes('(team_id, chat_date)')
  );

  assert.ok(hasCompositeIndex, '(team_id, chat_date) 인덱스가 존재해야 함');
});

test('chat_rooms 등 별도 채팅방 테이블이 생성되지 않음', async () => {
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'chat_rooms'`
  );

  assert.equal(rows.length, 0, 'chat_rooms 테이블이 존재하면 안 됨');
});
