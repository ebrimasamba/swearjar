'use client';

import * as React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { StudioEnv } from './AvatarScene';

const JAR_R = 1.05;
const JAR_BOTTOM = -1.35;
const JAR_TOP = 1.15;

/** Deterministic coin layout — same fill always looks the same, no jitter on re-render. */
function useCoins(count: number) {
  return React.useMemo(() => {
    const out: { pos: [number, number, number]; rot: [number, number, number]; gold: boolean }[] = [];
    // Coins settle in loose layers; 7 per layer reads as a pile, not a grid.
    const perLayer = 7;
    for (let i = 0; i < count; i++) {
      const layer = Math.floor(i / perLayer);
      const idx = i % perLayer;
      const a = (idx / perLayer) * Math.PI * 2 + layer * 0.7;
      const r = idx === 0 ? 0 : 0.42 + ((i * 37) % 20) / 100;
      out.push({
        pos: [Math.cos(a) * r, JAR_BOTTOM + 0.12 + layer * 0.15, Math.sin(a) * r],
        rot: [Math.PI / 2 + (((i * 53) % 30) - 15) / 60, ((i * 91) % 100) / 16, 0],
        gold: i % 5 !== 0,
      });
    }
    return out;
  }, [count]);
}

function Coins({ count }: { count: number }) {
  const coins = useCoins(count);
  const group = React.useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    // Faint shimmer so the pile isn't dead still.
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.06;
  });

  return (
    <group ref={group}>
      {coins.map((c, i) => (
        <mesh key={i} position={c.pos} rotation={c.rot}>
          <cylinderGeometry args={[0.2, 0.2, 0.045, 24]} />
          {/* Emissive floor keeps coins gold through the tinted glass — at
              full metalness they render near-black in here. */}
          <meshStandardMaterial
            color={c.gold ? '#ffc633' : '#ff85a8'}
            metalness={0.65}
            roughness={0.3}
            emissive={c.gold ? '#ff9d00' : '#ff2e63'}
            emissiveIntensity={0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

function Jar({ fillPct }: { fillPct: number }) {
  // Liquid rises with the fund; coins accumulate with it.
  const liquidH = Math.max(0.001, (JAR_TOP - JAR_BOTTOM - 0.5) * fillPct);
  const liquidY = JAR_BOTTOM + liquidH / 2 + 0.02;

  return (
    <group>
      {/* Lid */}
      <mesh position={[0, JAR_TOP + 0.3, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.3, 48]} />
        <meshStandardMaterial color="#ff2e63" metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[0, JAR_TOP + 0.11, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.14, 48]} />
        <meshStandardMaterial color="#c8103c" metalness={0.9} roughness={0.35} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, JAR_TOP - 0.06, 0]}>
        <cylinderGeometry args={[0.72, 0.95, 0.34, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#ffd9e2"
          transmission={0.94}
          thickness={0.4}
          roughness={0.08}
          ior={1.45}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Liquid */}
      <mesh position={[0, liquidY, 0]}>
        <cylinderGeometry args={[JAR_R - 0.07, JAR_R - 0.07, liquidH, 48]} />
        <meshPhysicalMaterial
          color="#ff4d7a"
          transmission={0.3}
          thickness={0.5}
          roughness={0.1}
          ior={1.33}
          transparent
          opacity={0.55}
          emissive="#ff2e63"
          emissiveIntensity={0.5}
        />
      </mesh>

      <Coins count={Math.min(42, Math.round(fillPct * 42))} />

      {/* Glass body — drawn last so it composites over the contents */}
      <mesh>
        <cylinderGeometry args={[JAR_R, JAR_R * 0.97, JAR_TOP - JAR_BOTTOM, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={1}
          thickness={0.35}
          roughness={0.05}
          ior={1.5}
          transparent
          side={THREE.DoubleSide}
          clearcoat={1}
        />
      </mesh>

      {/* Base */}
      <mesh position={[0, JAR_BOTTOM, 0]}>
        <cylinderGeometry args={[JAR_R * 0.97, JAR_R * 0.9, 0.1, 64]} />
        <meshPhysicalMaterial color="#ffffff" transmission={0.9} thickness={0.6} roughness={0.12} ior={1.5} transparent />
      </mesh>
    </group>
  );
}

export default function JarScene({ fillPct, className }: { fillPct: number; className?: string }) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.4, 5.6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={2} />
      <directionalLight position={[-4, 2, -3]} intensity={1.4} color="#ff2e63" />
      <React.Suspense fallback={null}>
        <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.5}>
          <Jar fillPct={Math.min(1, Math.max(0, fillPct))} />
        </Float>
        <StudioEnv />
      </React.Suspense>
      <ContactShadows position={[0, -2.1, 0]} opacity={0.5} scale={8} blur={2.8} far={3} color="#2a0611" />
    </Canvas>
  );
}
