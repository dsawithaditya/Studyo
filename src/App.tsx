import React, { useEffect, lazy, Suspense } from 'react';
import HomeScreen from './components/HomeScreen';
import { useStudyStore } from './store/useStudyStore';
import { useAuthStore } from './store/useAuthStore';
import { BackToTopButton } from './components/BackToTopButton';

const ZenModeView = lazy(() => import('./components/ZenModeView').then((m) => ({ default: m.ZenModeView })));

export const App: React.FC = () => {
  const { zenMode, syncUserData } = useStudyStore();

  useEffect(() => {
    let lastFocusSync = 0;
    const handleFocusOrOnline = () => {
      const now = Date.now();
      const user = useAuthStore.getState().currentUser;
      if (user?.id && now - lastFocusSync > 2500) {
        lastFocusSync = now;
        syncUserData(user.id);
      }
    };

    // Initial sync on mount if user is logged in
    const user = useAuthStore.getState().currentUser;
    if (user?.id) {
      syncUserData(user.id);
    }

    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);

    // Periodic background sync every 15 seconds when online
    const intervalId = setInterval(() => {
      const u = useAuthStore.getState().currentUser;
      const s = useAuthStore.getState().session;
      if (u?.id && u.id !== 'demo-user-1' && s?.token && s.token !== 'demo-token' && navigator.onLine) {
        syncUserData(u.id);
      }
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
      clearInterval(intervalId);
    };
  }, [syncUserData]);

  if (zenMode) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-xs font-mono text-[#e9762b]">Loading Focus Room...</div>}>
        <ZenModeView />
      </Suspense>
    );
  }
  return (
    <>
      <HomeScreen />
      <BackToTopButton />
    </>
  );
};

export default App;
