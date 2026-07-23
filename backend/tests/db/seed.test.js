const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const pool = require('../../src/db/pool');

const SEED_SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'seed.js');

function runSeedScript() {
  const result = spawnSync(process.execPath, [SEED_SCRIPT], { encoding: 'utf8' });
  return result;
}

test.after(async () => {
  await pool.end();
});

test('DB-07: 시드 스크립트를 두 번 연속 실행해도 오류 없이 idempotent하게 동작함', () => {
  const first = runSeedScript();
  assert.equal(first.status, 0, first.stderr);

  const second = runSeedScript();
  assert.equal(second.status, 0, second.stderr);
});

test('DB-07: 시드 데이터가 완료 조건(팀장1·팀원2·일정1·채팅 일반1/변경요청1·1:1 연결)을 충족함', async () => {
  const { rows } = await pool.query(
    `SELECT
       (SELECT count(*) FROM users WHERE email LIKE 'seed-%@caltalk.local') AS seed_users,
       (SELECT count(*) FROM team_members tm JOIN teams t ON t.id = tm.team_id
          WHERE t.invite_code = 'SEED0001' AND tm.role = 'leader') AS leaders,
       (SELECT count(*) FROM team_members tm JOIN teams t ON t.id = tm.team_id
          WHERE t.invite_code = 'SEED0001' AND tm.role = 'member') AS members,
       (SELECT count(*) FROM schedules s JOIN teams t ON t.id = s.team_id
          WHERE t.invite_code = 'SEED0001') AS schedules,
       (SELECT count(*) FROM chat_messages cm JOIN teams t ON t.id = cm.team_id
          WHERE t.invite_code = 'SEED0001' AND cm.message_type = 'general') AS general_msgs,
       (SELECT count(*) FROM chat_messages cm JOIN teams t ON t.id = cm.team_id
          WHERE t.invite_code = 'SEED0001' AND cm.message_type = 'change_request') AS change_request_msgs,
       (SELECT count(*) FROM schedule_change_requests scr
          JOIN chat_messages cm ON cm.id = scr.chat_message_id
          JOIN teams t ON t.id = cm.team_id
          WHERE t.invite_code = 'SEED0001') AS scrs`
  );
  const row = rows[0];

  assert.equal(Number(row.seed_users), 3);
  assert.equal(Number(row.leaders), 1);
  assert.ok(Number(row.members) >= 2);
  assert.ok(Number(row.schedules) >= 1);
  assert.ok(Number(row.general_msgs) >= 1);
  assert.ok(Number(row.change_request_msgs) >= 1);
  assert.equal(Number(row.scrs), Number(row.change_request_msgs), 'change_request 메시지마다 schedule_change_requests가 1:1로 존재해야 함');
});

test('DB-07: 시드 계정의 비밀번호는 평문이 아닌 bcrypt 해시로 저장됨', async () => {
  const { rows } = await pool.query(
    "SELECT password_hash FROM users WHERE email = 'seed-leader@caltalk.local'"
  );

  assert.ok(rows[0], '시드 리더 계정이 존재해야 함');
  assert.notEqual(rows[0].password_hash, 'password123');
  assert.match(rows[0].password_hash, /^\$2[aby]\$\d{2}\$/, 'bcrypt 해시 형식이어야 함');
});
