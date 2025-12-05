import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { InteractiveTree } from './InteractiveTree';
import { ParticleData, TreeState } from '../types';

interface SceneProps {
  particles: ParticleData[];
  treeState: TreeState;
  onPhotoClick: (p: ParticleData) => void;
}

export const Scene: React.FC<SceneProps> = ({ particles, treeState, onPhotoClick }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 60], fov: 35, near: 0.1, far: 300 }}
      gl={{ 
        antialias: false, 
        alpha: false, 
        depth: true, 
        toneMappingExposure: 0.9 
      }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={['#000502']} />
      
      {/* --- Lighting Setup --- */}
      <ambientLight intensity={0.5} />
      
      {/* Tree Core Light - Makes the center glow */}
      <pointLight position={[0, 0, 0]} intensity={2.0} distance={20} color="#FFD700" decay={1} />
      
      {/* Rim Lights */}
      <spotLight position={[30, 20, 20]} intensity={3} color="#FFD700" angle={0.5} penumbra={1} />
      <spotLight position={[-30, -10, 20]} intensity={2} color="#FF5500" angle={0.5} penumbra={1} />

      {/* --- Content --- */}
      <Suspense fallback={null}>
        <InteractiveTree 
            data={particles} 
            treeState={treeState} 
            onPhotoClick={onPhotoClick} 
        />
      </Suspense>

      {/* --- Environment --- */}
      <Suspense fallback={null}>
        {/* Using a direct reliable link instead of preset to avoid fetch errors */}
        <Environment 
            files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr" 
            background={false} 
        />
      </Suspense>

      {/* --- Post FX --- */}
      <Suspense fallback={null}>
        <EffectComposer enableNormalPass={false}>
            {/* Low threshold ensures the ornaments glow nicely */}
            <Bloom 
                luminanceThreshold={0.2} 
                mipmapBlur 
                intensity={1.2} 
                radius={0.5} 
            />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={0.7} />
        </EffectComposer>
      </Suspense>

      <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 2.5} 
          maxPolarAngle={Math.PI / 1.8}
          minDistance={30}
          maxDistance={90}
          autoRotate={treeState === TreeState.TREE_SHAPE}
          autoRotateSpeed={0.5}
          enableDamping
          rotateSpeed={0.5}
      />
    </Canvas>
  );
};