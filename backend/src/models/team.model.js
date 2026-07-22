const pool = require('../db/pool');

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM teams WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create(name, inviteCode) {
  const { rows } = await pool.query(
    'INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING id, name, invite_code, created_at',
    [name, inviteCode]
  );
  return rows[0];
}

module.exports = { findById, create };
