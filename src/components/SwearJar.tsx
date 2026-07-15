'use client';

import * as React from 'react';
import { formatCurrency, cn } from '@/lib/utils';

const MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000];

function nextMilestone(amount: number): number {
  const found = MILESTONES.find((m) => m > amount);
  if (found) return found;
  // Beyond the largest milestone: round up to the next clean thousand-and-a-half.
  return Math.ceil((amount * 1.5) / 1000) * 1000;
}

interface SwearJarProps {
  amount: number;
  goal?: number;
  label?: string;
  className?: string;
}

export function SwearJar({ amount, goal, label = 'Office Fund', className }: SwearJarProps) {
  const target = goal ?? nextMilestone(amount);
  const pct = target > 0 ? Math.min(1, Math.max(0, amount / target)) : 0;

  // Jar silhouette spans y=40 (neck) to y=228 (base) inside a 200x240 viewBox.
  const bodyTop = 40;
  const bodyBottom = 228;
  const bodyHeight = bodyBottom - bodyTop;
  const fillHeight = bodyHeight * pct;
  const fillY = bodyBottom - fillHeight;

  const coins = React.useMemo(
    () => [
      { cx: 78, dy: 10, r: 7, delay: '0s' },
      { cx: 122, dy: 22, r: 6, delay: '0.4s' },
      { cx: 100, dy: 4, r: 5, delay: '0.8s' },
    ],
    []
  );

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        viewBox="0 0 200 240"
        className="w-full max-w-[220px] h-auto drop-shadow-[0_18px_28px_rgba(37,29,19,0.25)]"
        role="img"
        aria-label={`${label}: ${formatCurrency(amount)} of ${formatCurrency(target)} collected`}
      >
        <defs>
          <clipPath id="jarBodyClip">
            <path d="M74 40 L74 64 Q74 78 58 86 Q40 98 40 114 L40 206 Q40 228 62 228 L138 228 Q160 228 160 206 L160 114 Q160 98 142 86 Q126 78 126 64 L126 40 Z" />
          </clipPath>
          <linearGradient id="jarLiquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* Lid cap + screw-band, flush against the neck below */}
        <rect x="68" y="16" width="64" height="16" rx="5" fill="var(--muted-foreground)" opacity="0.4" />
        <rect x="72" y="30" width="56" height="11" rx="2" fill="var(--muted-foreground)" opacity="0.5" />

        {/* Jar glass body */}
        <path
          d="M74 40 L74 64 Q74 78 58 86 Q40 98 40 114 L40 206 Q40 228 62 228 L138 228 Q160 228 160 206 L160 114 Q160 98 142 86 Q126 78 126 64 L126 40 Z"
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth="2.5"
        />

        {/* Liquid fill, clipped to the jar silhouette */}
        <g clipPath="url(#jarBodyClip)">
          <rect
            x="36"
            width="128"
            y={fillY}
            height={fillHeight}
            fill="url(#jarLiquid)"
            style={{ transition: 'y 900ms cubic-bezier(0.22,1,0.36,1), height 900ms cubic-bezier(0.22,1,0.36,1)' }}
          />
          {pct > 0.08 &&
            coins.map((c, i) => (
              <circle
                key={i}
                cx={c.cx}
                cy={fillY + c.dy}
                r={c.r}
                fill="var(--gold-foreground)"
                opacity="0.55"
                style={{
                  transition: 'cy 900ms cubic-bezier(0.22,1,0.36,1)',
                  animation: `jar-bob 3.2s ease-in-out ${c.delay} infinite`,
                }}
              />
            ))}
        </g>

        {/* Glass highlight along the shoulder */}
        <path
          d="M50 118 Q50 92 66 80"
          stroke="var(--foreground)"
          strokeOpacity="0.12"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <p className="mt-3 font-mono tabular text-2xl font-semibold text-foreground">
        {formatCurrency(amount)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        <span className="font-heading uppercase tracking-wider">{label}</span> · goal {formatCurrency(target)}
      </p>
      <div className="w-full max-w-[180px] h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-700 ease-out"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
