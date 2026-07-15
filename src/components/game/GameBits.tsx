'use client';

import * as React from 'react';
import { motion, useSpring, useTransform, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { getTier, type Achievement } from '@/lib/game';

/**
 * Counts up to `value` once scrolled into view.
 *
 * The count-up is decoration; the number is data. So it jumps straight to the
 * real value under reduced-motion, and a safety timer settles it even if the
 * intersection observer never fires — a stat that reads 0 when it is really
 * 2,200 is a lie, not a missing animation.
 */
export function Counter({
  value,
  className,
  format,
}: {
  value: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const spring = useSpring(0, { stiffness: 70, damping: 22 });
  const shown = useTransform(spring, (v) => (format ? format(v) : Math.round(v).toLocaleString()));

  React.useEffect(() => {
    if (reduced) {
      spring.jump(value);
      return;
    }
    if (inView) {
      spring.set(value);
      return;
    }
    const t = setTimeout(() => spring.set(value), 1200);
    return () => clearTimeout(t);
  }, [inView, value, spring, reduced]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{shown}</motion.span>
    </span>
  );
}

export function TierChip({ swears, className }: { swears: number; className?: string }) {
  const tier = getTier(swears);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none',
        tier.chip,
        className
      )}
    >
      <tier.Icon className="h-3 w-3" />
      {tier.title}
    </span>
  );
}

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-hot px-1 font-mono text-[10px] font-bold tabular text-hot-foreground',
        className
      )}
      title={`Level ${level}`}
    >
      {level}
    </span>
  );
}

/** XP progress bar with a sweeping sheen. */
export function XpBar({
  progress,
  className,
  showSheen = true,
}: {
  progress: number;
  className?: string;
  showSheen?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, progress * 100));
  return (
    <div
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-foreground/10', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={cn('relative h-full rounded-full bg-gradient-to-r from-hot to-[#ff8ab0]', showSheen && 'sheen')}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
      />
    </div>
  );
}

export function AchievementGrid({ items, className }: { items: Achievement[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map((a) => (
        <div
          key={a.id}
          title={a.unlocked ? `${a.name} — unlocked` : `${a.name} — ${a.hint}`}
          className={cn(
            'group relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all',
            a.unlocked
              ? 'border-gold/40 bg-gold/15 text-gold shadow-[0_0_18px_-4px_var(--gold)]'
              : 'border-border bg-foreground/5 text-muted-foreground/35 grayscale'
          )}
        >
          <a.Icon className="h-5 w-5" />
          <span className="sr-only">
            {a.name}: {a.unlocked ? 'unlocked' : `locked — ${a.hint}`}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Section heading with the arcade eyebrow treatment. */
export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-hot">{eyebrow}</p>
        )}
        <h2 className="font-heading text-lg font-bold">{title}</h2>
      </div>
      {action}
    </div>
  );
}
