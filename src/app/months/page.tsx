'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, type Employee, type Swear } from '@/lib/db';
import {
  cn,
  formatCurrency,
  getInitials,
  getMonthYearKey,
  formatMonthYearKey,
  getOffenderRank,
} from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Flame,
  Coins,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const MEDAL_STYLES = [
  'bg-gold text-gold-foreground',
  'bg-muted-foreground/25 text-foreground',
  'bg-[#a8722c]/25 text-foreground',
];

const CHART_PALETTE = ['#a8722c', '#3f7a5e', '#a24a3a', '#4f6f8f', '#7c6a9b', '#8a8449', '#9b6b85', '#7a9481'];

export default function MonthsPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [swears, setSwears] = React.useState<Swear[]>([]);
  const [pricePerSwear, setPricePerSwear] = React.useState<number>(5);
  const [loading, setLoading] = React.useState(true);

  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const handleMonthChange = (val: string | null) => {
    setSelectedMonth(val || '');
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

        const now = new Date();
        const currentMonthKey = getMonthYearKey(now);

        const monthsSet = new Set<string>();
        monthsSet.add(currentMonthKey);
        sws.forEach((s) => {
          monthsSet.add(getMonthYearKey(new Date(s.created_at)));
        });
        const sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));

        if (sortedMonths.length > 1) {
          setSelectedMonth(sortedMonths[1]);
        } else {
          setSelectedMonth(currentMonthKey);
        }
      } catch (error) {
        console.error('Failed to load historical calculations data:', error);
        toast.error('Could not load monthly history data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const availableMonths = React.useMemo(() => {
    const monthsSet = new Set<string>();
    const now = new Date();
    monthsSet.add(getMonthYearKey(now));

    swears.forEach((s) => {
      monthsSet.add(getMonthYearKey(new Date(s.created_at)));
    });

    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [swears]);

  const selectedMonthSwears = React.useMemo(() => {
    if (!selectedMonth) return [];
    return swears.filter((s) => getMonthYearKey(new Date(s.created_at)) === selectedMonth);
  }, [swears, selectedMonth]);

  const stats = React.useMemo(() => {
    if (employees.length === 0 || selectedMonthSwears.length === 0) {
      return { totalSwears: 0, totalMoney: 0, averageSwears: 0 };
    }
    const totalSwears = selectedMonthSwears.length;
    const totalMoney = totalSwears * pricePerSwear;
    const averageSwears = parseFloat((totalSwears / employees.length).toFixed(1));

    return { totalSwears, totalMoney, averageSwears };
  }, [selectedMonthSwears, employees, pricePerSwear]);

  const leaderboard = React.useMemo(() => {
    const countMap: Record<string, number> = {};
    employees.forEach((emp) => {
      countMap[emp.id] = 0;
    });

    selectedMonthSwears.forEach((s) => {
      if (countMap[s.employee_id] !== undefined) {
        countMap[s.employee_id]++;
      }
    });

    const list = employees.map((emp) => ({
      ...emp,
      swearsCount: countMap[emp.id] || 0,
      amountOwed: (countMap[emp.id] || 0) * pricePerSwear,
    }));

    return list.sort((a, b) => b.swearsCount - a.swearsCount);
  }, [employees, selectedMonthSwears, pricePerSwear]);

  const chartData = React.useMemo(() => {
    return leaderboard
      .filter((item) => item.swearsCount > 0)
      .map((item) => ({
        name: item.name.split(' ')[0],
        fullName: item.name,
        swears: item.swearsCount,
        amount: item.amountOwed,
      }));
  }, [leaderboard]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded-md" />
          <div className="h-8 w-40 bg-muted rounded-md" />
        </div>
        <div className="h-10 w-48 bg-muted rounded-md" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-28 bg-muted border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight sm:text-3xl">Monthly Calculations</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">Browse past ledger states, month by month.</p>
          </div>
        </div>

        <div className="w-full sm:w-56 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground hidden sm:block" />
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="bg-card border-border font-medium text-sm">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((monthKey) => (
                <SelectItem key={monthKey} value={monthKey}>
                  {formatMonthYearKey(monthKey)} {monthKey === getMonthYearKey(new Date()) ? '(current)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMonthSwears.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border border-dashed border-border rounded-md p-8 text-center bg-card/40">
          <HelpCircle className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
          <h2 className="text-lg font-heading font-semibold text-foreground">No swears recorded</h2>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Nothing was logged during {selectedMonth ? formatMonthYearKey(selectedMonth) : 'this month'}.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Month Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border bg-card relative overflow-hidden">
              <div className="absolute right-3 top-3 opacity-10">
                <Flame className="h-16 w-16 text-danger" />
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Flame className="h-4 w-4 text-danger" />
                  <span>Total swears</span>
                </div>
                <p className="mt-2 text-3xl font-mono tabular font-semibold tracking-tight">{stats.totalSwears}</p>
                <p className="text-xs text-muted-foreground mt-2">In {formatMonthYearKey(selectedMonth)}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card relative overflow-hidden">
              <div className="absolute right-3 top-3 opacity-10">
                <Coins className="h-16 w-16 text-gold" />
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Coins className="h-4 w-4 text-gold" />
                  <span>Money accumulated</span>
                </div>
                <p className="mt-2 text-3xl font-mono tabular font-semibold tracking-tight text-gold">
                  {formatCurrency(stats.totalMoney)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">at {formatCurrency(pricePerSwear)} each</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card relative overflow-hidden">
              <div className="absolute right-3 top-3 opacity-10">
                <TrendingUp className="h-16 w-16 text-clean" />
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-clean" />
                  <span>Average swears</span>
                </div>
                <p className="mt-2 text-3xl font-mono tabular font-semibold tracking-tight">{stats.averageSwears}</p>
                <p className="text-xs text-muted-foreground mt-2">across {employees.length} employees</p>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card className="border-border bg-card shadow-ledger">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Historical leaderboard</CardTitle>
              <CardDescription>Rankings for {formatMonthYearKey(selectedMonth)}</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center">Rank</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-center">Swears</TableHead>
                      <TableHead className="text-right">Owed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((item, idx) => {
                      const rank = getOffenderRank(item.swearsCount);
                      const isMedalist = idx < 3 && item.swearsCount > 0;
                      return (
                        <TableRow key={item.id} className="transition-colors duration-150">
                          <TableCell className="text-center font-mono tabular font-semibold text-sm">
                            {isMedalist ? (
                              <span className={cn('inline-flex items-center justify-center h-6 w-6 rounded-full font-semibold', MEDAL_STYLES[idx])}>
                                {idx + 1}
                              </span>
                            ) : (
                              idx + 1
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'h-8 w-8 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-xs',
                                  item.avatar_color || 'bg-gray-400'
                                )}
                              >
                                {getInitials(item.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate max-w-[150px] sm:max-w-xs leading-tight">{item.name}</p>
                                <p className={cn('text-[11px] font-medium leading-tight', rank.colorClass)}>{rank.title}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono tabular font-semibold text-sm">
                            {item.swearsCount}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular font-semibold text-sm">
                            <span className={item.amountOwed > 0 ? 'text-gold' : 'text-muted-foreground font-normal'}>
                              {formatCurrency(item.amountOwed)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border bg-card shadow-ledger">
                <CardHeader>
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-muted-foreground" />
                    <span>Swears count</span>
                  </CardTitle>
                  <CardDescription>Absolute counts for {formatMonthYearKey(selectedMonth)}</CardDescription>
                </CardHeader>
                <CardContent className="h-72 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border px-3 py-2 rounded-md shadow-ledger text-xs">
                                <p className="font-semibold text-foreground">{data.fullName}</p>
                                <p className="text-muted-foreground mt-1 font-mono tabular">
                                  Swears: <span className="font-semibold text-foreground">{data.swears}</span>
                                </p>
                                <p className="text-gold font-semibold mt-0.5 font-mono tabular">{formatCurrency(data.amount)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="swears" radius={[3, 3, 0, 0]} maxBarSize={40}>
                        {chartData.map((_, index) => (
                          <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-ledger">
                <CardHeader>
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-muted-foreground" />
                    <span>Contribution share</span>
                  </CardTitle>
                  <CardDescription>Percentage of total month swears</CardDescription>
                </CardHeader>
                <CardContent className="h-72 flex items-center justify-center relative">
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="46%" innerRadius={56} outerRadius={76} paddingAngle={3} dataKey="swears">
                          {chartData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                              className="stroke-background hover:opacity-90 cursor-pointer outline-hidden"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const total = chartData.reduce((acc, curr) => acc + curr.swears, 0);
                              const percentage = ((data.swears / total) * 100).toFixed(1);
                              return (
                                <div className="bg-popover border border-border px-3 py-2 rounded-md shadow-ledger text-xs">
                                  <p className="font-semibold text-foreground">{data.fullName}</p>
                                  <p className="text-muted-foreground mt-1 font-mono tabular">{percentage}% of total</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="absolute bottom-2 left-0 right-0 flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 text-[10px] text-muted-foreground">
                    {chartData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }} />
                        <span>{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
