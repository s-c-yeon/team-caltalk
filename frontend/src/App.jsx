import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CurrentTeamProvider } from './context/CurrentTeamContext';
import { AppLayout } from './components/common/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { CalendarPage } from './pages/CalendarPage';
import { TeamSettingsPage } from './pages/TeamSettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <CurrentTeamProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-settings"
                element={
                  <ProtectedRoute>
                    <TeamSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/calendar" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CurrentTeamProvider>
    </AuthProvider>
  );
}
