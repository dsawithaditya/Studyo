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
      if (user?.id && now - lastFocusSync > 20000) {
        lastFocusSync = now;
        syncUserData(user.id);
      }
    };

    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);
    return () => {
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
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
