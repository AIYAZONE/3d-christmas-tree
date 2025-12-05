import React, { useMemo, useRef, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Image, Float, Sparkles } from '@react-three/drei';
import { ParticleData, ParticleType, ParticleShape, TreeState } from '../types';

interface InteractiveTreeProps {
  data: ParticleData[];
  treeState: TreeState;
  onPhotoClick: (particle: ParticleData) => void;
}

// Reusable Geometries
const SphereGeom = new THREE.SphereGeometry(1, 32, 32);
const BoxGeom = new THREE.BoxGeometry(1, 1, 1);
const DiamondGeom = new THREE.OctahedronGeometry(1, 0);

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error Boundary
class ImageErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    // Cast this to any to access props to bypass TS error
    const props = (this as any).props as ErrorBoundaryProps;
    if (this.state.hasError) return props.fallback;
    return props.children;
  }
}

const PhotoFallback = () => (
    <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.4} metalness={0.6} />
    </mesh>
);

const AsyncPhoto: React.FC<{ url: string }> = ({ url }) => {
    return (
        <Image 
            url={url} 
            position={[0, 0, 0.06]} 
            scale={[0.9, 0.9]} 
            transparent
            toneMapped={false}
        />
    );
};

interface ParticleMeshProps {
    p: ParticleData;
    treeState: TreeState;
    onClick?: (p: ParticleData) => void;
}

const ParticleMesh: React.FC<ParticleMeshProps> = ({ p, treeState, onClick }) => {
    const ref = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    // Random physics params
    const randomPhase = useMemo(() => Math.random() * Math.PI * 2, []);
    const randomSpeed = useMemo(() => 0.8 + Math.random() * 0.6, []);
    
    useFrame((state, delta) => {
        if (!ref.current) return;
        const time = state.clock.elapsedTime;

        // --- 1. Morphing Logic (Vortex Effect) ---
        const target = treeState === TreeState.TREE_SHAPE ? p.treePosition : p.scatterPosition;
        
        // Swirl Calculation: When forming the tree, particles spiral in
        const isForming = treeState === TreeState.TREE_SHAPE;
        
        // Speed varies by particle for organic feel
        const lerpSpeed = isForming ? 2.5 * randomSpeed : 3.0;
        
        // Standard Lerp
        ref.current.position.lerp(target, delta * lerpSpeed);

        // Add Swirl only when transitioning or idle in tree
        if (isForming) {
            // Subtle "breathing" swirl
            const radius = 0.05;
            ref.current.position.x += Math.cos(time * 2 + p.id) * radius * delta;
            ref.current.position.z += Math.sin(time * 2 + p.id) * radius * delta;
        }

        // --- 2. Floating ---
        const floatY = Math.sin(time * randomSpeed + randomPhase) * 0.02;
        ref.current.position.y += floatY;

        // --- 3. Rotation ---
        ref.current.rotation.x += delta * 0.5 * randomSpeed;
        ref.current.rotation.y += delta * 0.3 * randomSpeed;

        // --- 4. Photo Billboarding ---
        if (p.shape === ParticleShape.PLANE) {
             const q = new THREE.Quaternion();
             q.setFromRotationMatrix(new THREE.Matrix4().lookAt(state.camera.position, ref.current.position, new THREE.Vector3(0, 1, 0)));
             ref.current.quaternion.slerp(q, 0.1);
        }

        // --- 5. Jackery Blink Effect ---
        if (meshRef.current && p.shape !== ParticleShape.PLANE) {
             const mat = meshRef.current.material as THREE.MeshStandardMaterial;
             const isLight = p.scale < 0.8; // Small particles are lights
             
             if (isLight) {
                 // Breathing lights
                 const blink = Math.sin(time * 3 + p.id) * 0.5 + 0.5; 
                 mat.emissiveIntensity = 2.0 + blink * 3.0;
             } else if (hovered) {
                 mat.emissiveIntensity = 1.0;
             } else {
                 mat.emissiveIntensity = 0.2; // Dim ornaments
             }
        }
    });

    const isPhoto = p.shape === ParticleShape.PLANE;
    const isClue = p.type === ParticleType.PHOTO_CLUE;

    return (
        <group 
            ref={ref} 
            position={p.scatterPosition} 
            scale={p.scale}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick(p);
                }
            }}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            {isPhoto ? (
                <group>
                    {/* Frame */}
                    <mesh castShadow>
                        <boxGeometry args={[1.2, 1.4, 0.1]} />
                        <meshStandardMaterial 
                            color={isClue ? "#FF5500" : "#D4AF37"} 
                            metalness={1} 
                            roughness={0.1}
                            emissive={isClue ? "#FF5500" : "#D4AF37"}
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                    <ImageErrorBoundary fallback={<PhotoFallback />}>
                        <Suspense fallback={<PhotoFallback />}>
                            <AsyncPhoto url={p.textureUrl!} />
                        </Suspense>
                    </ImageErrorBoundary>
                </group>
            ) : (
                <mesh 
                    ref={meshRef} 
                    castShadow 
                    receiveShadow
                    geometry={p.shape === ParticleShape.BOX ? BoxGeom : (p.shape === ParticleShape.DIAMOND ? DiamondGeom : SphereGeom)}
                >
                    {/* Material Logic handled in loop */}
                    <meshStandardMaterial 
                        color={p.color} 
                        roughness={0.1}
                        metalness={0.9}
                        emissive={p.color}
                        emissiveIntensity={0.2}
                    />
                </mesh>
            )}
        </group>
    );
};

export const InteractiveTree: React.FC<InteractiveTreeProps> = ({ data, treeState, onPhotoClick }) => {
  return (
    <group>
      {/* 3D Header Text */}
      <Float speed={1.5} floatIntensity={0.5}>
        <group position={[0, 18, 0]}>
             <Suspense fallback={null}>
                 <Text
                    font="https://fonts.gstatic.com/s/cinzel/v19/8vIJ7wHu5mMzBEt9Tsk.woff"
                    fontSize={3.5}
                    color="#FFD700"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.05}
                    outlineColor="#593E00"
                 >
                    Merry Christmas
                    <meshStandardMaterial attach="material" color="#FFD700" emissive="#FFD700" emissiveIntensity={2} />
                 </Text>
                 <Text
                    font="https://fonts.gstatic.com/s/cinzel/v19/8vIJ7wHu5mMzBEt9Tsk.woff"
                    fontSize={1.2}
                    position={[0, -2.5, 0]}
                    color="#FF5500"
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.2}
                 >
                    JACKERY SIGNATURE
                    <meshStandardMaterial attach="material" color="#FF5500" emissive="#FF5500" emissiveIntensity={1.5} />
                 </Text>
             </Suspense>
        </group>
      </Float>

      {/* Particles */}
      {data.map((p) => (
        <ParticleMesh 
            key={p.id} 
            p={p} 
            treeState={treeState} 
            onClick={p.shape === ParticleShape.PLANE ? onPhotoClick : undefined} 
        />
      ))}

      {/* Star */}
      <Float speed={3} floatIntensity={1}>
        <group position={[0, 14, 0]}>
            <pointLight distance={30} intensity={5} color="#FFD700" decay={1} />
            <mesh rotation={[0, 0, Math.PI / 4]}>
                <octahedronGeometry args={[2.5, 0]} />
                <meshStandardMaterial 
                    color="#FFD700" 
                    emissive="#FFD700" 
                    emissiveIntensity={4} 
                    toneMapped={false}
                />
            </mesh>
            <Sparkles count={50} scale={6} size={10} color="#FFF" speed={0.5} />
        </group>
      </Float>

      {/* Base Power Stations */}
      <group position={[0, -14, 0]}>
          <group rotation={[0, Date.now() * 0.0001, 0]}>
             <mesh position={[0, -1, 0]} rotation={[-Math.PI/2, 0, 0]}>
                 <ringGeometry args={[14, 14.2, 64]} />
                 <meshBasicMaterial color="#FF5500" transparent opacity={0.3} />
             </mesh>
          </group>
      </group>

      {/* Ambient Dust */}
      <Sparkles 
        count={500} 
        scale={40} 
        size={6} 
        speed={0.3} 
        opacity={0.4} 
        color="#FDB931" 
      />
    </group>
  );
};
