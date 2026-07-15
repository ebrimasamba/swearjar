'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { db, type Employee, type Swear } from '@/lib/db';
import { cn, formatCurrency, isSameMonthAndYear, getStreakDays } from '@/lib/utils';
import { getLevel, getTier, getAchievements, XP_PER_SWEAR } from '@/lib/game';
import {
  GiCrown,
  GiTwoCoins,
  GiThunderStruck,
  GiPerson,
  GiTrophy,
  GiSandsOfTime,
  GiBackstab,
} from 'react-icons/gi';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameAvatar, GameJar, assignCharacters } from '@/components/GameAvatar';
import { Counter, TierChip, LevelBadge, XpBar, AchievementGrid, SectionTitle } from '@/components/game/GameBits';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_PALETTE = ['#ff2e63', '#ffb800', '#34d399', '#38bdf8', '#a78bfa', '#f472b6', '#22d3ee', '#fb923c'];
const MEDAL = ['bg-gold text-gold-foreground', 'bg-slate-300 text-slate-900', 'bg-amber-700 text-amber-50'];

const MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000];
function nextMilestone(amount: number) {
  return MILESTONES.find((m) => m > amount) ?? Math.ceil((amount * 1.5) / 1000) * 1000;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 90, damping: 18 } },
};

export default function Dashboard() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [swears, setSwears] = React.useState<Swear[]>([]);
  const [pricePerSwear, setPricePerSwear] = React.useState<number>(5);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [emps, sws, price] = await Promise.all([
          db.getEmployees(),
          db.getSwears(),
          db.getPricePerSwear(),
        ]);
        setEmployees(emps);
        setSwears(sws);
        setPricePerSwear(price);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Could not load data. Check database settings.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentMonthSwears = React.useMemo(() => {
    const now = new Date();
    return swears.filter((s) => isSameMonthAndYear(new Date(s.created_at), now));
  }, [swears]);

  const stats = React.useMemo(() => {
    const totalSwears = currentMonthSwears.length;
    return {
      totalSwears,
      totalMoney: totalSwears * pricePerSwear,
      averageSwears: employees.length ? parseFloat((totalSwears / employees.length).toFixed(1)) : 0,
    };
  }, [currentMonthSwears, employees, pricePerSwear]);

  const lifetimeTotal = swears.length * pricePerSwear;

  // Built from the full roster so a person keeps the same character everywhere.
  const characters = React.useMemo(() => assignCharacters(employees.map((e) => e.name)), [employees]);

  /** Everything the board needs, computed once. */
  const board = React.useMemo(() => {
    const monthCount: Record<string, number> = {};
    const lifeCount: Record<string, number> = {};
    employees.forEach((e) => {
      monthCount[e.id] = 0;
      lifeCount[e.id] = 0;
    });
    currentMonthSwears.forEach((s) => {
      if (monthCount[s.employee_id] !== undefined) monthCount[s.employee_id]++;
    });
    swears.forEach((s) => {
      if (lifeCount[s.employee_id] !== undefined) lifeCount[s.employee_id]++;
    });

    const maxMonth = Math.max(1, ...Object.values(monthCount));

    return employees
      .map((e) => ({
        ...e,
        monthSwears: monthCount[e.id] ?? 0,
        lifeSwears: lifeCount[e.id] ?? 0,
        owed: (monthCount[e.id] ?? 0) * pricePerSwear,
        streakDays: getStreakDays(swears, e.id),
        level: getLevel(lifeCount[e.id] ?? 0),
        // Rage drives the 3D character's eyes + bob speed.
        rage: (monthCount[e.id] ?? 0) / maxMonth,
      }))
      .sort((a, b) => b.monthSwears - a.monthSwears || a.name.localeCompare(b.name));
  }, [employees, currentMonthSwears, swears, pricePerSwear]);

  const mostWanted = board[0]?.monthSwears > 0 ? board[0] : null;

  const heroAchievements = React.useMemo(() => {
    if (!mostWanted) return [];
    return getAchievements({
      swears: mostWanted.lifeSwears,
      timestamps: swears.filter((s) => s.employee_id === mostWanted.id).map((s) => s.created_at),
      isTopOffender: true,
      streakDays: mostWanted.streakDays,
    });
  }, [mostWanted, swears]);

  const chartData = React.useMemo(
    () =>
      board
        .filter((b) => b.monthSwears > 0)
        .slice(0, 8)
        .map((b) => ({ name: b.name.split(' ')[0], fullName: b.name, swears: b.monthSwears, amount: b.owed })),
    [board]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-foreground/10" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-3xl bg-foreground/10 lg:col-span-2" />
          <div className="h-72 animate-pulse rounded-3xl bg-foreground/10" />
        </div>
        <div className="h-80 animate-pulse rounded-3xl bg-foreground/10" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-hot text-hot-foreground">
          <GiPerson className="h-9 w-9" />
        </div>
        <h1 className="mb-2 font-heading text-3xl font-bold">No players on the roster</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          The arena is empty. Add your first colleague to start the season.
        </p>
        <Link href="/employees">
          <Button size="lg" className="gap-2 bg-hot font-semibold text-hot-foreground hover:bg-hot/90">
            <GiPerson className="h-5 w-5" />
            Add first player
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={rise} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-hot">
            Season · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">The Arena</h1>
        </div>
        <Link href="/quick-add">
          <Button
            size="lg"
            className="gap-2 bg-hot font-semibold text-hot-foreground shadow-[0_8px_30px_-6px_var(--hot)] transition-transform hover:bg-hot/90 active:scale-95"
          >
            <GiThunderStruck className="h-5 w-5" />
            Log a strike
          </Button>
        </Link>
      </motion.div>

      {/* HERO — Most Wanted, character bursting out of the card */}
      <motion.div variants={rise} className="grid gap-4 lg:grid-cols-3">
        <section className="glass relative overflow-hidden rounded-3xl lg:col-span-2">
          {/* Crimson wash + oversized rank glyph */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_100%_0%,rgba(255,46,99,0.35),transparent_60%)]" />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-14 select-none font-heading text-[11rem] font-bold leading-none text-foreground/5"
          >
            01
          </span>

          <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-hot px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-hot-foreground">
                <GiCrown className="h-3.5 w-3.5" />
                Most Wanted
              </span>

              {mostWanted ? (
                <>
                  <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl">
                    {mostWanted.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <TierChip swears={mostWanted.lifeSwears} />
                    <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular text-muted-foreground">
                      <GiBackstab className="h-3 w-3" />
                      {mostWanted.monthSwears} this season
                    </span>
                    {mostWanted.streakDays !== null && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular text-muted-foreground">
                        <GiSandsOfTime className="h-3 w-3" />
                        {mostWanted.streakDays}d since last
                      </span>
                    )}
                  </div>

                  {/* Level + XP */}
                  <div className="mt-4 max-w-xs">
                    <div className="mb-1.5 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <LevelBadge level={mostWanted.level.level} />
                        <span className="text-muted-foreground">Level {mostWanted.level.level}</span>
                      </span>
                      <span className="font-mono tabular text-muted-foreground">
                        {mostWanted.level.xp} / {mostWanted.level.nextLevelXp} XP
                      </span>
                    </div>
                    <XpBar progress={mostWanted.level.progress} />
                  </div>

                  <p className="mt-4 font-mono text-2xl font-bold tabular text-gold">
                    <Counter value={mostWanted.owed} format={(n) => formatCurrency(n)} />
                    <span className="ml-1.5 align-middle text-[11px] font-medium text-muted-foreground">owed</span>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-3 font-heading text-3xl font-bold leading-tight">Nobody yet</h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    No strikes logged this season. The board is clean — for now.
                  </p>
                </>
              )}
            </div>

            {/* The character, floating out past the card's padding */}
            <div className="relative flex h-44 w-full shrink-0 items-center justify-center sm:h-56 sm:w-56">
              <GameAvatar
                seed={mostWanted?.name ?? 'empty-arena'}
                hero={Boolean(mostWanted)}
                size={200}
                className="animate-float"
              />
            </div>
          </div>

          {mostWanted && heroAchievements.length > 0 && (
            <div className="relative border-t border-border/60 px-5 py-3 sm:px-6">
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Badges · {heroAchievements.filter((a) => a.unlocked).length}/{heroAchievements.length}
              </p>
              <AchievementGrid items={heroAchievements} />
            </div>
          )}
        </section>

        {/* The jar */}
        <section className="glass relative flex flex-col items-center overflow-hidden rounded-3xl p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_100%,rgba(255,184,0,0.16),transparent_65%)]" />
          <p className="relative font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
            The Jar
          </p>
          <GameJar amount={lifetimeTotal} goal={nextMilestone(lifetimeTotal)} className="relative my-2 w-full" />
          <p className="relative font-mono text-3xl font-bold tabular text-gold">
            <Counter value={lifetimeTotal} format={(n) => formatCurrency(n)} />
          </p>
          <p className="relative mt-1 text-[11px] text-muted-foreground">
            goal {formatCurrency(nextMilestone(lifetimeTotal))} · all time
          </p>
          <XpBar
            progress={lifetimeTotal / nextMilestone(lifetimeTotal)}
            showSheen={false}
            className="relative mt-3 max-w-[200px]"
          />
        </section>
      </motion.div>

      {/* Season stat tiles */}
      <motion.div variants={rise} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Strikes', value: stats.totalSwears, Icon: GiThunderStruck, tone: 'text-hot', fmt: undefined },
          { label: 'Pot', value: stats.totalMoney, Icon: GiTwoCoins, tone: 'text-gold', fmt: (n: number) => formatCurrency(n) },
          { label: 'Avg / player', value: stats.averageSwears, Icon: GiPerson, tone: 'text-foreground', fmt: (n: number) => n.toFixed(1) },
          { label: 'XP issued', value: stats.totalSwears * XP_PER_SWEAR, Icon: GiTrophy, tone: 'text-foreground', fmt: undefined },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <s.Icon className={cn('h-3.5 w-3.5', s.tone)} />
              {s.label}
            </div>
            <p className={cn('font-mono text-2xl font-bold tabular', s.tone)}>
              <Counter value={s.value} format={s.fmt} />
            </p>
          </div>
        ))}
      </motion.div>

      {/* Leaderboard */}
      <motion.section variants={rise}>
        <SectionTitle
          eyebrow="Standings"
          title="Season leaderboard"
          action={
            <Link
              href="/history"
              className="group inline-flex items-center gap-1 text-xs font-semibold text-hot hover:text-hot/80"
            >
              Full log
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
        />

        <div className="glass overflow-hidden rounded-3xl">
          <ul className="divide-y divide-border/60">
            {board.map((p, idx) => {
              const medal = idx < 3 && p.monthSwears > 0;
              const tier = getTier(p.lifeSwears);
              return (
                <li
                  key={p.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-3 transition-colors hover:bg-foreground/[0.04] sm:gap-3 sm:px-4',
                    idx === 0 && p.monthSwears > 0 && 'bg-hot/[0.06]'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold tabular',
                      medal ? MEDAL[idx] : 'text-muted-foreground'
                    )}
                  >
                    {idx + 1}
                  </span>

                  <GameAvatar seed={p.name} character={characters[p.name]} size={40} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{p.name}</p>
                      <LevelBadge level={p.level.level} />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <XpBar progress={p.level.progress} showSheen={false} className="max-w-[140px]" />
                      <span className={cn('hidden shrink-0 items-center gap-1 text-[10px] font-semibold sm:flex', tier.color)}>
                        <tier.Icon className="h-3 w-3" />
                        {tier.title}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-bold tabular">{p.monthSwears}</p>
                    <p className="hidden font-mono text-[10px] tabular text-muted-foreground sm:block">strikes</p>
                  </div>

                  <div className="shrink-0 text-right sm:w-20">
                    <p className={cn('font-mono text-sm font-bold tabular', p.owed > 0 ? 'text-gold' : 'text-muted-foreground')}>
                      {formatCurrency(p.owed)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.section>

      {/* Chart */}
      {chartData.length > 0 && (
        <motion.section variants={rise}>
          <SectionTitle eyebrow="Breakdown" title="Strikes by player" />
          <div className="glass rounded-3xl p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,46,99,0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="glass-strong rounded-xl px-3 py-2 text-xs">
                          <p className="font-semibold">{d.fullName}</p>
                          <p className="mt-1 font-mono tabular text-muted-foreground">{d.swears} strikes</p>
                          <p className="font-mono tabular font-semibold text-gold">{formatCurrency(d.amount)}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="swears" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
