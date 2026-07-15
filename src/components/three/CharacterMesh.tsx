'use client';

import * as React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hashString } from '@/lib/game';

/**
 * A procedural glossy-plastic character bust. There is no downloadable model
 * here — the whole figure is built from primitives and seeded off the person's
 * name, so every employee gets a stable, distinct character for free.
 */

// Saturated toy plastic, pulled toward the crimson identity but not all red.
const BODY_COLORS = [
  '#ff2e63', '#ff6b3d', '#ffb800', '#34d399',
  '#38bdf8', '#a78bfa', '#f472b6', '#22d3ee',
];

export interface CharacterMeshProps {
  seed: string;
  /** 0 = calm, 1 = furious. Drives visor colour and bob speed. */
  rage?: number;
  scale?: number;
}

export function CharacterMesh({ seed, rage = 0, scale = 1 }: CharacterMeshProps) {
  const group = React.useRef<THREE.Group>(null);

  const cfg = React.useMemo(() => {
    const h = hashString(seed);
    return {
      color: BODY_COLORS[h % BODY_COLORS.length],
      hasAntenna: (h >> 3) % 2 === 0,
      hasHorns: (h >> 4) % 3 === 0,
      earKind: (h >> 5) % 3, // 0 none, 1 round, 2 fin
      headSquash: 0.92 + ((h >> 6) % 10) / 60,
      phase: (h % 628) / 100,
    };
  }, [seed]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const speed = 1 + rage * 1.4;
    group.current.position.y = Math.sin(t * speed + cfg.phase) * 0.08;
    group.current.rotation.y = Math.sin(t * 0.45 + cfg.phase) * 0.32;
    group.current.rotation.z = Math.sin(t * 0.7 + cfg.phase) * 0.03;
  });

  // Angrier offenders get a hotter visor.
  const visorColor = React.useMemo(
    () => new THREE.Color('#38bdf8').lerp(new THREE.Color('#ff2e63'), Math.min(1, rage)),
    [rage]
  );

  return (
    <group ref={group} scale={scale} dispose={null}>
      {/* Body — overlaps the head enough to avoid a floating-snowman seam */}
      <mesh position={[0, -0.98, 0]} castShadow>
        <capsuleGeometry args={[0.5, 0.42, 8, 32]} />
        <meshPhysicalMaterial
          color={cfg.color}
          roughness={0.22}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Collar hides the head/body join */}
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.42, 0.5, 0.14, 32]} />
        <meshPhysicalMaterial color="#2a0611" roughness={0.35} metalness={0.6} clearcoat={1} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.12, 0]} scale={[1, cfg.headSquash, 1]} castShadow>
        <sphereGeometry args={[0.78, 48, 48]} />
        <meshPhysicalMaterial
          color={cfg.color}
          roughness={0.18}
          metalness={0.06}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/*
        Face features must sit ON the head surface, not inside it. The head is
        a r=0.78 sphere, so anything below z≈0.7 disappears into it.
      */}
      <mesh position={[0, 0.16, 0.6]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.45]}>
        <capsuleGeometry args={[0.23, 0.46, 8, 32]} />
        <meshPhysicalMaterial
          color="#0d0308"
          roughness={0.05}
          metalness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.04}
        />
      </mesh>

      {/* Eyes, sitting proud of the visor */}
      {[-0.19, 0.19].map((x) => (
        <mesh key={x} position={[x, 0.17, 0.76]}>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshStandardMaterial color={visorColor} emissive={visorColor} emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      ))}

      {/* Mouth grill — three bars, so the face has a jaw */}
      {[-0.12, 0, 0.12].map((x) => (
        <mesh key={x} position={[x, -0.3, 0.66]}>
          <boxGeometry args={[0.055, 0.17, 0.06]} />
          <meshStandardMaterial color="#1a0409" roughness={0.5} metalness={0.7} />
        </mesh>
      ))}

      {cfg.hasAntenna && (
        <group position={[0, 0.86, 0]}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 0.34, 12]} />
            <meshStandardMaterial color="#2a0611" roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.12, 20, 20]} />
            <meshStandardMaterial color="#ffb800" emissive="#ffb800" emissiveIntensity={1.1} toneMapped={false} />
          </mesh>
        </group>
      )}

      {cfg.hasHorns &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.44, 0.72, 0]} rotation={[0, 0, s * -0.42]}>
            <coneGeometry args={[0.13, 0.42, 16]} />
            <meshPhysicalMaterial color="#fff0f4" roughness={0.25} clearcoat={1} />
          </mesh>
        ))}

      {cfg.earKind === 1 &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.74, 0.12, 0]}>
            <sphereGeometry args={[0.2, 20, 20]} />
            <meshPhysicalMaterial color={cfg.color} roughness={0.2} clearcoat={1} />
          </mesh>
        ))}

      {/* Fin ears — needs radial segments, a 3-segment cone reads as a flat shard */}
      {cfg.earKind === 2 &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.68, 0.34, 0]} rotation={[0, 0, s * 0.55]}>
            <coneGeometry args={[0.15, 0.52, 20]} />
            <meshPhysicalMaterial color={cfg.color} roughness={0.22} clearcoat={1} />
          </mesh>
        ))}
    </group>
  );
}
