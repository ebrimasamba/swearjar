'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { db, type Employee, type Swear } from '@/lib/db';
import { formatCurrency, isSameMonthAndYear, cn } from '@/lib/utils';
import { getLevel, getTier } from '@/lib/game';
import { useAuth } from '@/lib/auth-context';
import { GiThunderStruck, GiPadlock, GiPerson, GiScrollQuill } from 'react-icons/gi';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarSprite } from '@/components/GameAvatar';
import { XpBar, LevelBadge } from '@/components/game/GameBits';
import { toast } from 'sonner';

const CITATIONS = (first: string, price: string) => [
  `Strike logged. ${first} owes ${price}.`,
  `Direct hit. ${price} to the jar.`,
  `Noted, ${first}. ${price} on the tab.`,
  `Filed under "language." ${price} added.`,
  `${first} takes the hit. ${price}.`,
];

export default function QuickAdd() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [swears, setSwears] = React.useState<Swear[]>([]);
  const [pricePerSwear, setPricePerSwear] = React.useState<number>(5);
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [hitId, setHitId] = React.useState<string | null>(null);

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
        console.error('Failed to load data for quick add:', error);
        toast.error('Failed to load the roster.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const counts = React.useMemo(() => {
    const month: Record<string, number> = {};
    const life: Record<string, number> = {};
    employees.forEach((e) => {
      month[e.id] = 0;
      life[e.id] = 0;
    });
    const now = new Date();
    swears.forEach((s) => {
      if (life[s.employee_id] === undefined) return;
      life[s.employee_id]++;
      if (isSameMonthAndYear(new Date(s.created_at), now)) month[s.employee_id]++;
    });
    return { month, life };
  }, [swears, employees]);

  /** Removes a strike that was just logged by mistake. */
  const undoStrike = React.useCallback(async (swearId: string, empName: string, restoreNote: string) => {
    // Drop it locally first so the counters correct instantly.
    setSwears((prev) => prev.filter((s) => s.id !== swearId));
    try {
      await db.deleteSwear(swearId);
      setNote(restoreNote);
      toast.success(`Strike removed for ${empName}.`);
    } catch (error) {
      console.error('Failed to undo swear:', error);
      // Put it back — the row is still in the database.
      try {
        setSwears(await db.getSwears());
      } catch {
        /* leave local state as-is; a reload will resync */
      }
      toast.error(`Could not undo that strike. Remove it from the log instead.`);
    }
  }, []);

  const recordStrike = React.useCallback(
    async (emp: Employee) => {
      if (!isAdmin) return;
      setHitId(emp.id);
      setTimeout(() => setHitId(null), 260);

      try {
        const currentNote = note.trim();
        const newSwear = await db.addSwear(emp.id, currentNote || undefined);
        setSwears((prev) => [newSwear, ...prev]);
        setNote('');

        const options = CITATIONS(emp.name.split(' ')[0], formatCurrency(pricePerSwear));
        toast.success(options[Math.floor(Math.random() * options.length)], {
          description: currentNote ? `Note: "${currentNote}"` : undefined,
          duration: 6000, // long enough to catch a misclick
          action: {
            label: 'Undo',
            onClick: () => undoStrike(newSwear.id, emp.name, currentNote),
          },
        });
      } catch (error) {
        console.error('Failed to save swear:', error);
        toast.error(`Could not log a strike for ${emp.name}. Try again.`);
      }
    },
    [note, pricePerSwear, isAdmin, undoStrike]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-foreground/10" />
        <div className="h-20 animate-pulse rounded-2xl bg-foreground/10" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-foreground/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-hot text-hot-foreground">
          <GiPadlock className="h-9 w-9" />
        </div>
        <h1 className="mb-2 font-heading text-2xl font-bold">Admin sign-in required</h1>
        <p className="mb-6 max-w-sm text-muted-foreground">Only the admin can log strikes.</p>
        <Link href="/login">
          <Button className="bg-hot font-semibold text-hot-foreground hover:bg-hot/90">Go to admin sign-in</Button>
        </Link>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-hot text-hot-foreground">
          <GiPerson className="h-9 w-9" />
        </div>
        <h1 className="mb-2 font-heading text-2xl font-bold">No players registered</h1>
        <p className="mb-6 max-w-sm text-muted-foreground">Add people to the roster before logging strikes.</p>
        <Link href="/employees">
          <Button className="bg-hot font-semibold text-hot-foreground hover:bg-hot/90">Go to roster</Button>
        </Link>
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
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-hot">Strike</p>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Log a swear</h1>
          </div>
        </div>
        <span className="glass rounded-full px-3 py-1.5 font-mono text-xs font-semibold tabular text-gold">
          {formatCurrency(pricePerSwear)} / strike
        </span>
      </div>

      {/* Note */}
      <div className="glass rounded-2xl p-4">
        <Label
          htmlFor="swear-note"
          className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          <GiScrollQuill className="h-3.5 w-3.5" />
          Note (optional)
        </Label>
        <Input
          id="swear-note"
          placeholder="What happened…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-10 border-border bg-background/40 focus-visible:border-hot focus-visible:ring-hot/20"
          maxLength={150}
        />
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Attaches to the next strike you log, then clears.
        </p>
      </div>

      {/* Targets */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {employees.map((emp, i) => {
          const isHit = hitId === emp.id;
          const monthCount = counts.month[emp.id] ?? 0;
          const lifeCount = counts.life[emp.id] ?? 0;
          const lvl = getLevel(lifeCount);
          const tier = getTier(lifeCount);

          return (
            <motion.button
              key={emp.id}
              type="button"
              onClick={() => recordStrike(emp)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 16 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Log a strike for ${emp.name}`}
              className={cn(
                'glass group relative overflow-hidden rounded-2xl p-4 text-left transition-shadow',
                isHit ? 'ring-2 ring-hot' : 'hover:glow-hot'
              )}
            >
              {/* Hit flash */}
              {isHit && (
                <motion.span
                  initial={{ opacity: 0.85, scale: 0.5 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  transition={{ duration: 0.45 }}
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-hot"
                />
              )}

              <div className="relative flex items-start justify-between">
                <AvatarSprite seed={emp.name} size={52} className={cn(isHit && 'animate-wiggle')} />
                <LevelBadge level={lvl.level} />
              </div>

              <p className="relative mt-3 truncate font-semibold leading-tight">{emp.name}</p>
              <p className={cn('relative mt-0.5 flex items-center gap-1 text-[10px] font-semibold', tier.color)}>
                <tier.Icon className="h-3 w-3" />
                {tier.title}
              </p>

              <div className="relative mt-2.5">
                <XpBar progress={lvl.progress} showSheen={false} />
              </div>

              <div className="relative mt-2.5 flex items-center justify-between">
                <span
                  className={cn(
                    'rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular',
                    monthCount > 0 ? 'border-hot/30 bg-hot/10 text-hot' : 'border-border text-muted-foreground'
                  )}
                >
                  {monthCount} this season
                </span>
                <GiThunderStruck className="h-4 w-4 text-hot opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
