'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, isSupabaseConfigured } from '@/lib/db';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { GiGears, GiPadlock, GiTwoCoins, GiTrashCan, GiPerspectiveDiceSixFacesRandom } from 'react-icons/gi';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [price, setPrice] = React.useState<string>('5');
  const [loading, setLoading] = React.useState(true);
  const [isConnected, setIsConnected] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    async function loadSettings() {
      setIsConnected(isSupabaseConfigured());
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      try {
        setPrice(String(await db.getPricePerSwear()));
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load the price setting.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast.warning('Enter a price of 0 or greater.');
      return;
    }
    setSaving(true);
    try {
      await db.updatePricePerSwear(numericPrice);
      toast.success('Settings saved.', { description: `Each strike now costs ${formatCurrency(numericPrice)}.` });
    } catch (error) {
      console.error('Failed to save price:', error);
      toast.error('Could not save settings. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!isConnected || !isAdmin) return;
    if (confirm('Seed the database with sample players and strikes?')) {
      try {
        await db.seedSupabase();
        toast.success('Sample data added. Reloading…');
        setTimeout(() => (window.location.href = '/'), 1500);
      } catch (error) {
        console.error('Failed to seed Supabase:', error);
        toast.error('Could not seed the database.');
      }
    }
  };

  const handleClear = async () => {
    if (!isAdmin) return;
    if (confirm('Delete all players and strikes? This cannot be undone.')) {
      try {
        await db.clearAllData();
        toast.success('Database cleared.', { description: 'Ready for a fresh season.' });
        setTimeout(() => (window.location.href = '/'), 1500);
      } catch (error) {
        console.error('Failed to clear data:', error);
        toast.error('Could not clear the database.');
      }
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-foreground/10" />
        <div className="h-52 animate-pulse rounded-3xl bg-foreground/10" />
        <div className="h-52 animate-pulse rounded-3xl bg-foreground/10" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="glass inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-hot">Config</p>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Settings</h1>
        </div>
      </div>

      {!isConnected && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm font-semibold text-danger">Supabase not configured</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment.
          </p>
        </div>
      )}

      {!isAdmin && (
        <div className="glass flex items-center gap-2 rounded-2xl p-4 text-sm text-muted-foreground">
          <GiPadlock className="h-4 w-4 shrink-0" />
          <span>
            <Link href="/login" className="font-semibold text-hot hover:underline">
              Sign in as admin
            </Link>{' '}
            to change settings or manage the database.
          </span>
        </div>
      )}

      {/* Price */}
      <section className="glass rounded-3xl p-5">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold">
          <GiTwoCoins className="h-5 w-5 text-gold" />
          Strike price
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">What each swear costs the offender</p>

        <form onSubmit={handleSavePrice} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="price-per-swear" className="text-xs">
              Price per strike
            </Label>
            <div className="relative max-w-[180px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold text-muted-foreground">
                D
              </span>
              <Input
                id="price-per-swear"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-10 border-border bg-background/40 pl-7 font-mono font-semibold tabular focus-visible:border-hot focus-visible:ring-hot/20"
                disabled={!isConnected || !isAdmin}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              10 strikes ={' '}
              <span className="font-mono font-semibold tabular text-gold">
                {formatCurrency(parseFloat(price || '0') * 10)}
              </span>
            </p>
          </div>
          <Button
            type="submit"
            disabled={saving || !isConnected || !isAdmin}
            className="gap-2 bg-hot font-semibold text-hot-foreground hover:bg-hot/90"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </form>
      </section>

      {/* Database */}
      <section className="glass rounded-3xl p-5">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold">
          <GiGears className="h-5 w-5 text-muted-foreground" />
          Database
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Connection status and data tools</p>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-background/30 p-3.5">
          <div>
            <p className="text-sm font-semibold">Connection</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isConnected ? 'Connected to Supabase Postgres.' : 'Environment variables are not set.'}
            </p>
          </div>
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium tabular',
              isConnected ? 'border-clean/30 text-clean' : 'border-danger/40 text-danger'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'bg-clean' : 'bg-danger')} />
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {isConnected && isAdmin && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleSeed}
              className="w-full gap-2 border-gold/30 hover:bg-gold/10 hover:text-gold sm:w-auto"
            >
              <GiPerspectiveDiceSixFacesRandom className="h-4 w-4" />
              Seed sample data
            </Button>
            <Button variant="destructive" onClick={handleClear} className="w-full gap-2 sm:w-auto">
              <GiTrashCan className="h-4 w-4" />
              Clear database
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
