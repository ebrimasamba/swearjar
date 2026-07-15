'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { db, type Employee, type Swear } from '@/lib/db';
import { getRelativeTimeString, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { GiScrollQuill, GiTrashCan } from 'react-icons/gi';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameAvatar, assignCharacters } from '@/components/GameAvatar';
import { toast } from 'sonner';

export default function History() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [swears, setSwears] = React.useState<Swear[]>([]);
  const [pricePerSwear, setPricePerSwear] = React.useState<number>(5);
  const [loading, setLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>('all');

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
        console.error('Failed to load history data:', error);
        toast.error('Could not load the log.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Built from the full roster so a person keeps the same character app-wide.
  const characters = React.useMemo(() => assignCharacters(employees.map((e) => e.name)), [employees]);

  const handleDeleteSwear = async (id: string, empName: string) => {
    if (!isAdmin) return;
    try {
      await db.deleteSwear(id);
      setSwears((prev) => prev.filter((s) => s.id !== id));
      toast.success(`Strike removed for ${empName}.`, { description: 'Jar totals updated.' });
    } catch (error) {
      console.error('Failed to delete swear:', error);
      toast.error('Could not delete that strike.');
    }
  };

  const filtered = React.useMemo(() => {
    return swears
      .map((s) => {
        const emp = employees.find((e) => e.id === s.employee_id);
        return { ...s, employeeName: emp ? emp.name : 'Unknown player' };
      })
      .filter((s) => {
        const matchesSearch = s.note
          ? s.note.toLowerCase().includes(searchQuery.toLowerCase())
          : searchQuery === '';
        const matchesEmployee = selectedEmployeeId === 'all' || s.employee_id === selectedEmployeeId;
        return matchesSearch && matchesEmployee;
      });
  }, [swears, employees, searchQuery, selectedEmployeeId]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-44 animate-pulse rounded-xl bg-foreground/10" />
        <div className="h-12 animate-pulse rounded-2xl bg-foreground/10" />
        <div className="h-96 animate-pulse rounded-3xl bg-foreground/10" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
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
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Strike log</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-border bg-card/40 pl-9 focus-visible:border-hot focus-visible:ring-hot/20"
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={selectedEmployeeId} onValueChange={(v) => setSelectedEmployeeId(v || 'all')}>
            <SelectTrigger className="h-10 border-border bg-card/40">
              <SelectValue placeholder="Filter by player" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All players</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h2 className="font-heading text-sm font-bold">Logged strikes</h2>
          <span className="font-mono text-[10px] tabular text-muted-foreground">
            {filtered.length} of {swears.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <GiScrollQuill className="mx-auto mb-2 h-10 w-10 opacity-30" />
            <p className="text-sm font-semibold">No strikes found</p>
            <p className="mt-1 text-xs">Try clearing the search or filter.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.04]"
              >
                <GameAvatar seed={item.employeeName} character={characters[item.employeeName]} size={36} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.employeeName}</p>
                  <p className="truncate text-xs italic text-muted-foreground">
                    {item.note ? `“${item.note}”` : 'No note left'}
                  </p>
                </div>

                <span className="hidden shrink-0 font-mono text-[10px] tabular text-muted-foreground sm:block">
                  {getRelativeTimeString(item.created_at)}
                </span>

                <span className="shrink-0 font-mono text-sm font-bold tabular text-gold">
                  {formatCurrency(pricePerSwear)}
                </span>

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSwear(item.id, item.employeeName)}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                    title="Delete strike"
                  >
                    <GiTrashCan className="h-4 w-4" />
                    <span className="sr-only">Delete strike for {item.employeeName}</span>
                  </Button>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
