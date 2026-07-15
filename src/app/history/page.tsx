'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, type Employee, type Swear } from '@/lib/db';
import { getInitials, getRelativeTimeString, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  Trash2,
  Search,
  Users,
  Calendar,
  AlertCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function History() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [swears, setSwears] = React.useState<Swear[]>([]);
  const [pricePerSwear, setPricePerSwear] = React.useState<number>(5);
  const [loading, setLoading] = React.useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>('all');
  const handleEmployeeChange = (val: string | null) => {
    setSelectedEmployeeId(val || 'all');
  };

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
        console.error('Failed to load history data:', error);
        toast.error('Could not load history.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDeleteSwear = async (id: string, empName: string) => {
    try {
      await db.deleteSwear(id);
      setSwears((prev) => prev.filter((s) => s.id !== id));
      toast.success(`Deleted swear entry for ${empName}.`, {
        description: 'Jar totals updated.',
      });
    } catch (error) {
      console.error('Failed to delete swear:', error);
      toast.error('Failed to delete swear entry.');
    }
  };

  // Filtered swears list
  const filteredSwears = React.useMemo(() => {
    return swears
      .map((s) => {
        const emp = employees.find((e) => e.id === s.employee_id);
        return {
          ...s,
          employee: emp,
          employeeName: emp ? emp.name : 'Unknown Employee',
          avatarColor: emp ? emp.avatar_color : 'bg-gray-400',
        };
      })
      .filter((s) => {
        const matchesSearch = s.note
          ? s.note.toLowerCase().includes(searchQuery.toLowerCase())
          : searchQuery === '';
        
        const matchesEmployee =
          selectedEmployeeId === 'all' || s.employee_id === selectedEmployeeId;

        return matchesSearch && matchesEmployee;
      });
  }, [swears, employees, searchQuery, selectedEmployeeId]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded-lg" />
          <div className="h-8 w-36 bg-muted rounded-md" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-muted rounded-md" />
          <div className="h-10 w-44 bg-muted rounded-md" />
        </div>
        <Card className="border-border/40">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title block */}
      <div className="flex items-center gap-2">
        <Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Swear History</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Audit log of all language violations and fines.</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by swear notes or quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card/40 border-border/60 focus:border-amber-500 focus:ring-amber-500/20"
          />
        </div>

        {/* Employee select */}
        <div className="w-full sm:w-56">
          <Select value={selectedEmployeeId} onValueChange={handleEmployeeChange}>
            <SelectTrigger className="bg-card/40 border-border/60">
              <SelectValue placeholder="Filter by Employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History table */}
      <Card className="border-border/40 bg-card/45 backdrop-blur-xs shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Logged Entries</CardTitle>
          <CardDescription>
            Showing {filteredSwears.length} of {swears.length} total recorded swears
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {filteredSwears.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <HelpCircle className="h-10 w-10 mx-auto opacity-30 mb-2" />
              <p className="font-medium text-sm">No matches found</p>
              <p className="text-xs mt-1">Try resetting your search query or employee filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Employee</TableHead>
                    <TableHead>Slip-up / Note</TableHead>
                    <TableHead className="hidden md:table-cell">Date & Time</TableHead>
                    <TableHead className="table-cell md:hidden">Time</TableHead>
                    <TableHead className="text-right">Fine</TableHead>
                    <TableHead className="w-12 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSwears.map((item) => (
                    <TableRow key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs ${
                              item.avatarColor
                            }`}
                          >
                            {getInitials(item.employeeName)}
                          </div>
                          <span className="truncate max-w-[120px] sm:max-w-xs">{item.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] sm:max-w-md">
                        {item.note ? (
                          <span className="text-foreground text-sm italic font-medium">
                            &ldquo;{item.note}&rdquo;
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">No note provided</span>
                        )}
                      </TableCell>
                      {/* Desktop date */}
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(item.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-border">|</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {new Date(item.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </TableCell>
                      {/* Mobile relative time */}
                      <TableCell className="table-cell md:hidden text-muted-foreground text-xs whitespace-nowrap">
                        {getRelativeTimeString(item.created_at)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm text-amber-600 dark:text-amber-400">
                        {formatCurrency(pricePerSwear)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSwear(item.id, item.employeeName)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete Entry"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
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
  );
}
