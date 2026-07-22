import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signup(email, password);
        await login(email, password);
      } else {
        await login(email, password);
      }
      navigate('/calendar', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <h1>Team CalTalk</h1>
      <form onSubmit={handleSubmit}>
        <label>
          이메일
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {mode === 'signup' ? '회원가입' : '로그인'}
        </button>
      </form>
      <button
        type="button"
        className="link-button"
        onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
      >
        {mode === 'signup' ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
      </button>
    </div>
  );
}
