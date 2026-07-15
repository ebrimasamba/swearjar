'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { db, type Employee, type Swear } from '@/lib/db';
import { cn, formatCurrency, getMonthYearKey, formatMonthYearKey } from '@/lib/utils';
import { getLevel, getTier } from '@/lib/game';
import { GiCalendar, GiThunderStruck, GiTwoCoins, GiPerson, GiScrollQuill } from 'react-icons/gi';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvatarSprite } from '@/components/GameAvatar';
import { Counter, XpBar, LevelBadge, SectionTitle } from '@/components/game/GameBits';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_PALETTE = ['#ff2e63', '#ffb800', '#34d399', '#38bdf8', '#a78bfa', '#f472b6', '#22d3ee', '#fb923c'];
const MEDAL = ['bg-gold text-gold-foreground', 'bg-slate-300 text-slate-900', 'bg-amber-700 text-amber-50'];

export default function MonthsPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [swears, setSwears] = React.useState<Swear[]>([]);
  const [pricePerSwear, setPricePerSwear] = React.useState<number>(5);
  const [loading, setLoading] = React.useState(true);
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');

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

        const currentKey = getMonthYearKey(new Date());
        const keys = new Set<string>([currentKey]);
        sws.forEach((s) => keys.add(getMonthYearKey(new Date(s.created_at))));
        const sorted = Array.from(keys).sort((a, b) => b.localeCompare(a));
        setSelectedMonth(sorted.length > 1 ? sorted[1] : currentKey);
      } catch (error) {
        console.error('Failed to load season data:', error);
        toast.error('Could not load season history.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const availableMonths = React.useMemo(() => {
    const keys = new Set<string>([getMonthYearKey(new Date())]);
    swears.forEach((s) => keys.add(getMonthYearKey(new Date(s.created_at))));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [swears]);

  const monthSwears = React.useMemo(
    () => (selectedMonth ? swears.filter((s) => getMonthYearKey(new Date(s.created_at)) === selectedMonth) : []),
    [swears, selectedMonth]
  );

  const stats = React.useMemo(() => {
    const totalSwears = monthSwears.length;
    return {
      totalSwears,
      totalMoney: totalSwears * pricePerSwear,
      averageSwears: employees.length ? parseFloat((totalSwears / employees.length).toFixed(1)) : 0,
    };
  }, [monthSwears, employees, pricePerSwear]);

  const board = React.useMemo(() => {
    const month: Record<string, number> = {};
    const life: Record<string, number> = {};
    employees.forEach((e) => {
      month[e.id] = 0;
      life[e.id] = 0;
    });
    monthSwears.forEach((s) => {
      if (month[s.employee_id] !== undefined) month[s.employee_id]++;
    });
    swears.forEach((s) => {
      if (life[s.employee_id] !== undefined) life[s.employee_id]++;
    });

    return employees
      .map((e) => ({
        ...e,
        monthSwears: month[e.id] ?? 0,
        lifeSwears: life[e.id] ?? 0,
        owed: (month[e.id] ?? 0) * pricePerSwear,
        level: getLevel(life[e.id] ?? 0),
      }))
      .sort((a, b) => b.monthSwears - a.monthSwears || a.name.localeCompare(b.name));
  }, [employees, monthSwears, swears, pricePerSwear]);

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
      <div className="space-y-5">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-foreground/10" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-foreground/10" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-3xl bg-foreground/10" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="glass inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-hot">Archive</p>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Past seasons</h1>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-56">
          <GiCalendar className="hidden h-5 w-5 text-muted-foreground sm:block" />
          <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v || '')}>
            <SelectTrigger className="h-10 border-border bg-card/40 text-sm font-medium">
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((k) => (
                <SelectItem key={k} value={k}>
                  {formatMonthYearKey(k)} {k === getMonthYearKey(new Date()) ? '(current)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {monthSwears.length === 0 ? (
        <div className="glass flex min-h-[40vh] flex-col items-center justify-center rounded-3xl p-8 text-center">
          <GiScrollQuill className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
          <h2 className="font-heading text-lg font-bold">No strikes that season</h2>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Nothing was logged in {selectedMonth ? formatMonthYearKey(selectedMonth) : 'this month'}.
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: 'Strikes', value: stats.totalSwears, Icon: GiThunderStruck, tone: 'text-hot', fmt: undefined },
              { label: 'Pot', value: stats.totalMoney, Icon: GiTwoCoins, tone: 'text-gold', fmt: (n: number) => formatCurrency(n) },
              { label: 'Avg / player', value: stats.averageSwears, Icon: GiPerson, tone: 'text-foreground', fmt: (n: number) => n.toFixed(1) },
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
          </div>

          {/* Leaderboard */}
          <section>
            <SectionTitle eyebrow="Final standings" title={formatMonthYearKey(selectedMonth)} />
            <div className="glass overflow-hidden rounded-3xl">
              <ul className="divide-y divide-border/60">
                {board.map((p, idx) => {
                  const medal = idx < 3 && p.monthSwears > 0;
                  const tier = getTier(p.lifeSwears);
                  return (
                    <li
                      key={p.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.04]',
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
                      <AvatarSprite seed={p.name} size={40} />
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
                        <p className="font-mono text-[10px] tabular text-muted-foreground">strikes</p>
                      </div>
                      <div className="w-20 shrink-0 text-right">
                        <p className={cn('font-mono text-sm font-bold tabular', p.owed > 0 ? 'text-gold' : 'text-muted-foreground')}>
                          {formatCurrency(p.owed)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Chart */}
          {chartData.length > 0 && (
            <section>
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
                              <p className="font-mono font-semibold tabular text-gold">{formatCurrency(d.amount)}</p>
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
            </section>
          )}
        </motion.div>
      )}
    </div>
  );
}
