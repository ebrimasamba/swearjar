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
} from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Flame,
  Coins,
  TrendingUp,
  Activity,
  BarChart2,
  PieChart as PieIcon,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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

export default function MonthsPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [swears, setSwears] = React.useState<Swear[]>([]);
  const [pricePerSwear, setPricePerSwear] = React.useState<number>(5);
  const [loading, setLoading] = React.useState(true);
  
  // Selected Month state (format: "YYYY-MM")
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

        // Pre-select the previous month if it exists, otherwise the current month
        const now = new Date();
        const currentMonthKey = getMonthYearKey(now);
        
        // Find months list
        const monthsSet = new Set<string>();
        monthsSet.add(currentMonthKey);
        sws.forEach((s) => {
          monthsSet.add(getMonthYearKey(new Date(s.created_at)));
        });
        const sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
        
        // Default selection: if there's a previous month, select it, otherwise select the current month.
        if (sortedMonths.length > 1) {
          // The second item in sorted descending is the previous month
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

  // Compile list of months that have activity (plus current month)
  const availableMonths = React.useMemo(() => {
    const monthsSet = new Set<string>();
    
    // Always include current month
    const now = new Date();
    monthsSet.add(getMonthYearKey(now));

    swears.forEach((s) => {
      monthsSet.add(getMonthYearKey(new Date(s.created_at)));
    });

    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [swears]);

  // Filter swears for the selected month
  const selectedMonthSwears = React.useMemo(() => {
    if (!selectedMonth) return [];
    return swears.filter((s) => getMonthYearKey(new Date(s.created_at)) === selectedMonth);
  }, [swears, selectedMonth]);

  // Calculate statistics for selected month
  const stats = React.useMemo(() => {
    if (employees.length === 0 || selectedMonthSwears.length === 0) {
      return { totalSwears: 0, totalMoney: 0, averageSwears: 0 };
    }
    const totalSwears = selectedMonthSwears.length;
    const totalMoney = totalSwears * pricePerSwear;
    const averageSwears = parseFloat((totalSwears / employees.length).toFixed(1));

    return { totalSwears, totalMoney, averageSwears };
  }, [selectedMonthSwears, employees, pricePerSwear]);

  // Leaderboard data for selected month
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

  // Chart data formatting for selected month
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

  const pieColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    '#f59e0b',
    '#ec4899',
    '#10b981',
    '#8b5cf6',
    '#ef4444',
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded-lg" />
          <div className="h-8 w-40 bg-muted rounded-md" />
        </div>
        <div className="h-10 w-48 bg-muted rounded-md" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-28 bg-muted border-border/40" />
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
          <Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Monthly Calculations</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">Browse historical leaderboard states month-by-month.</p>
          </div>
        </div>

        {/* Dropdown to pick month */}
        <div className="w-full sm:w-56 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground hidden sm:block" />
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="bg-card/40 border-border/60 font-semibold text-sm">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((monthKey) => (
                <SelectItem key={monthKey} value={monthKey}>
                  {formatMonthYearKey(monthKey)} {monthKey === getMonthYearKey(new Date()) ? '(Current)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMonthSwears.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border border-dashed border-border/60 rounded-2xl p-8 text-center bg-card/10">
          <HelpCircle className="h-12 w-12 text-muted-foreground opacity-30 mb-3 animate-pulse" />
          <h2 className="text-lg font-bold text-foreground">No Swears Recorded</h2>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Excellent! No swears were registered in the office during {selectedMonth ? formatMonthYearKey(selectedMonth) : 'this month'}.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Month Stats Card Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Total Swears */}
            <Card className="border-border/40 bg-card/65 backdrop-blur-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute right-3 top-3 opacity-10">
                <Flame className="h-16 w-16 text-rose-500" />
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Flame className="h-4 w-4 text-rose-500" />
                  <span>Total Swears</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">{stats.totalSwears}</span>
                  <span className="text-xs text-muted-foreground font-semibold">swears</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  In {formatMonthYearKey(selectedMonth)}
                </p>
              </CardContent>
            </Card>

            {/* Total Money */}
            <Card className="border-border/40 bg-card/65 backdrop-blur-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute right-3 top-3 opacity-10">
                <Coins className="h-16 w-16 text-amber-500" />
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span>Money Accumulated</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                    {formatCurrency(stats.totalMoney)}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">at {formatCurrency(pricePerSwear)}/ea</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total fines collected this month
                </p>
              </CardContent>
            </Card>

            {/* Average Swears */}
            <Card className="border-border/40 bg-card/65 backdrop-blur-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute right-3 top-3 opacity-10">
                <TrendingUp className="h-16 w-16 text-purple-500" />
              </div>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span>Average Swears</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">{stats.averageSwears}</span>
                  <span className="text-xs text-muted-foreground font-semibold">per employee</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Across {employees.length} active team members
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Month Leaderboard Table */}
          <Card className="border-border/40 bg-card/45 backdrop-blur-xs shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl font-bold">Historical Leaderboard</CardTitle>
                <CardDescription>Offender rankings for {formatMonthYearKey(selectedMonth)}</CardDescription>
              </div>
              <Trophy className="h-5 w-5 text-amber-500 animate-bounce" />
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center">Rank</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-center">Swears</TableHead>
                      <TableHead className="text-right">Amount Owed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((item, idx) => {
                      const isWinner = idx === 0 && item.swearsCount > 0;
                      return (
                        <TableRow
                          key={item.id}
                          className={cn(
                            'transition-colors duration-150',
                            isWinner
                              ? 'bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10 dark:hover:bg-amber-500/15'
                              : ''
                          )}
                        >
                          <TableCell className="text-center font-bold text-sm">
                            {isWinner ? (
                              <span className="inline-flex items-center justify-center bg-amber-500 text-white rounded-full p-1 shadow-sm">
                                <Trophy className="h-4 w-4" />
                              </span>
                            ) : (
                              idx + 1
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs',
                                  item.avatar_color || 'bg-gray-400'
                                )}
                              >
                                {getInitials(item.name)}
                              </div>
                              <span className="truncate max-w-[150px] sm:max-w-xs">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-sm">
                            {item.swearsCount}
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm text-foreground">
                            <span
                              className={cn(
                                item.amountOwed > 0
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-muted-foreground font-normal'
                              )}
                            >
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

          {/* Month Charts */}
          {chartData.length > 0 && (
            <div className="grid gap-8 md:grid-cols-2">
              {/* Bar Chart */}
              <Card className="border-border/40 bg-card/45 backdrop-blur-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-muted-foreground" />
                    <span>Swears Count</span>
                  </CardTitle>
                  <CardDescription>Absolute counts comparison for {formatMonthYearKey(selectedMonth)}</CardDescription>
                </CardHeader>
                <CardContent className="h-80 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border px-3 py-2 rounded-lg shadow-md text-xs">
                                <p className="font-bold text-foreground">{data.fullName}</p>
                                <p className="text-muted-foreground mt-1">
                                  Swears: <span className="font-bold text-foreground">{data.swears}</span>
                                </p>
                                <p className="text-amber-500 font-semibold mt-0.5">
                                  Fines: <span>{formatCurrency(data.amount)}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="swears"
                        fill="url(#monthBarGradient)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                      <defs>
                        <linearGradient id="monthBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card className="border-border/40 bg-card/45 backdrop-blur-xs">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-muted-foreground" />
                    <span>Contribution Share</span>
                  </CardTitle>
                  <CardDescription>Percentage distribution of total month swears</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center relative">
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="swears"
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={pieColors[index % pieColors.length]}
                              className="stroke-background hover:opacity-95 cursor-pointer outline-hidden"
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
                                <div className="bg-popover border border-border px-3 py-2 rounded-lg shadow-md text-xs">
                                  <p className="font-bold text-foreground">{data.fullName}</p>
                                  <p className="text-muted-foreground mt-1">
                                    Swears: <span className="font-bold text-foreground">{data.swears}</span>
                                  </p>
                                  <p className="text-muted-foreground mt-0.5">
                                    Share: <span className="font-bold text-foreground">{percentage}%</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend overlay */}
                  <div className="absolute bottom-4 left-0 right-0 flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 text-[10px] text-muted-foreground">
                    {chartData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: pieColors[index % pieColors.length] }}
                        />
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
