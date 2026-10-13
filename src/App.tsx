import React from 'react';
import HomeScreen from './components/HomeScreen';
import { useStudyStore } from './store/useStudyStore';
import { ZenModeView } from './components/ZenModeView';

export const App: React.FC = () => {
  const { zenMode } = useStudyStore();
  if (zenMode) return <ZenModeView />;
  return <HomeScreen />;
};

export default App;
