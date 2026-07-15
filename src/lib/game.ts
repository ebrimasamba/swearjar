import type { IconType } from 'react-icons';
import {
  GiSoap,
  GiSprout,
  GiPocketBow,
  GiCrossedSwords,
  GiDeathSkull,
  GiHornedSkull,
  GiCrown,
  GiFire,
  GiTwoCoins,
  GiPodium,
  GiOwl,
  GiNightSleep,
  GiCoffeeCup,
  GiPartyPopper,
  GiBullseye,
  GiSpikedDragonHead,
} from 'react-icons/gi';

/**
 * The whole game is derived from one number per person: their swear count.
 * XP is deliberately 1 swear = 10 XP so the numbers feel arcade-sized, and the
 * level curve is quadratic-ish so early levels come fast and later ones drag.
 */
export const XP_PER_SWEAR = 10;

export interface Tier {
  title: string;
  Icon: IconType;
  /** Minimum lifetime swears to hold this tier. */
  min: number;
  /** Tailwind text colour class. */
  color: string;
  /** Tailwind border/bg tint classes for chips. */
  chip: string;
}

/** Ordered low → high. Resolve with getTier(). */
export const TIERS: Tier[] = [
  { title: 'Clean Slate', Icon: GiSoap, min: 0, color: 'text-clean', chip: 'border-clean/30 bg-clean/10 text-clean' },
  { title: 'Rookie', Icon: GiSprout, min: 1, color: 'text-muted-foreground', chip: 'border-border bg-muted/40 text-muted-foreground' },
  { title: 'Loose Cannon', Icon: GiPocketBow, min: 5, color: 'text-gold', chip: 'border-gold/30 bg-gold/10 text-gold' },
  { title: 'Repeat Offender', Icon: GiCrossedSwords, min: 15, color: 'text-hot', chip: 'border-hot/30 bg-hot/10 text-hot' },
  { title: 'Serial Offender', Icon: GiDeathSkull, min: 30, color: 'text-hot', chip: 'border-hot/40 bg-hot/15 text-hot' },
  { title: 'Public Menace', Icon: GiHornedSkull, min: 60, color: 'text-hot', chip: 'border-hot/50 bg-hot/20 text-hot' },
  { title: 'Jar Overlord', Icon: GiSpikedDragonHead, min: 120, color: 'text-hot', chip: 'border-hot/60 bg-hot/25 text-hot' },
];

export function getTier(swears: number): Tier {
  let out = TIERS[0];
  for (const t of TIERS) if (swears >= t.min) out = t;
  return out;
}

export interface LevelInfo {
  level: number;
  xp: number;
  /** XP floor of the current level. */
  levelStartXp: number;
  /** XP needed to reach the next level. */
  nextLevelXp: number;
  /** 0..1 progress through the current level. */
  progress: number;
}

/** Total XP required to *reach* a given level. Level 1 starts at 0. */
function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // 50, 130, 250, 410, 610... — grows quadratically, no lookup table needed.
  const n = level - 1;
  return 20 * n * n + 30 * n;
}

export function getLevel(swears: number): LevelInfo {
  const xp = swears * XP_PER_SWEAR;
  let level = 1;
  while (xpForLevel(level + 1) <= xp && level < 99) level++;

  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const span = nextLevelXp - levelStartXp;
  const progress = span > 0 ? Math.min(1, Math.max(0, (xp - levelStartXp) / span)) : 1;

  return { level, xp, levelStartXp, nextLevelXp, progress };
}

export interface Achievement {
  id: string;
  name: string;
  hint: string;
  Icon: IconType;
  unlocked: boolean;
}

export interface AchievementInput {
  swears: number;
  /** Swear timestamps for this person, any order. */
  timestamps: string[];
  /** Whether they currently hold rank #1 this month. */
  isTopOffender: boolean;
  /** Days since their last swear, or null if they have never sworn. */
  streakDays: number | null;
}

/**
 * Achievements are computed, never stored — every one is a pure function of
 * the swear log, so they stay correct when rows are deleted.
 */
export function getAchievements(input: AchievementInput): Achievement[] {
  const { swears, timestamps, isTopOffender, streakDays } = input;
  const dates = timestamps.map((t) => new Date(t));

  const hasHour = (from: number, to: number) => dates.some((d) => d.getHours() >= from && d.getHours() < to);

  // Most swears logged within any single calendar day.
  const byDay = new Map<string, number>();
  for (const d of dates) {
    const key = d.toDateString();
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const worstDay = byDay.size ? Math.max(...byDay.values()) : 0;

  const onWeekend = dates.some((d) => d.getDay() === 0 || d.getDay() === 6);

  return [
    { id: 'first-blood', name: 'First Blood', hint: 'Log your first swear', Icon: GiBullseye, unlocked: swears >= 1 },
    { id: 'hat-trick', name: 'Hat Trick', hint: '3 swears in one day', Icon: GiFire, unlocked: worstDay >= 3 },
    { id: 'big-spender', name: 'Big Spender', hint: 'Reach 25 lifetime swears', Icon: GiTwoCoins, unlocked: swears >= 25 },
    { id: 'most-wanted', name: 'Most Wanted', hint: 'Hold #1 on the monthly board', Icon: GiCrown, unlocked: isTopOffender },
    { id: 'early-bird', name: 'Early Bird', hint: 'Swear before 9am', Icon: GiCoffeeCup, unlocked: hasHour(0, 9) },
    { id: 'night-owl', name: 'Night Owl', hint: 'Swear after 8pm', Icon: GiOwl, unlocked: hasHour(20, 24) },
    { id: 'weekend-warrior', name: 'Weekend Warrior', hint: 'Swear on a weekend', Icon: GiPartyPopper, unlocked: onWeekend },
    { id: 'podium', name: 'Podium Finish', hint: 'Reach level 5', Icon: GiPodium, unlocked: getLevel(swears).level >= 5 },
    { id: 'reformed', name: 'Reformed', hint: '14 days clean', Icon: GiNightSleep, unlocked: streakDays !== null && streakDays >= 14 },
  ];
}

/** Deterministic 32-bit hash — drives per-person 3D avatar colour and shape. */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
