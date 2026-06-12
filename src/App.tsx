import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { StatusBar } from '@capacitor/status-bar';
import { Shop } from './pages/Shop';
import { Settings } from './pages/Settings';
import { GroupDetails } from './pages/GroupDetails';
import { ManageGames } from './pages/ManageGames';
import { GroupStats } from './pages/GroupStats';
import { GroupSettings } from './pages/GroupSettings';
import { useTranslation } from 'react-i18next';
import { CapacitorShareTarget } from '@capgo/capacitor-share-target'; // Imported the plugin
import { Splash } from './components/Splash';

const AppContent = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate(); // Hook enabled by moving <Router> to the root App component
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    if (profile?.language) {
      i18n.changeLanguage(profile.language);
    }
  }, [profile?.language, i18n]);

  useEffect(() => {
    // Only run this native command on actual devices
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch((err) => {
        console.warn('Could not overlay status bar', err);
      });
    }
  }, []);

  // Set up the Share Target listener
  useEffect(() => {
    let shareListener: any;

    const setupShareListener = async () => {
      try {
        shareListener = await CapacitorShareTarget.addListener('shareReceived', (event) => {
          console.log('Received shared content:', event);

          if (event.texts && event.texts.length > 0) {
            const sharedText = event.texts[0]; // Fix: Read the string directly
            console.log('Shared text received:', sharedText);

            if (user) {
              navigate('/', { state: { sharedText } });
            }
          }
        });
      } catch (err) {
        console.error('Error setting up share listener:', err);
      }
    };

    // Only configure the listener on native platforms to prevent web errors
    if (Capacitor.isNativePlatform()) {
      setupShareListener();
    }

    return () => {
      if (shareListener) {
        shareListener.remove();
      }
    };
  }, [navigate, user]);

  if (!splashFinished) {
    return (
      <Splash
        isLoading={authLoading}
        onFinishedLoading={() => setSplashFinished(true)}
        loadingDuration={1500}
      />
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/group/:groupId" element={<GroupDetails />} />
          <Route path="/group/:groupId/stats" element={<GroupStats />} />
          <Route path="/group/:groupId/manage-games" element={<ManageGames />} />
          <Route path="/group/:groupId/settings" element={<GroupSettings />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}