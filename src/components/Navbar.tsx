'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  GiHamburgerMenu,
  GiCancel,
  GiPodium,
  GiThunderStruck,
  GiScrollQuill,
  GiCalendar,
  GiPerson,
  GiGears,
  GiJerrycan,
  GiShieldBounces,
  GiScales,
} from 'react-icons/gi';
import { LogIn, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { isSupabaseConfigured } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/*
  No per-item accent colour here. The hot accent means exactly one thing in
  this UI — "you are here" — so tinting Strike permanently made it read as
  half-selected on every other page (and red in a nav reads as danger). The
  primary action already has its own CTA button on the dashboard.
*/
const NAV = [
  { name: 'Arena', href: '/', Icon: GiPodium },
  { name: 'Strike', href: '/quick-add', Icon: GiThunderStruck },
  { name: 'Log', href: '/history', Icon: GiScrollQuill },
  { name: 'Seasons', href: '/months', Icon: GiCalendar },
  { name: 'Roster', href: '/employees', Icon: GiPerson },
  { name: 'The Law', href: '/constitution', Icon: GiScales },
  { name: 'Config', href: '/settings', Icon: GiGears },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    setIsConnected(isSupabaseConfigured());
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    toast.success('Signed out.');
    router.push('/');
  };

  const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path));

  return (
    <>
      {/* Desktop icon rail — floating glass, like an arcade launcher */}
      <nav
        aria-label="Main"
        className="fixed left-4 top-1/2 z-50 hidden -translate-y-1/2 lg:block"
      >
        {/*
          No logo button here: it linked to "/" exactly like the Arena item
          directly below it, and its solid fill read as an active state on
          every other page. The rail is navigation; the brand lives in the
          top bar.
        */}
        <div className="glass flex flex-col items-center gap-1 rounded-3xl p-2.5">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-colors',
                  active
                    ? 'text-hot-foreground'
                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="rail-active"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-2xl bg-hot shadow-[0_6px_20px_-4px_var(--hot)]"
                  />
                )}
                <item.Icon className="relative h-5 w-5" />

                {/* Tooltip */}
                <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-popover px-2.5 py-1 text-xs font-semibold text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Top bar */}
      <header className="sticky top-0 z-40 w-full">
        {/* Veil: blurs + tints whatever scrolls beneath, fading out downward
            so the bar stays legible without a hard chrome edge. */}
        <div
          aria-hidden
          className="header-veil pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+1.75rem)] bg-gradient-to-b from-background/90 via-background/55 to-transparent"
        />
        <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-hot text-hot-foreground">
              <GiJerrycan className="h-5 w-5" />
            </span>
            <span className="font-heading text-lg font-bold uppercase tracking-widest">SwearJar</span>
          </Link>

          <Link
            href="/"
            className="hidden items-center gap-2.5 lg:flex"
            aria-label="SwearJar home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-hot text-hot-foreground">
              <GiJerrycan className="h-4 w-4" />
            </span>
            <span className="font-heading text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground">
              Office Arena
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium tabular sm:flex',
                isConnected ? 'border-clean/30 text-clean' : 'border-danger/40 text-danger'
              )}
              title={isConnected ? 'Connected to Supabase' : 'Supabase not configured'}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'bg-clean' : 'bg-danger')} />
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>

            {isAdmin ? (
              <button
                onClick={handleSignOut}
                className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-hot transition-colors hover:bg-hot/10"
                title="Sign out of admin"
              >
                <GiShieldBounces className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin</span>
                <LogOut className="h-3 w-3" />
              </button>
            ) : (
              <Link
                href="/login"
                className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            <ThemeToggle />

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="glass flex h-9 w-9 items-center justify-center rounded-full text-foreground lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <GiCancel className="h-4 w-4" /> : <GiHamburgerMenu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 lg:hidden"
          >
            <div className="glass-strong grid grid-cols-3 gap-2 rounded-2xl p-3">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold transition-colors',
                      active
                        ? 'bg-hot text-hot-foreground'
                        : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                    )}
                  >
                    <item.Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </header>
    </>
  );
}
