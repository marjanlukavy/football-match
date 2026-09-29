import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/components/layout/RequireAuth';
import AuthPage from '@/pages/AuthPage';
import CalendarPage from '@/pages/CalendarPage';
import GamePage from '@/pages/GamePage';
import LineupPage from '@/pages/LineupPage';
import NotFoundPage from '@/pages/NotFoundPage';
import PlayersPage from '@/pages/PlayersPage';
import ProfilePage from '@/pages/ProfilePage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<CalendarPage />} />
          <Route path="games/:gameId" element={<GamePage />} />
          <Route path="players" element={<PlayersPage />} />
          <Route path="lineup" element={<LineupPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
