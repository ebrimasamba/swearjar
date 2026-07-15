'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, type Employee, type Swear } from '@/lib/db';
import {
  cn,
  formatCurrency,
  getInitials,
  isSameMonthAndYear,
  getOffenderRank,
  getStreakDays,
} from '@/lib/utils';
import {
  Flame,
  UserPlus,
  HelpCircle,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SwearJar } from '@/components/SwearJar';
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

  // Lifetime jar total — this is the number the physical jar represents.
  const lifetimeTotal = React.useMemo(() => swears.length * pricePerSwear, [swears, pricePerSwear]);

  // Leaderboard data - current month
  const leaderboard = React.useMemo(() => {
    const countMap: Record<string, number> = {};
    employees.forEach((emp) => {
      countMap[emp.id] = 0;
    });

    currentMonthSwears.forEach((s) => {
      if (countMap[s.employee_id] !== undefined) {
        countMap[s.employee_id]++;
      }
    });

    const list = employees.map((emp) => ({
      ...emp,
      swearsCount: countMap[emp.id] || 0,
      amountOwed: (countMap[emp.id] || 0) * pricePerSwear,
      streakDays: getStreakDays(swears, emp.id),
    }));

    return list.sort((a, b) => b.swearsCount - a.swearsCount);
  }, [employees, currentMonthSwears, pricePerSwear, swears]);

  // Recent activity - last 5 swears overall (with employee details)
  const recentActivity = React.useMemo(() => {
    return swears.slice(0, 5).map((s) => {
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
        name: item.name.split(' ')[0],
        fullName: item.name,
        swears: item.swearsCount,
        amount: item.amountOwed,
      }));
  }, [leaderboard]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-muted rounded-md" />
          <div className="h-4 w-72 bg-muted rounded-md" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="h-72 bg-muted border-border lg:col-span-1" />
          <Card className="h-72 bg-muted border-border lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-md bg-primary flex items-center justify-center mb-6 text-gold">
          <Flame className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight sm:text-3xl mb-3">
          No employees on the roster
        </h1>
        <p className="text-muted-foreground max-w-md mb-8">
          The ledger needs names before it can track anything. Add your first colleague to start the jar.
        </p>
        <Link href="/employees">
          <Button size="lg" className="bg-gold hover:bg-gold/90 text-gold-foreground font-medium gap-2">
            <UserPlus className="w-5 h-5" />
            Add first employee
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono tabular uppercase tracking-widest text-gold mb-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ledger
          </p>
          <h1 className="text-3xl font-heading font-semibold tracking-tight sm:text-4xl">
            Office Swear Ledger
          </h1>
        </div>
        <Link href="/quick-add">
          <Button
            size="lg"
            className="bg-gold hover:bg-gold/90 text-gold-foreground font-medium transition-transform active:scale-95 gap-2"
          >
            <Zap className="h-5 w-5" />
            Quick add swear
          </Button>
        </Link>
      </div>

      {/* Hero: the jar + this month's ledger, asymmetric */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 border-border bg-card shadow-ledger flex items-center justify-center py-8">
          <SwearJar amount={lifetimeTotal} label="Office fund" />
        </Card>

        <Card className="lg:col-span-3 border-border bg-card shadow-ledger">
          <CardHeader>
            <CardTitle className="font-heading text-lg">This month, so far</CardTitle>
            <CardDescription>Live tally across the whole office</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-4xl font-mono tabular font-semibold">{stats.totalSwears}</p>
              <p className="text-xs text-muted-foreground mt-1">swears logged</p>
            </div>
            <div>
              <p className="text-4xl font-mono tabular font-semibold text-gold">
                {formatCurrency(stats.totalMoney)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">at {formatCurrency(pricePerSwear)} each</p>
            </div>
            <div>
              <p className="text-4xl font-mono tabular font-semibold">{stats.averageSwears}</p>
              <p className="text-xs text-muted-foreground mt-1">avg per employee</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border bg-card shadow-ledger">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-heading text-lg">Most cited</CardTitle>
              <CardDescription>Ranked by swears this month</CardDescription>
            </div>
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
                            <span
                              className={cn(
                                'inline-flex items-center justify-center h-6 w-6 rounded-full font-semibold',
                                MEDAL_STYLES[idx]
                              )}
                            >
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
                                'h-8 w-8 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0',
                                item.avatar_color || 'bg-gray-400'
                              )}
                            >
                              {getInitials(item.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate max-w-[140px] sm:max-w-xs leading-tight">{item.name}</p>
                              <p className={cn('text-[11px] font-medium leading-tight', rank.colorClass)}>
                                {rank.title}
                                {item.streakDays !== null && item.swearsCount === 0 && (
                                  <span className="text-muted-foreground font-normal">
                                    {' '}
                                    · {item.streakDays}d clean
                                  </span>
                                )}
                              </p>
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

        {/* Recent Activity List */}
        <Card className="border-border bg-card shadow-ledger flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg">Recent activity</CardTitle>
            <CardDescription>Latest citations logged</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <HelpCircle className="h-8 w-8 mx-auto opacity-30 mb-2" />
                  No swears recorded yet.
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3 items-start p-2 rounded-md hover:bg-secondary/40 transition-colors">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-xs',
                        activity.avatarColor
                      )}
                    >
                      {getInitials(activity.employeeName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{activity.employeeName}</p>
                      <p className="text-xs text-muted-foreground italic truncate mt-0.5">
                        &ldquo;{activity.note || 'No note left'}&rdquo;
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono tabular">
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
              <div className="pt-4 mt-4 border-t border-border">
                <Link
                  href="/history"
                  className="inline-flex items-center text-xs font-semibold text-gold hover:text-gold/80 transition-colors gap-1 group"
                >
                  View full history
                  <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-card shadow-ledger">
            <CardHeader>
              <CardTitle className="font-heading text-base">Swears by employee</CardTitle>
              <CardDescription>Counts for the current month</CardDescription>
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
              <CardTitle className="font-heading text-base">Contribution share</CardTitle>
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
  );
}
