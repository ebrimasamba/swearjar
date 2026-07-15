'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import { hashString } from '@/lib/game';

/**
 * Player characters and props are pre-rendered 3D art (Microsoft Fluent Emoji,
 * MIT — see public/3d/LICENSE.txt), vendored locally.
 *
 * This replaces a react-three-fiber scene that shipped ~500KB of JS and ran a
 * WebGL loop to draw two decorative objects. These are static, cacheable, and
 * frankly better looking.
 */

/** Characters only — no props. Order is stable; appending is safe, reordering reshuffles everyone. */
const ROSTER = [
  'robot',
  'alien',
  'alien_monster',
  'ghost',
  'goblin',
  'ogre',
  'clown_face',
  'skull',
  'smiling_face_with_horns',
  'angry_face_with_horns',
  'zany_face',
  'exploding_head',
  'pouting_face',
  'face_with_steam_from_nose',
  'cowboy_hat_face',
  'nerd_face',
  'face_with_monocle',
  'smiling_face_with_sunglasses',
  'cat_face',
  'dog_face',
  'bear',
  'fox',
  'unicorn',
  'dragon_face',
] as const;

/** The one that says "swear jar" out loud. Reserved for the top offender. */
export const RAGE_FACE = 'face_with_symbols_on_mouth';

/** Fallback when the full roster isn't known. Can collide. */
export function characterFor(seed: string): string {
  return ROSTER[hashString(seed) % ROSTER.length];
}

/**
 * Assigns a *distinct* character per person.
 *
 * Hashing each name independently collides constantly — 8 people over 24
 * characters collide ~65% of the time (birthday paradox), and two identical
 * aliens side by side read as a bug. So: hash picks a preferred slot, then we
 * probe forward for the first free one.
 *
 * Always pass the full employee roster, not a filtered subset, or the same
 * person would get a different character on different pages.
 */
export function assignCharacters(names: string[]): Record<string, string> {
  const used = new Set<string>();
  const out: Record<string, string> = {};

  for (const name of [...names].sort()) {
    const start = hashString(name) % ROSTER.length;
    for (let k = 0; k < ROSTER.length; k++) {
      const candidate = ROSTER[(start + k) % ROSTER.length];
      if (!used.has(candidate)) {
        out[name] = candidate;
        used.add(candidate);
        break;
      }
    }
    // More people than characters: reuse rather than render nothing.
    if (!out[name]) out[name] = ROSTER[start];
  }
  return out;
}

const HALO = [
  'from-[#ff2e63]/40 to-transparent',
  'from-[#ffb800]/40 to-transparent',
  'from-[#34d399]/40 to-transparent',
  'from-[#38bdf8]/40 to-transparent',
  'from-[#a78bfa]/40 to-transparent',
  'from-[#f472b6]/40 to-transparent',
];

/**
 * Player avatar. `size` drives the rendered pixels, so lists stay cheap and
 * the hero still gets a crisp image.
 */
export function GameAvatar({
  seed,
  size = 40,
  hero = false,
  character,
  className,
}: {
  seed: string;
  size?: number;
  /** Use the swearing face regardless of seed, for the most-wanted slot. */
  hero?: boolean;
  /** From assignCharacters() — guarantees distinct characters across a roster. */
  character?: string;
  className?: string;
}) {
  const name = hero ? RAGE_FACE : character ?? characterFor(seed);
  const halo = HALO[hashString(seed) % HALO.length];

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className={cn('absolute inset-0 rounded-full bg-gradient-to-br blur-md', halo)}
      />
      <Image
        src={`/3d/${name}.png`}
        alt=""
        aria-hidden
        width={size * 2}
        height={size * 2}
        className="relative h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(42,6,17,0.55)]"
        priority={hero}
        unoptimized
      />
    </span>
  );
}

/** Back-compat alias — list rows used to render a DiceBear sprite here. */
export const AvatarSprite = GameAvatar;

/**
 * The jar. Fill is data, so it can't be a flat image: coins stack to a height
 * proportional to the fund, behind the glass.
 */
export function GameJar({
  amount,
  goal,
  className,
}: {
  amount: number;
  goal: number;
  className?: string;
}) {
  const pct = goal > 0 ? Math.min(1, Math.max(0, amount / goal)) : 0;

  // Deterministic scatter, so the pile doesn't reshuffle on every render.
  const coins = React.useMemo(() => {
    const n = Math.round(pct * 14);
    return Array.from({ length: n }, (_, i) => ({
      left: 12 + ((i * 37) % 62),
      bottom: Math.floor(i / 3) * 13 + ((i * 17) % 7),
      rot: ((i * 53) % 60) - 30,
      z: i,
    }));
  }, [pct]);

  return (
    <div className={cn('relative select-none', className)}>
      <div className="relative mx-auto aspect-square w-full max-w-[190px]">
        {/* The vessel. Desaturated rather than hue-rotated — rotating the hue
            of this blue render turns it green, which is worse than the blue.
            Dropping saturation reads as neutral glass and stays on-palette. */}
        <Image
          src="/3d/jar.png"
          alt={`Office jar: ${formatCurrency(amount)} of ${formatCurrency(goal)} collected`}
          width={380}
          height={380}
          unoptimized
          priority
          className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_16px_30px_rgba(42,6,17,0.6)] [filter:saturate(0.45)_brightness(1.08)]"
        />

        {/* Coins sit in front of the glass, clipped to its interior and rising
            with the fund — behind an opaque render they'd be invisible. */}
        <div className="absolute inset-x-[26%] bottom-[15%] top-[30%] overflow-hidden rounded-b-[22%]">
          <div
            className="absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out"
            style={{ height: `${Math.max(pct * 100, pct > 0 ? 14 : 0)}%` }}
          >
            {coins.map((c) => (
              <Image
                key={c.z}
                src="/3d/coin.png"
                alt=""
                aria-hidden
                width={44}
                height={44}
                unoptimized
                className="absolute w-[38%] drop-shadow-[0_2px_4px_rgba(42,6,17,0.5)]"
                style={{ left: `${c.left}%`, bottom: `${c.bottom}%`, transform: `rotate(${c.rot}deg)` }}
              />
            ))}
          </div>
        </div>

        {/* Faint specular pass so the coins still read as behind glass */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-[26%] bottom-[15%] top-[30%] rounded-b-[22%] bg-gradient-to-br from-white/20 via-transparent to-transparent"
        />
      </div>
    </div>
  );
}
