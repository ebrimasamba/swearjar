'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { db, type Employee } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { GiPerson, GiPadlock, GiTrashCan } from 'react-icons/gi';
import { ArrowLeft, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GameAvatar, assignCharacters } from '@/components/GameAvatar';
import { toast } from 'sonner';

export default function Employees() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newEmployeeName, setNewEmployeeName] = React.useState('');

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Employee | null>(null);
  const [editedName, setEditedName] = React.useState('');

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Employee | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        setEmployees(await db.getEmployees());
      } catch (error) {
        console.error('Failed to load employees:', error);
        toast.error('Failed to load the roster.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Built from the full roster so a person keeps the same character app-wide.
  const characters = React.useMemo(() => assignCharacters(employees.map((e) => e.name)), [employees]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const name = newEmployeeName.trim();
    if (!name) {
      toast.warning('Name cannot be empty.');
      return;
    }
    try {
      const created = await db.addEmployee(name);
      setEmployees((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewEmployeeName('');
      toast.success(`${name} joined the arena.`);
    } catch (error) {
      console.error('Failed to add employee:', error);
      toast.error('Could not add player. Try again.');
    }
  };

  const handleSaveEdit = async () => {
    if (!isAdmin || !editing) return;
    const name = editedName.trim();
    if (!name) {
      toast.warning('Name cannot be empty.');
      return;
    }
    try {
      const updated = await db.updateEmployee(editing.id, name);
      setEmployees((prev) =>
        prev.map((e) => (e.id === editing.id ? updated : e)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setIsEditOpen(false);
      setEditing(null);
      toast.success(`Renamed to ${name}.`);
    } catch (error) {
      console.error('Failed to update employee name:', error);
      toast.error('Could not rename player. Try again.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!isAdmin || !deleting) return;
    try {
      await db.deleteEmployee(deleting.id);
      setEmployees((prev) => prev.filter((e) => e.id !== deleting.id));
      setIsDeleteOpen(false);
      setDeleting(null);
      toast.success(`${deleting.name} left the arena.`, { description: 'Their strikes were deleted too.' });
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast.error('Could not remove player. Try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-44 animate-pulse rounded-xl bg-foreground/10" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-44 animate-pulse rounded-3xl bg-foreground/10" />
          <div className="h-72 animate-pulse rounded-3xl bg-foreground/10 md:col-span-2" />
        </div>
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
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-hot">Roster</p>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Players</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Add */}
        <section className="glass h-fit rounded-3xl p-5">
          <h2 className="font-heading text-base font-bold">Add player</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Enroll someone in the arena</p>

          {isAdmin ? (
            <form onSubmit={handleAdd} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="employee-name" className="text-xs">
                  Full name
                </Label>
                <Input
                  id="employee-name"
                  placeholder="e.g. Creed Bratton"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="h-10 border-border bg-background/40 focus-visible:border-hot focus-visible:ring-hot/20"
                  maxLength={50}
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2 bg-hot font-semibold text-hot-foreground hover:bg-hot/90">
                <GiPerson className="h-4 w-4" />
                Add player
              </Button>
            </form>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <GiPadlock className="h-4 w-4 shrink-0" />
              <span>
                <Link href="/login" className="font-semibold text-hot hover:underline">
                  Sign in as admin
                </Link>{' '}
                to add players.
              </span>
            </p>
          )}
        </section>

        {/* Roster */}
        <section className="glass overflow-hidden rounded-3xl md:col-span-2">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <h2 className="font-heading text-sm font-bold">Active roster</h2>
            <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] tabular text-muted-foreground">
              {employees.length} players
            </span>
          </div>

          {employees.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground">
              <GiPerson className="mx-auto mb-2 h-10 w-10 opacity-30" />
              <p className="text-sm font-semibold">Roster is empty</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {employees.map((emp, i) => (
                <motion.li
                  key={emp.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.04]"
                >
                  <GameAvatar seed={emp.name} character={characters[emp.name]} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{emp.name}</p>
                    <p className="font-mono text-[10px] tabular text-muted-foreground">
                      joined{' '}
                      {new Date(emp.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(emp);
                          setEditedName(emp.name);
                          setIsEditOpen(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Rename {emp.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleting(emp);
                          setIsDeleteOpen(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                        title="Remove"
                      >
                        <GiTrashCan className="h-4 w-4" />
                        <span className="sr-only">Remove {emp.name}</span>
                      </Button>
                    </div>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Rename */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-heading">Rename player</DialogTitle>
            <DialogDescription>Updates their name everywhere immediately.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-3">
            <Label htmlFor="edit-name" className="text-xs">
              Name
            </Label>
            <Input
              id="edit-name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              maxLength={50}
              className="h-10"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-hot font-semibold text-hot-foreground hover:bg-hot/90">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-danger">
              <AlertTriangle className="h-5 w-5" />
              Remove player
            </DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold text-foreground">{deleting?.name}</span> from the arena? This also
              deletes all their logged strikes and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-3 gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Remove player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
