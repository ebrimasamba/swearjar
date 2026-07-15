'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';
import { cn, getInitials } from '@/lib/utils';
import { hashString } from '@/lib/game';

// Three.js only exists in the browser, and it's ~600kb — keep it out of SSR
// and out of the initial bundle. Rows use the cheap SVG avatar instead.
const AvatarScene = dynamic(() => import('@/components/three/AvatarScene'), {
  ssr: false,
  loading: () => null,
});

const JarScene = dynamic(() => import('@/components/three/JarScene'), {
  ssr: false,
  loading: () => null,
});

interface Avatar3DProps {
  seed: string;
  rage?: number;
  shadow?: boolean;
  className?: string;
}

/** Full 3D character. Expensive — reserve for hero and podium. */
export function Avatar3D({ seed, rage, shadow, className }: Avatar3DProps) {
  return (
    <div className={cn('relative', className)}>
      <AvatarScene seed={seed} rage={rage} shadow={shadow} />
    </div>
  );
}

export function Jar3D({ fillPct, className }: { fillPct: number; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <JarScene fillPct={fillPct} />
    </div>
  );
}

const SPRITE_BG = [
  'from-[#ff2e63] to-[#7b0a24]',
  'from-[#ffb800] to-[#a34d00]',
  'from-[#34d399] to-[#065f46]',
  'from-[#38bdf8] to-[#0c4a6e]',
  'from-[#a78bfa] to-[#4c1d95]',
  'from-[#f472b6] to-[#831843]',
];

/**
 * Cheap avatar for lists: a DiceBear bot rendered inline, given a glossy
 * plastic treatment so it sits beside the real 3D characters without
 * looking like a different app.
 */
export function AvatarSprite({
  seed,
  size = 40,
  className,
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const uri = React.useMemo(
    () => createAvatar(bottts, { seed, size, backgroundColor: ['transparent'] }).toDataUri(),
    [seed, size]
  );
  const bg = SPRITE_BG[hashString(seed) % SPRITE_BG.length];

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br shadow-[0_4px_12px_-2px_rgba(42,6,17,0.5)]',
        bg,
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Top-left specular highlight sells the plastic */}
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_55%)]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={uri} alt="" aria-hidden="true" width={size} height={size} className="relative h-full w-full" />
    </span>
  );
}

/** Text fallback when we want no imagery at all. */
export function InitialsBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-hot/20 text-[10px] font-bold text-hot',
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}
