'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LayoutDashboard, Zap, History, Users, Settings, Calendar, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { isSupabaseConfigured } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

function JarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M8 4h8M9 4v3.5a3 3 0 0 1-.7 1.9L6.6 12a3 3 0 0 0-.6 1.8V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4.2a3 3 0 0 0-.6-1.8l-1.7-2.6A3 3 0 0 1 15 7.5V4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 15h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    setIsConnected(isSupabaseConfigured());
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    toast.success('Signed out.');
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Quick Add', href: '/quick-add', icon: Zap, highlight: true },
    { name: 'History', href: '/history', icon: History },
    { name: 'Monthly', href: '/months', icon: Calendar },
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-gold shadow-ledger group-hover:-rotate-3 transition-transform duration-200">
                <JarMark className="h-5 w-5" />
              </div>
              <span className="hidden font-heading font-semibold sm:inline-block text-lg tracking-wide uppercase text-foreground">
                SwearJar
              </span>
            </Link>

            <nav className="hidden md:flex items-center">
              {navigation.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors duration-150 border-b-2 ${
                      active
                        ? 'text-foreground border-gold'
                        : item.highlight
                        ? 'text-gold border-transparent hover:border-gold/40'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono tabular font-medium border ${
                isConnected
                  ? 'border-clean/30 text-clean'
                  : 'border-danger/30 text-danger'
              }`}
              title={isConnected ? 'Connected to Supabase Database' : 'Supabase not configured'}
            >
              <span className={`h-1.5 w-1.5 rounded-full mr-1 ${isConnected ? 'bg-clean' : 'bg-danger'}`} />
              <span>{isConnected ? 'DB online' : 'DB offline'}</span>
            </div>

            {isAdmin ? (
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
                title="Sign out of admin"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin</span>
                <LogOut className="h-3 w-3 ml-0.5" />
              </button>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                title="Sign in as admin"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Admin Sign In</span>
              </Link>
            )}

            <ThemeToggle />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground md:hidden transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle Menu</span>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 py-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                    active
                      ? 'bg-secondary text-foreground'
                      : item.highlight
                      ? 'text-gold'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Database</span>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono tabular font-medium border ${
                  isConnected ? 'border-clean/30 text-clean' : 'border-danger/30 text-danger'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-clean' : 'bg-danger'}`} />
                <span>{isConnected ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Admin</span>
              {isAdmin ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-gold/40 text-gold"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-border text-muted-foreground"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
