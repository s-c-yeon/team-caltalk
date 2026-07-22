import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="app-layout">
      <header className="app-header">
        <span className="app-title">Team CalTalk</span>
        {isAuthenticated && (
          <nav className="app-nav">
            <Link to="/calendar">캘린더</Link>
            <Link to="/team-settings">팀 설정</Link>
            <span className="app-user">{user?.email}</span>
            <button type="button" onClick={logout}>
              로그아웃
            </button>
          </nav>
        )}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
