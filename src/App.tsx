import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Shop } from './pages/Shop';
import { Settings } from './pages/Settings';
import { GroupDetails } from './pages/GroupDetails';
import { ManageGames } from './pages/ManageGames';
import { useTranslation } from 'react-i18next';

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (profile?.language) {
      i18n.changeLanguage(profile.language);
    }
  }, [profile?.language, i18n]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/group/:groupId" element={<GroupDetails />} />
            <Route path="/group/:groupId/manage-games" element={<ManageGames />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
