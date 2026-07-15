'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, type Employee } from '@/lib/db';
import { getInitials, cn } from '@/lib/utils';
import {
  ArrowLeft,
  UserPlus,
  Edit2,
  Trash2,
  AlertTriangle,
  Users,
  Calendar,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { toast } from 'sonner';

export default function Employees() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Forms states
  const [newEmployeeName, setNewEmployeeName] = React.useState('');
  
  // Dialog controls
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [editedName, setEditedName] = React.useState('');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deletingEmployee, setDeletingEmployee] = React.useState<Employee | null>(null);

  React.useEffect(() => {
    async function loadEmployees() {
      try {
        const emps = await db.getEmployees();
        setEmployees(emps);
      } catch (error) {
        console.error('Failed to load employees:', error);
        toast.error('Failed to load employee list.');
      } finally {
        setLoading(false);
      }
    }
    loadEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newEmployeeName.trim();
    if (!name) {
      toast.warning('Name cannot be empty.');
      return;
    }

    try {
      const newEmp = await db.addEmployee(name);
      setEmployees((prev) => [...prev, newEmp].sort((a, b) => a.name.localeCompare(b.name)));
      setNewEmployeeName('');
      toast.success(`Successfully added ${name}!`);
    } catch (error) {
      console.error('Failed to add employee:', error);
      toast.error('Error adding employee.');
    }
  };

  const handleOpenEditDialog = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditedName(emp.name);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;
    const name = editedName.trim();
    if (!name) {
      toast.warning('Name cannot be empty.');
      return;
    }

    try {
      const updated = await db.updateEmployee(editingEmployee.id, name);
      setEmployees((prev) =>
        prev
          .map((e) => (e.id === editingEmployee.id ? updated : e))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
      toast.success(`Name updated to ${name}.`);
    } catch (error) {
      console.error('Failed to update employee name:', error);
      toast.error('Error updating employee.');
    }
  };

  const handleOpenDeleteDialog = (emp: Employee) => {
    setDeletingEmployee(emp);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;

    try {
      await db.deleteEmployee(deletingEmployee.id);
      setEmployees((prev) => prev.filter((e) => e.id !== deletingEmployee.id));
      setIsDeleteDialogOpen(false);
      setDeletingEmployee(null);
      toast.success(`Removed ${deletingEmployee.name} from the roster.`, {
        description: 'All associated swear records have been deleted.',
      });
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast.error('Error removing employee.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded-lg" />
          <div className="h-8 w-40 bg-muted rounded-md" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="h-40 bg-muted border-border/40" />
          <Card className="h-48 md:col-span-2 bg-muted border-border/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Manage Employees</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Add, rename, or remove team members from the tracker.</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Side: Add Form */}
        <Card className="border-border/40 bg-card/45 backdrop-blur-xs h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Add Employee</CardTitle>
            <CardDescription>Enroll a new offender in the swear jar program</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee-name">Full Name</Label>
                <Input
                  id="employee-name"
                  placeholder="e.g. Creed Bratton"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="bg-background/80 border-border/60"
                  maxLength={50}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-linear-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium gap-2">
                <UserPlus className="h-4 w-4" />
                Add Employee
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Side: Roster Table */}
        <Card className="md:col-span-2 border-border/40 bg-card/45 backdrop-blur-xs shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span>Roster</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-secondary text-muted-foreground border rounded-full">
                {employees.length} Active
              </span>
            </CardTitle>
            <CardDescription>All employees registered in the system</CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {employees.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <p className="font-semibold text-sm">Roster is empty</p>
                <p className="text-xs mt-1">Use the panel on the left to add your first employee.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Employee</TableHead>
                      <TableHead className="hidden sm:table-cell">Added Date</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-secondary/20 transition-colors">
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs',
                                emp.avatar_color || 'bg-gray-400'
                              )}
                            >
                              {getInitials(emp.name)}
                            </div>
                            <span className="truncate max-w-[150px] sm:max-w-xs">{emp.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {new Date(emp.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditDialog(emp)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                              title="Edit Name"
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDeleteDialog(emp)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete Employee"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Employee</DialogTitle>
            <DialogDescription>
              Update the name for this team member. This change updates all dashboard stats immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                maxLength={50}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-amber-500 hover:bg-amber-600 text-white font-medium">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-destructive/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Confirm Deletion</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-semibold text-foreground">{deletingEmployee?.name}</span>?
              <br />
              This action <span className="font-bold text-destructive">cannot be undone</span>. All associated swear logs and contributions will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Roster Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
