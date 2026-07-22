const test = require('node:test');
const assert = require('node:assert/strict');
const requireRole = require('../../src/middlewares/requireRole.middleware');

function makeRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

test('팀원(role=member) 계정으로 requireRole("leader") 호출 시 403 반환', () => {
  const req = { teamMembership: { role: 'member' } };
  const res = makeRes();
  let calledNext = false;

  requireRole('leader')(req, res, (err) => {
    calledNext = true;
    assert.ok(err);
    assert.equal(err.status, 403);
  });

  assert.equal(calledNext, true);
});

test('팀장(role=leader) 계정으로 requireRole("leader") 호출 시 통과', () => {
  const req = { teamMembership: { role: 'leader' } };
  const res = makeRes();
  let nextArg = 'not-called';

  requireRole('leader')(req, res, (err) => {
    nextArg = err;
  });

  assert.equal(nextArg, undefined);
});
