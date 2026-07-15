'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Menu, X, LayoutDashboard, Zap, History, Users, Settings, Cloud, Calendar } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { isSupabaseConfigured } from '@/lib/db';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    setIsConnected(isSupabaseConfigured());
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Quick Add', href: '/quick-add', icon: Zap, highlight: true },
    { name: 'History', href: '/history', icon: History },
    { name: 'Monthly Calculations', href: '/months', icon: Calendar },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-amber-500 to-rose-500 shadow-md group-hover:scale-105 transition-transform duration-200">
                <Flame className="h-5 w-5 text-white animate-pulse" />
              </div>
              <span className="hidden font-bold sm:inline-block text-xl tracking-tight bg-linear-to-r from-amber-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">
                SwearJar
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      item.highlight
                        ? active
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          : 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/10 hover:bg-amber-500/10 hover:border-amber-500/20'
                        : active
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${item.highlight ? 'animate-pulse text-amber-500' : ''}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400'
              }`}
              title={isConnected ? 'Connected to Supabase Database' : 'Supabase not configured'}
            >
              <Cloud className="h-3 w-3" />
              <span>{isConnected ? 'Supabase' : 'Not Connected'}</span>
            </div>

            <ThemeToggle />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle Menu</span>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 py-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-2">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                    item.highlight
                      ? active
                        ? 'bg-amber-500/25 text-amber-500 border border-amber-500/40'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : active
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${item.highlight ? 'text-amber-500' : ''}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Database Status:</span>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isConnected
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}
              >
                <Cloud className="h-3 w-3" />
                <span>{isConnected ? 'Supabase' : 'Not Connected'}</span>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
