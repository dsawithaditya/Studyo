import React, { useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import { useStudyStore } from './store/useStudyStore';
import { useAuthStore } from './store/useAuthStore';
import { ZenModeView } from './components/ZenModeView';
import { BackToTopButton } from './components/BackToTopButton';

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
      if (u?.id && navigator.onLine) {
        syncUserData(u.id);
      }
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
      clearInterval(intervalId);
    };
  }, [syncUserData]);

  if (zenMode) return <ZenModeView />;
  return (
    <>
      <HomeScreen />
      <BackToTopButton />
    </>
  );
};

export default App;
