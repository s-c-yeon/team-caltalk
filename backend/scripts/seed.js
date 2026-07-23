const bcrypt = require('bcrypt');
const pool = require('../src/db/pool');

const BCRYPT_ROUNDS = 10;
const SEED_INVITE_CODE = 'SEED0001';
const SEED_EMAILS = ['seed-leader@caltalk.local', 'seed-member1@caltalk.local', 'seed-member2@caltalk.local'];

async function clearExistingSeed(client) {
  const { rows: teamRows } = await client.query('SELECT id FROM teams WHERE invite_code = $1', [
    SEED_INVITE_CODE,
  ]);
  const teamId = teamRows[0]?.id;

  if (teamId) {
    await client.query(
      `DELETE FROM schedule_change_requests
       WHERE chat_message_id IN (SELECT id FROM chat_messages WHERE team_id = $1)`,
      [teamId]
    );
    await client.query('DELETE FROM chat_messages WHERE team_id = $1', [teamId]);
    await client.query('DELETE FROM schedules WHERE team_id = $1', [teamId]);
    await client.query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
    await client.query('DELETE FROM teams WHERE id = $1', [teamId]);
  }

  const { rows: userRows } = await client.query('SELECT id FROM users WHERE email = ANY($1)', [
    SEED_EMAILS,
  ]);
  const userIds = userRows.map((r) => r.id);
  if (userIds.length > 0) {
    await client.query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
  }
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await clearExistingSeed(client);

    const passwordHash = await bcrypt.hash('password123', BCRYPT_ROUNDS);

    const {
      rows: [leader],
    } = await client.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id', [
      'seed-leader@caltalk.local',
      passwordHash,
    ]);
    const {
      rows: [member1],
    } = await client.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id', [
      'seed-member1@caltalk.local',
      passwordHash,
    ]);
    const {
      rows: [member2],
    } = await client.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id', [
      'seed-member2@caltalk.local',
      passwordHash,
    ]);

    const {
      rows: [team],
    } = await client.query('INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id', [
      '개발팀',
      SEED_INVITE_CODE,
    ]);

    await client.query('INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)', [
      team.id,
      leader.id,
      'leader',
    ]);
    await client.query('INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)', [
      team.id,
      member1.id,
      'member',
    ]);
    await client.query('INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)', [
      team.id,
      member2.id,
      'member',
    ]);

    const {
      rows: [schedule],
    } = await client.query(
      `INSERT INTO schedules (team_id, title, start_at, end_at, target_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [team.id, '주간 팀 회의', '2026-08-03T01:00:00Z', '2026-08-03T02:00:00Z', 'all', leader.id]
    );

    await client.query(
      `INSERT INTO chat_messages (team_id, chat_date, sender_id, message_type, content)
       VALUES ($1, CURRENT_DATE, $2, 'general', $3)`,
      [team.id, member1.id, '오늘 회의 몇 시에 하나요?']
    );

    const {
      rows: [changeRequestMessage],
    } = await client.query(
      `INSERT INTO chat_messages (team_id, chat_date, sender_id, message_type, content)
       VALUES ($1, CURRENT_DATE, $2, 'change_request', $3) RETURNING id`,
      [team.id, member2.id, '회의 시간을 1시간 뒤로 옮겨주세요.']
    );

    await client.query(
      `INSERT INTO schedule_change_requests (chat_message_id, requested_by, request_type, target_schedule_id)
       VALUES ($1, $2, $3, $4)`,
      [changeRequestMessage.id, member2.id, 'update', schedule.id]
    );

    await client.query('COMMIT');
    console.log('시드 데이터 삽입 완료');
    console.log(`  팀: 개발팀 (invite_code=${SEED_INVITE_CODE})`);
    console.log(
      '  계정(비밀번호 공통 password123): seed-leader@caltalk.local, seed-member1@caltalk.local, seed-member2@caltalk.local'
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
