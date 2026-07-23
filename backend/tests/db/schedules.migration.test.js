const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../../src/db/pool');

test.after(async () => {
  await pool.end();
});

test('schedules 테이블에 필수 컬럼이 존재함 (DB-03)', async () => {
  const { rows } = await pool.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'schedules'`
  );
  const columns = Object.fromEntries(rows.map((r) => [r.column_name, r]));

  assert.ok(columns.id, 'id 컬럼 존재');
  assert.equal(columns.team_id.is_nullable, 'NO');
  assert.equal(columns.title.data_type, 'text');
  assert.equal(columns.start_at.data_type, 'timestamp with time zone');
  assert.equal(columns.end_at.data_type, 'timestamp with time zone');
  assert.equal(columns.target_type.is_nullable, 'NO');
  assert.equal(columns.target_member_id.is_nullable, 'YES');
  assert.equal(columns.created_by.is_nullable, 'NO');
  assert.ok(columns.created_at, 'created_at 컬럼 존재');
  assert.ok(columns.updated_at, 'updated_at 컬럼 존재');
});

test('별도의 버전/락 컬럼(version 등)이 존재하지 않음 (BR-10 Last-Write-Wins)', async () => {
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'schedules'`
  );
  const columnNames = rows.map((r) => r.column_name);

  assert.ok(!columnNames.includes('version'));
  assert.ok(!columnNames.includes('lock_version'));
});

test('title은 1자 이상 100자 이하이며 공백만으로는 구성될 수 없음', async () => {
  const base = {
    team_id: 1,
    start_at: '2026-08-01T00:00:00Z',
    end_at: '2026-08-01T01:00:00Z',
    target_type: 'all',
    created_by: 1,
  };

  await assert.rejects(
    pool.query(
      `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [base.team_id, '', base.start_at, base.end_at, base.target_type, base.created_by]
    ),
    '빈 문자열 제목은 거부되어야 함'
  );

  await assert.rejects(
    pool.query(
      `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [base.team_id, '   ', base.start_at, base.end_at, base.target_type, base.created_by]
    ),
    '공백만으로 구성된 제목은 거부되어야 함'
  );

  await assert.rejects(
    pool.query(
      `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [base.team_id, 'a'.repeat(101), base.start_at, base.end_at, base.target_type, base.created_by]
    ),
    '101자 이상 제목은 거부되어야 함'
  );
});

test('start_at은 end_at보다 앞서야 함', async () => {
  await assert.rejects(
    pool.query(
      `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, created_by)
       VALUES (1, '회의', '2026-08-01T02:00:00Z', '2026-08-01T01:00:00Z', 'all', 1)`
    ),
    'start_at >= end_at은 거부되어야 함'
  );

  await assert.rejects(
    pool.query(
      `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, created_by)
       VALUES (1, '회의', '2026-08-01T01:00:00Z', '2026-08-01T01:00:00Z', 'all', 1)`
    ),
    'start_at == end_at은 거부되어야 함'
  );
});

test('target_type은 all 또는 member만 허용함', async () => {
  await assert.rejects(
    pool.query(
      `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, created_by)
       VALUES (1, '회의', '2026-08-01T00:00:00Z', '2026-08-01T01:00:00Z', 'everyone', 1)`
    )
  );
});

test('target_type=all이면 target_member_id는 반드시 NULL이어야 함', async () => {
  await assert.rejects(
    pool.query(
      `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, target_member_id, created_by)
       VALUES (1, '회의', '2026-08-01T00:00:00Z', '2026-08-01T01:00:00Z', 'all', 1, 1)`
    )
  );
});

test('target_type=member이면 target_member_id는 반드시 존재해야 함', async () => {
  await assert.rejects(
    pool.query(
      `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, created_by)
       VALUES (1, '회의', '2026-08-01T00:00:00Z', '2026-08-01T01:00:00Z', 'member', 1)`
    )
  );
});

test('team_id, target_member_id, created_by는 각각 teams/users를 참조하는 FK임', async () => {
  const { rows } = await pool.query(
    `SELECT
       kcu.column_name,
       ccu.table_name AS foreign_table_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
     JOIN information_schema.constraint_column_usage ccu
       ON tc.constraint_name = ccu.constraint_name
     WHERE tc.table_name = 'schedules' AND tc.constraint_type = 'FOREIGN KEY'`
  );
  const fkByColumn = Object.fromEntries(rows.map((r) => [r.column_name, r.foreign_table_name]));

  assert.equal(fkByColumn.team_id, 'teams');
  assert.equal(fkByColumn.target_member_id, 'users');
  assert.equal(fkByColumn.created_by, 'users');
});

test('team_id에 인덱스가 존재함', async () => {
  const { rows } = await pool.query(
    `SELECT indexdef FROM pg_indexes WHERE tablename = 'schedules'`
  );
  const hasTeamIdIndex = rows.some((r) => r.indexdef.includes('(team_id)'));

  assert.ok(hasTeamIdIndex, 'team_id 인덱스가 존재해야 함');
});
