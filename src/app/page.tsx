'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, type Employee, type Swear } from '@/lib/db';
import {
  cn,
  formatCurrency,
  getInitials,
  isSameMonthAndYear,
} from '@/lib/utils';
import {
  Trophy,
  Flame,
  Coins,
  TrendingUp,
  Activity,
  UserPlus,
  Plus,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function Dashboard() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [swears, setSwears] = React.useState<Swear[]>([]);
  const [pricePerSwear, setPricePerSwear] = React.useState<number>(5);
  const [loading, setLoading] = React.useState(true);

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
        console.error('Failed to load dashboard data:', error);
        toast.error('Could not load data. Check database settings.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter swears for current month
  const currentMonthSwears = React.useMemo(() => {
    const now = new Date();
    return swears.filter((s) => isSameMonthAndYear(new Date(s.created_at), now));
  }, [swears]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (employees.length === 0) {
      return { totalSwears: 0, totalMoney: 0, averageSwears: 0 };
    }
    const totalSwears = currentMonthSwears.length;
    const totalMoney = totalSwears * pricePerSwear;
    const averageSwears = parseFloat((totalSwears / employees.length).toFixed(1));

    return { totalSwears, totalMoney, averageSwears };
  }, [currentMonthSwears, employees, pricePerSwear]);

  // Leaderboard data - current month
  const leaderboard = React.useMemo(() => {
    // Count swears per employee this month
    const countMap: Record<string, number> = {};
    employees.forEach((emp) => {
      countMap[emp.id] = 0;
    });

    currentMonthSwears.forEach((s) => {
      if (countMap[s.employee_id] !== undefined) {
        countMap[s.employee_id]++;
      }
    });

    // Map to list and sort
    const list = employees.map((emp) => ({
      ...emp,
      swearsCount: countMap[emp.id] || 0,
      amountOwed: (countMap[emp.id] || 0) * pricePerSwear,
    }));

    // Sort by count descending
    return list.sort((a, b) => b.swearsCount - a.swearsCount);
  }, [employees, currentMonthSwears, pricePerSwear]);

  const maxSwears = React.useMemo(() => {
    if (leaderboard.length === 0) return 0;
    return Math.max(...leaderboard.map((item) => item.swearsCount));
  }, [leaderboard]);

  // Recent activity - last 5 swears overall (with employee details)
  const recentActivity = React.useMemo(() => {
    return swears
      .slice(0, 5)
      .map((s) => {
        const emp = employees.find((e) => e.id === s.employee_id);
        return {
          ...s,
          employeeName: emp ? emp.name : 'Unknown Employee',
          avatarColor: emp ? emp.avatar_color : 'bg-gray-400',
        };
      });
  }, [swears, employees]);

  // Chart data formatting
  const chartData = React.useMemo(() => {
    return leaderboard
      .filter((item) => item.swearsCount > 0)
      .map((item) => ({
        name: item.name.split(' ')[0], // First name for compact display
        fullName: item.name,
        swears: item.swearsCount,
        amount: item.amountOwed,
      }));
  }, [leaderboard]);

  // Color mapping for Pie Chart
  const pieColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#8b5cf6', // Violet
    '#ef4444', // Red
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-muted rounded-md" />
          <div className="h-4 w-72 bg-muted rounded-md" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/40">
              <CardContent className="pt-6">
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/40">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="border-border/40">
              <CardHeader>
                <div className="h-6 w-28 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If there are no employees, display the empty state.
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 text-amber-500 animate-bounce">
          <Flame className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-linear-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent mb-3">
          No Employees Added Yet
        </h1>
        <p className="text-muted-foreground max-w-md mb-8">
          SwearJar requires employees to track language! Get started by adding your colleagues to begin monitoring swears and building your office leaderboard.
        </p>
        <Link href="/employees">
          <Button size="lg" className="bg-linear-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-lg hover:scale-105 transition-all text-white font-medium gap-2">
            <UserPlus className="w-5 h-5" />
            Add First Employee
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-linear-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Office Swear Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1 sm:text-base">
            Keeping conversations clean, one swear at a time. Stats for{' '}
            <span className="font-semibold text-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            .
          </p>
        </div>
        <Link href="/quick-add">
          <Button
            size="lg"
            className="bg-linear-to-tr from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-md hover:shadow-lg text-white font-semibold transition-all hover:scale-105 active:scale-95 gap-2"
          >
            <Zap className="h-5 w-5 fill-white animate-pulse" />
            Quick Add Swear
          </Button>
        </Link>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Swears */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 group-hover:scale-110 group-hover:opacity-15 transition-transform duration-300">
            <Flame className="h-20 w-20 text-rose-500" />
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Flame className="h-4 w-4 text-rose-500 animate-pulse" />
              <span>Total Swears (Month)</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight">{stats.totalSwears}</span>
              <span className="text-xs text-muted-foreground font-semibold">swears</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Registered in {new Date().toLocaleDateString('en-US', { month: 'short' })}
            </p>
          </CardContent>
        </Card>

        {/* Total Money */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 group-hover:scale-110 group-hover:opacity-15 transition-transform duration-300">
            <Coins className="h-20 w-20 text-amber-500" />
          </div>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Coins className="h-4 w-4 text-amber-500" />
              <span>Money Owed</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                {formatCurrency(stats.totalMoney)}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">at {formatCurrency(pricePerSwear)}/ea</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Collected toward the office jar
            </p>
          </CardContent>
        </Card>

        {/* Average Swears */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xs relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 group-hover:scale-110 group-hover:opacity-15 transition-transform duration-300">
            <TrendingUp className="h-20 w-20 text-purple-500" />
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

      {/* Main Leaderboard Table and Activity Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Leaderboard Table (2/3 width) */}
        <Card className="lg:col-span-2 border-border/40 bg-card/45 backdrop-blur-xs shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold">Top Offenders</CardTitle>
              <CardDescription>Ranked by swears committed this month</CardDescription>
            </div>
            <Trophy className="h-5 w-5 text-amber-500" />
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
                            <span className="truncate max-w-[140px] sm:max-w-xs">{item.name}</span>
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

        {/* Recent Activity List (1/3 width) */}
        <Card className="border-border/40 bg-card/45 backdrop-blur-xs shadow-xs flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold flex items-center justify-between">
              <span>Recent Activity</span>
              <Activity className="h-4 w-4 text-rose-500 animate-pulse" />
            </CardTitle>
            <CardDescription>Latest language violations</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <HelpCircle className="h-8 w-8 mx-auto opacity-30 mb-2" />
                  No swears recorded yet. Good job!
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 items-start p-2 rounded-lg hover:bg-secondary/40 transition-colors"
                  >
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-xs',
                        activity.avatarColor
                      )}
                    >
                      {getInitials(activity.employeeName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {activity.employeeName}
                      </p>
                      <p className="text-xs text-muted-foreground italic truncate mt-0.5">
                        &ldquo;{activity.note || 'Swore without an explanation'}&rdquo;
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(activity.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {recentActivity.length > 0 && (
              <div className="pt-4 mt-4 border-t border-border/40">
                <Link
                  href="/history"
                  className="inline-flex items-center text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors gap-1 group"
                >
                  View full history
                  <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Section (Charts) */}
      {chartData.length > 0 && (
        <div className="grid gap-8 md:grid-cols-2">
          {/* Bar Chart */}
          <Card className="border-border/40 bg-card/45 backdrop-blur-xs">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Swears by Employee</CardTitle>
              <CardDescription>Comparing absolute counts (current month)</CardDescription>
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
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
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
              <CardTitle className="text-lg font-bold">Contribution Share</CardTitle>
              <CardDescription>Percentage distribution of total swears</CardDescription>
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
              
              {/* Legend overlay inside card */}
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
  );
}
