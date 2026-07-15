'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Lightformer } from '@react-three/drei';
import { CharacterMesh } from './CharacterMesh';

/**
 * Studio env built from Lightformers rather than an HDR preset — drei's
 * presets fetch from a CDN at runtime, which we don't want as a dependency.
 * This renders the env map locally and gives the plastic its glossy rolloff.
 */
export function StudioEnv() {
  return (
    <Environment resolution={256}>
      <Lightformer intensity={4} position={[0, 4, 2]} scale={[8, 3, 1]} color="#ffffff" />
      <Lightformer intensity={3} position={[-4, 1, 1]} scale={[3, 6, 1]} color="#ff2e63" />
      <Lightformer intensity={2} position={[4, 0, 2]} scale={[3, 6, 1]} color="#ffb0c6" />
      <Lightformer intensity={1.5} position={[0, -3, 1]} scale={[8, 2, 1]} color="#7b0a24" />
    </Environment>
  );
}

interface AvatarSceneProps {
  seed: string;
  rage?: number;
  shadow?: boolean;
  className?: string;
}

/**
 * One <Canvas> per mounted avatar, so this is only used for the few large
 * hero/podium characters — never per table row.
 */
export default function AvatarScene({ seed, rage = 0, shadow = true, className }: AvatarSceneProps) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.75]}
      camera={{ position: [0, -0.35, 4.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 3]} intensity={1.8} />
      <directionalLight position={[-3, 1, -2]} intensity={1.2} color="#ff2e63" />
      <React.Suspense fallback={null}>
        <CharacterMesh seed={seed} rage={rage} />
        <StudioEnv />
      </React.Suspense>
      {shadow && (
        <ContactShadows position={[0, -1.62, 0]} opacity={0.5} scale={5} blur={2.4} far={2.2} color="#2a0611" />
      )}
    </Canvas>
  );
}
