'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, type Employee, type Swear } from '@/lib/db';
import { getInitials, formatCurrency, isSameMonthAndYear, getOffenderRank, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { MessageSquare, AlertCircle, ArrowLeft, UserPlus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const CITATIONS = (name: string, first: string, price: string) => [
  `Citation filed. ${first} owes ${price}.`,
  `Logged. That's ${price} toward the fund.`,
  `Noted, ${first}. ${price} added to the jar.`,
  `Another one for ${name}. ${price} on the tab.`,
  `Filed under "language." ${price} added.`,
];

export default function QuickAdd() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [swears, setSwears] = React.useState<Swear[]>([]);
  const [pricePerSwear, setPricePerSwear] = React.useState<number>(5);
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [animatingId, setAnimatingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const emps = await db.getEmployees();
        const sws = await db.getSwears();
        const price = await db.getPricePerSwear();
        setEmployees(emps);
        setSwears(sws);
        setPricePerSwear(price);
      } catch (error) {
        console.error('Failed to load data for quick add:', error);
        toast.error('Failed to load employee list.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate swear count for this month per employee
  const currentMonthSwearCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((emp) => {
      counts[emp.id] = 0;
    });

    const now = new Date();
    swears.forEach((s) => {
      if (counts[s.employee_id] !== undefined && isSameMonthAndYear(new Date(s.created_at), now)) {
        counts[s.employee_id]++;
      }
    });

    return counts;
  }, [swears, employees]);

  // Lifetime count per employee, for the rank title shown on each card.
  const lifetimeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((emp) => {
      counts[emp.id] = 0;
    });
    swears.forEach((s) => {
      if (counts[s.employee_id] !== undefined) counts[s.employee_id]++;
    });
    return counts;
  }, [swears, employees]);

  const handleRecordSwear = React.useMemo(() => {
    return async (emp: Employee) => {
      if (!isAdmin) return;
      setAnimatingId(emp.id);
      setTimeout(() => {
        setAnimatingId(null);
      }, 250);

      try {
        const currentNote = note.trim();
        const newSwear = await db.addSwear(emp.id, currentNote || undefined);

        setSwears((prev) => [newSwear, ...prev]);
        setNote('');

        const options = CITATIONS(emp.name, emp.name.split(' ')[0], formatCurrency(pricePerSwear));
        const message = options[Math.floor(Math.random() * options.length)];

        toast.success(message, {
          description: currentNote ? `Note: "${currentNote}"` : undefined,
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to save swear:', error);
        toast.error(`Could not log a swear for ${emp.name}. Try again.`);
      }
    };
  }, [note, pricePerSwear, isAdmin]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded-md" />
          <div className="h-8 w-40 bg-muted rounded-md" />
        </div>
        <div className="h-10 max-w-md bg-muted rounded-md" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-40 bg-muted border-border" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-md bg-primary flex items-center justify-center mb-6 text-gold">
          <Lock className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-heading font-semibold mb-2">Admin sign-in required</h1>
        <p className="text-muted-foreground max-w-sm mb-6">
          Only the admin can log new swears. Sign in to continue.
        </p>
        <Link href="/login">
          <Button className="bg-gold hover:bg-gold/90 text-gold-foreground font-medium">
            Go to admin sign-in
          </Button>
        </Link>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-md bg-primary flex items-center justify-center mb-6 text-gold">
          <AlertCircle className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-heading font-semibold mb-2">No employees registered</h1>
        <p className="text-muted-foreground max-w-sm mb-6">
          Add employees before logging any swears.
        </p>
        <Link href="/employees">
          <Button className="bg-gold hover:bg-gold/90 text-gold-foreground font-medium gap-2">
            <UserPlus className="h-4 w-4" />
            Go to employee management
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button and title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight sm:text-3xl">Quick Add</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">Tap a name to file a citation.</p>
          </div>
        </div>
        <span className="text-xs font-mono tabular font-medium px-2.5 py-1 bg-secondary text-foreground rounded-md border border-border">
          {formatCurrency(pricePerSwear)} / swear
        </span>
      </div>

      {/* Note input at the top */}
      <Card className="border-border bg-card">
        <CardContent className="pt-4">
          <div className="space-y-2">
            <Label htmlFor="swear-note" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Note (optional)</span>
            </Label>
            <Input
              id="swear-note"
              placeholder="What happened..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-background border-border focus-visible:border-gold focus-visible:ring-gold/20"
              maxLength={150}
            />
            <p className="text-[10px] text-muted-foreground">
              Attaches to the next citation you file, then clears.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grid of employees */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {employees.map((emp) => {
          const isAnimating = animatingId === emp.id;
          const monthlyCount = currentMonthSwearCounts[emp.id] || 0;
          const rank = getOffenderRank(lifetimeCounts[emp.id] || 0);
          return (
            <Card
              key={emp.id}
              onClick={() => handleRecordSwear(emp)}
              className={cn(
                'cursor-pointer select-none border-border overflow-hidden relative group transition-all duration-200 active:scale-95 bg-card',
                isAnimating ? 'animate-pop ring-2 ring-danger/70 border-danger/40' : 'hover:-translate-y-1 hover:shadow-ledger'
              )}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center h-48">
                <div
                  className={cn(
                    'h-16 w-16 rounded-md flex items-center justify-center text-white text-xl font-bold mb-4 shadow-xs group-hover:scale-105 transition-transform duration-200',
                    emp.avatar_color || 'bg-gray-400',
                    isAnimating ? 'animate-wiggle' : ''
                  )}
                >
                  {getInitials(emp.name)}
                </div>

                <h3 className="font-semibold text-foreground truncate w-full px-1 text-sm sm:text-base leading-tight">
                  {emp.name}
                </h3>
                <p className={cn('text-[11px] font-medium mt-0.5', rank.colorClass)}>{rank.title}</p>

                <div className="mt-3 flex items-center gap-1">
                  <span
                    className={cn(
                      'text-[10px] font-mono tabular font-semibold px-2 py-0.5 rounded-md border',
                      monthlyCount > 0 ? 'bg-danger/10 text-danger border-danger/20' : 'bg-muted text-muted-foreground border-border'
                    )}
                  >
                    {monthlyCount} this month
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
