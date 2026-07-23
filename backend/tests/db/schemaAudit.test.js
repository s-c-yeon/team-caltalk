const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../../src/db/pool');

test.after(async () => {
  await pool.end();
});

async function getForeignKeys(table) {
  const { rows } = await pool.query(
    `SELECT kcu.column_name, ccu.table_name AS foreign_table
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
     JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
     WHERE tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY'`,
    [table]
  );
  return Object.fromEntries(rows.map((r) => [r.column_name, r.foreign_table]));
}

async function getIndexDefs(table) {
  const { rows } = await pool.query('SELECT indexdef FROM pg_indexes WHERE tablename = $1', [table]);
  return rows.map((r) => r.indexdef);
}

test('DB-06: 6개 테이블(users/teams/team_members/schedules/chat_messages/schedule_change_requests)의 FK가 모두 존재함', async () => {
  assert.deepEqual(await getForeignKeys('users'), {});
  assert.deepEqual(await getForeignKeys('teams'), {});
  assert.deepEqual(await getForeignKeys('team_members'), { team_id: 'teams', user_id: 'users' });
  assert.deepEqual(await getForeignKeys('schedules'), {
    team_id: 'teams',
    target_member_id: 'users',
    created_by: 'users',
  });
  assert.deepEqual(await getForeignKeys('chat_messages'), { team_id: 'teams', sender_id: 'users' });
  assert.deepEqual(await getForeignKeys('schedule_change_requests'), {
    chat_message_id: 'chat_messages',
    requested_by: 'users',
    target_schedule_id: 'schedules',
  });
});

test('DB-06: 팀에 종속된 테이블(team_members/schedules/chat_messages)에 team_id 인덱스가 존재함', async () => {
  const teamMembersIdx = await getIndexDefs('team_members');
  const schedulesIdx = await getIndexDefs('schedules');
  const chatMessagesIdx = await getIndexDefs('chat_messages');

  assert.ok(teamMembersIdx.some((d) => d.includes('(team_id')));
  assert.ok(schedulesIdx.some((d) => d.includes('(team_id)')));
  assert.ok(chatMessagesIdx.some((d) => d.includes('(team_id, chat_date)')));
});

test('DB-06: schedule_change_requests는 team_id 컬럼이 없지만 chat_message_id UNIQUE 인덱스로 팀 스코프 경로가 인덱싱됨', async () => {
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'schedule_change_requests' AND column_name = 'team_id'`
  );
  assert.equal(rows.length, 0, 'schedule_change_requests에는 team_id 컬럼이 없어야 함(팀 스코프는 chat_messages를 통해서만 도달)');

  const idx = await getIndexDefs('schedule_change_requests');
  assert.ok(idx.some((d) => d.includes('(chat_message_id)')));
});

test('DB-06: "팀+날짜 채팅 이력 조회" 쿼리가 idx_chat_messages_team_id_chat_date를 사용함', async () => {
  const client = await pool.connect();
  try {
    await client.query('SET enable_seqscan = off');
    const { rows } = await client.query(
      'EXPLAIN SELECT * FROM chat_messages WHERE team_id = 1 AND chat_date = CURRENT_DATE'
    );
    const plan = rows.map((r) => r['QUERY PLAN']).join('\n');

    assert.ok(plan.includes('idx_chat_messages_team_id_chat_date'), plan);
  } finally {
    await client.query('RESET enable_seqscan');
    client.release();
  }
});

test('DB-06: "팀 월간 일정 조회" 쿼리가 idx_schedules_team_id를 사용함', async () => {
  const client = await pool.connect();
  try {
    await client.query('SET enable_seqscan = off');
    const { rows } = await client.query(
      `EXPLAIN SELECT * FROM schedules WHERE team_id = 1 AND start_at >= '2026-08-01' AND start_at < '2026-09-01'`
    );
    const plan = rows.map((r) => r['QUERY PLAN']).join('\n');

    assert.ok(plan.includes('idx_schedules_team_id'), plan);
  } finally {
    await client.query('RESET enable_seqscan');
    client.release();
  }
});

test('DB-06: 파티셔닝된 테이블이 존재하지 않음 (MVP 범위 외 스케일링 기법 미적용)', async () => {
  const { rows } = await pool.query("SELECT relname FROM pg_class WHERE relkind = 'p'");
  assert.equal(rows.length, 0);
});
