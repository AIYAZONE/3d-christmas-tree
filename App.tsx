import React, { useState, useMemo } from 'react';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';
import { generateParticles } from './utils';
import { AppState, TreeState, ParticleData } from './types';

const App: React.FC = () => {
  // 1. App State
  const [appState, setAppState] = useState<AppState>({
    hasPermission: false,
    treeState: TreeState.TREE_SHAPE,
    selectedPhoto: null,
    isSelfieMode: false,
    isRewardMode: false
  });

  // 2. Generate Particles (Balanced for high fidelity vs performance)
  // 220 particles provides a dense tree without killing mobile FPS
  const particles = useMemo(() => generateParticles(220), []);

  // 3. Handlers
  const handleGrantPermission = () => {
    setAppState(prev => ({ ...prev, hasPermission: true }));
  };

  const setTreeState = (state: TreeState) => {
    setAppState(prev => ({ ...prev, treeState: state }));
  };

  const handlePhotoClick = (particle: ParticleData) => {
    setAppState(prev => ({ ...prev, selectedPhoto: particle }));
  };

  const closePhoto = () => {
      setAppState(prev => ({ ...prev, selectedPhoto: null }));
  };

  const startSelfie = () => {
      setAppState(prev => ({ ...prev, isSelfieMode: true, selectedPhoto: null }));
  };

  const handleReward = () => {
      setAppState(prev => ({ ...prev, isSelfieMode: false, isRewardMode: true }));
  };

  return (
    <div className="relative w-full h-full bg-[#001109]">
      <Scene 
        particles={particles} 
        treeState={appState.treeState}
        onPhotoClick={handlePhotoClick}
      />
      
      <Overlay 
        hasPermission={appState.hasPermission}
        onGrantPermission={handleGrantPermission}
        treeState={appState.treeState}
        setTreeState={setTreeState}
        selectedPhoto={appState.selectedPhoto}
        onClosePhoto={closePhoto}
        onStartSelfie={startSelfie}
        isSelfieMode={appState.isSelfieMode}
        onReward={handleReward}
        isRewardMode={appState.isRewardMode}
      />
    </div>
  );
};

export default App;