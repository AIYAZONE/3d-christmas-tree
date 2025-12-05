import * as THREE from 'three';
import { ParticleData, ParticleType, ParticleShape } from './types';

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Luxury Palette - High Contrast
const COLORS = {
  GOLD: '#FFD700',      // High Polish Gold
  CHAMPAGNE: '#FFFACD', // Bright Highlight
  EMERALD: '#006B3C',   // Rich Green
  JACKERY_ORANGE: '#FF5500', // Neon Brand
  DEEP_RED: '#D00000',  // Vibrant Red
};

// Stable High-Quality Image IDs
const BRAND_IDS = [201, 250, 180, 160, 119, 48];
const SEASONAL_IDS = [364, 342, 338, 326, 319, 292, 266, 252, 221, 193];
const CLUE_ID = 433;

export const generateParticles = (count: number): ParticleData[] => {
  const particles: ParticleData[] = [];
  
  // Adjusted Spiral Config for "Grand" Tree
  const height = 28; // Taller
  const radiusBottom = 13; // Wider base
  const turns = 7;
  const yOffset = -12;

  // We actually override the requested count to ensure density
  const realCount = 450; 

  for (let i = 0; i < realCount; i++) {
    const t = i / realCount; 
    
    let type = ParticleType.ORNAMENT;
    let shape = ParticleShape.SPHERE;
    let textureUrl = undefined;
    let color = COLORS.GOLD;
    // SIGNIFICANTLY SCALED UP
    let scale = randomRange(1.0, 1.8); 

    // --- Distribution Logic ---
    if (i < 30) {
        // Photos - Big Frames
        shape = ParticleShape.PLANE;
        scale = 3.0; // Huge photos
        
        if (i === 0) {
            type = ParticleType.PHOTO_CLUE;
            textureUrl = `https://picsum.photos/id/${CLUE_ID}/600/700`;
        } else if (i < 12) {
            type = ParticleType.PHOTO_BRAND;
            textureUrl = `https://picsum.photos/id/${BRAND_IDS[i % BRAND_IDS.length]}/500/500`;
        } else {
            type = ParticleType.PHOTO_SEASONAL;
            textureUrl = `https://picsum.photos/id/${SEASONAL_IDS[i % SEASONAL_IDS.length]}/500/500`;
        }
    } else {
        // Ornaments
        const rand = Math.random();
        if (rand > 0.92) { // Diamonds
            type = ParticleType.STAR;
            shape = ParticleShape.DIAMOND;
            color = COLORS.CHAMPAGNE;
            scale = randomRange(0.8, 1.2);
        } else if (rand > 0.75) { // Gifts
            type = ParticleType.GIFT;
            shape = ParticleShape.BOX;
            color = Math.random() > 0.5 ? COLORS.DEEP_RED : COLORS.JACKERY_ORANGE;
            scale = randomRange(1.2, 1.6);
        } else { // Spheres (Bulbs)
            type = ParticleType.ORNAMENT;
            shape = ParticleShape.SPHERE;
            const cRand = Math.random();
            if (cRand > 0.5) color = COLORS.GOLD;
            else if (cRand > 0.2) color = COLORS.EMERALD;
            else if (cRand > 0.1) color = COLORS.DEEP_RED;
            else color = COLORS.JACKERY_ORANGE;
        }
    }

    // --- Tree Position ---
    const y = (1 - t) * height + yOffset; 
    // Non-linear radius for a nice curve
    const currentRadius = Math.pow(t, 0.8) * radiusBottom;
    const angle = t * Math.PI * 2 * turns;

    const rNoise = randomRange(0.9, 1.15); // More variance
    const tx = Math.cos(angle) * currentRadius * rNoise;
    const tz = Math.sin(angle) * currentRadius * rNoise;
    const treePos = new THREE.Vector3(tx, y, tz);

    // --- Scatter Position (Wide Explosion) ---
    const phi = Math.acos(-1 + (2 * i) / realCount);
    const theta = Math.sqrt(realCount * Math.PI) * phi;
    const rScatter = 35 + Math.random() * 20; // Wide scatter
    
    const sx = rScatter * Math.cos(theta) * Math.sin(phi);
    const sy = rScatter * Math.sin(theta) * Math.sin(phi);
    const sz = rScatter * Math.cos(phi);
    const scatterPos = new THREE.Vector3(sx, sy, sz);

    particles.push({
      id: i,
      type,
      shape,
      treePosition: treePos,
      scatterPosition: scatterPos,
      rotation: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0),
      scale,
      textureUrl,
      color
    });
  }

  return particles;
};