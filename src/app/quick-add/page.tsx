'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, type Employee, type Swear } from '@/lib/db';
import { getInitials, formatCurrency, isSameMonthAndYear, cn } from '@/lib/utils';
import { Zap, MessageSquare, AlertCircle, ArrowLeft, Plus, UserPlus, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function QuickAdd() {
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

  const handleRecordSwear = React.useMemo(() => {
    return async (emp: Employee) => {
      // Trigger card click animation immediately
      setAnimatingId(emp.id);
      setTimeout(() => {
        setAnimatingId(null);
      }, 250);

      try {
        const currentNote = note.trim();
        // Record swear in database
        const newSwear = await db.addSwear(emp.id, currentNote || undefined);

        // Update local state to show updated counts instantly
        setSwears((prev) => [newSwear, ...prev]);
        setNote(''); // Reset note field

        // Funny warning messages
        const jokes = [
          `Watch your language, ${emp.name}! That's another ${formatCurrency(pricePerSwear)}.`,
          `Your wallet just got lighter, ${emp.name.split(' ')[0]}.`,
          `Ka-ching! ${formatCurrency(pricePerSwear)} added to the swear jar.`,
          `Busted! Keep it clean, ${emp.name}!`,
          `Hey ${emp.name.split(' ')[0]}, wash that mouth out with soap!`,
          `Uh oh, someone's vocabulary slipped! That's another ${formatCurrency(pricePerSwear)}.`,
          `Double-check your dictionary next time!`,
          `Language! We have children (or developers) here!`
        ];
        
        const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

        toast.success(randomJoke, {
          description: currentNote ? `Note: "${currentNote}"` : `Logged swear for ${emp.name}`,
          duration: 3500,
        });

      } catch (error) {
        console.error('Failed to save swear:', error);
        toast.error(`Error saving swear for ${emp.name}.`);
      }
    };
  }, [note, pricePerSwear]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded-lg" />
          <div className="h-8 w-40 bg-muted rounded-md" />
        </div>
        <div className="h-10 max-w-md bg-muted rounded-md" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-40 bg-muted border-border/40" />
          ))}
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 text-amber-500">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold mb-2">No Employees Registered</h1>
        <p className="text-muted-foreground max-w-sm mb-6">
          You must create employees before you can record any swears!
        </p>
        <Link href="/employees">
          <Button className="bg-linear-to-r from-amber-500 to-rose-500 text-white font-medium">
            Go to Employee Management
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button and title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Quick Add Swear</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">Click any employee card to record a swear immediately.</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
          Price: {formatCurrency(pricePerSwear)}/swear
        </span>
      </div>

      {/* Note input at the top */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-xs">
        <CardContent className="pt-4">
          <div className="space-y-2">
            <Label htmlFor="swear-note" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Add Swear Context / Note (Optional)</span>
            </Label>
            <Input
              id="swear-note"
              placeholder="e.g. 'Spilled coffee & yelled', 'Dropped an F-bomb during standup'..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-background/80 border-border/60 focus:border-amber-500 focus:ring-amber-500/20"
              maxLength={150}
            />
            <p className="text-[10px] text-muted-foreground italic">
              Note will be saved with the next click. It resets automatically after recording.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grid of employees */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {employees.map((emp) => {
          const isAnimating = animatingId === emp.id;
          const monthlyCount = currentMonthSwearCounts[emp.id] || 0;
          return (
            <Card
              key={emp.id}
              onClick={() => handleRecordSwear(emp)}
              className={cn(
                'cursor-pointer select-none border-border/40 overflow-hidden relative group transition-all duration-200 active:scale-95 bg-card/40 backdrop-blur-xs',
                isAnimating ? 'animate-pop ring-2 ring-rose-500/80 border-rose-500/50' : 'hover:-translate-y-1 hover:shadow-md hover:border-border/80'
              )}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center h-48">
                {/* Employee Initials Avatar */}
                <div
                  className={cn(
                    'h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4 shadow-sm group-hover:scale-105 transition-transform duration-200',
                    emp.avatar_color || 'bg-gray-400',
                    isAnimating ? 'animate-wiggle' : ''
                  )}
                >
                  {getInitials(emp.name)}
                </div>

                {/* Employee Name */}
                <h3 className="font-bold text-foreground truncate w-full px-1 text-sm sm:text-base leading-tight">
                  {emp.name}
                </h3>

                {/* Badge showing current month swears count */}
                <div className="mt-3 flex items-center gap-1">
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-0.5',
                    monthlyCount > 0 
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                      : 'bg-muted text-muted-foreground border-border/40'
                  )}>
                    <Flame className={cn('h-2.5 w-2.5', monthlyCount > 0 ? 'text-rose-500 fill-rose-500 animate-pulse' : '')} />
                    <span>{monthlyCount} this month</span>
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
