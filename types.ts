import * as THREE from 'three';

export enum TreeState {
  TREE_SHAPE = 'TREE_SHAPE',
  SCATTERED = 'SCATTERED',
}

export enum ParticleType {
  ORNAMENT = 'ORNAMENT',
  GIFT = 'GIFT',
  STAR = 'STAR',
  PHOTO_BRAND = 'PHOTO_BRAND',
  PHOTO_SEASONAL = 'PHOTO_SEASONAL',
  PHOTO_CLUE = 'PHOTO_CLUE',
  PRODUCT = 'PRODUCT',
}

export enum ParticleShape {
  SPHERE = 'SPHERE',
  BOX = 'BOX',
  DIAMOND = 'DIAMOND',
  PLANE = 'PLANE',
}

export interface ParticleData {
  id: number;
  type: ParticleType;
  shape: ParticleShape;
  treePosition: THREE.Vector3;
  scatterPosition: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  textureUrl?: string; 
  color: string;
}

export interface AppState {
  hasPermission: boolean;
  treeState: TreeState;
  selectedPhoto: ParticleData | null;
  isSelfieMode: boolean;
  isRewardMode: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
