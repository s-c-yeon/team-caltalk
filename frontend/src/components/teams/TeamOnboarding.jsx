import { useState } from 'react';
import { useTeams } from '../../hooks/useTeams';

export function TeamOnboarding() {
  const { createTeam, joinTeam } = useTeams();
  const [teamName, setTeamName] = useState('');
  const [joinTeamId, setJoinTeamId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await createTeam(teamName);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError(null);
    try {
      await joinTeam(Number(joinTeamId), inviteCode);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="team-onboarding">
      <p>아직 소속된 팀이 없습니다. 팀을 생성하거나 초대 코드로 가입하세요.</p>
      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleCreate}>
        <h2>팀 생성</h2>
        <label>
          팀 이름
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
        </label>
        <button type="submit">팀 생성 (팀장으로 시작)</button>
      </form>

      <form onSubmit={handleJoin}>
        <h2>초대 코드로 가입</h2>
        <label>
          팀 ID
          <input value={joinTeamId} onChange={(e) => setJoinTeamId(e.target.value)} required />
        </label>
        <label>
          초대 코드
          <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
        </label>
        <button type="submit">팀 가입</button>
      </form>
    </div>
  );
}
