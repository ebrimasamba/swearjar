'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, isSupabaseConfigured } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Save, Database, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SettingsPage() {
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
        const p = await db.getPricePerSwear();
        setPrice(String(p));
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load price setting.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast.warning('Please enter a valid price (0 or greater).');
      return;
    }

    setSaving(true);
    try {
      await db.updatePricePerSwear(numericPrice);
      toast.success('Settings saved successfully!', {
        description: `Price per swear is now ${formatCurrency(numericPrice)}.`,
      });
    } catch (error) {
      console.error('Failed to save price:', error);
      toast.error('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedSupabase = async () => {
    if (!isConnected) return;
    if (confirm('Seed the Supabase database with sample data? This will append the seed roster and mock swears.')) {
      try {
        await db.seedSupabase();
        toast.success('Supabase seeded successfully! Reloading...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } catch (error) {
        console.error('Failed to seed Supabase:', error);
        toast.error('Failed to seed Supabase database.');
      }
    }
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to delete all employees and swears from your Supabase database? This will clear everything so you can start with a completely empty roster.')) {
      try {
        await db.clearAllData();
        toast.success('All database records cleared successfully!', {
          description: 'Ready for new entries.',
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } catch (error) {
        console.error('Failed to clear data:', error);
        toast.error('Failed to clear database records.');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded-lg" />
          <div className="h-8 w-32 bg-muted rounded-md" />
        </div>
        <Card className="h-60 bg-muted border-border/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Settings</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Configure your swear jar program preferences.</p>
        </div>
      </div>

      {!isConnected && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Supabase not configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Set <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment to use the app.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/40 bg-card/45 backdrop-blur-xs shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold">General Preferences</CardTitle>
          <CardDescription>Adjust the fine amount and other core parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePrice} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price-per-swear">Price per Swear (USD)</Label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-3.5 text-sm font-semibold text-muted-foreground">$</span>
                <Input
                  id="price-per-swear"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7 bg-background/80 border-border/60 font-semibold"
                  disabled={!isConnected}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Amount charged for each registered swear. Live Preview:{' '}
                <span className="font-semibold text-foreground">
                  10 swears = {formatCurrency(parseFloat(price || '0') * 10)}
                </span>
                .
              </p>
            </div>
            <Button
              type="submit"
              disabled={saving || !isConnected}
              className="bg-linear-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/45 backdrop-blur-xs shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <span>Database Status & Tools</span>
          </CardTitle>
          <CardDescription>View system diagnostics and manage database tables</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-secondary/30 border border-border/50">
            <div>
              <p className="text-sm font-bold">Connection Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isConnected
                  ? 'Connected securely to Supabase Postgres database.'
                  : 'Supabase environment variables are not configured.'}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}
            >
              {isConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>

          {isConnected && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Supabase Database Seeding</p>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-normal">
                    If your Supabase database was just set up and is completely blank, click below to append seed employees (Michael Scott, Dwight Schrute, etc.) and mock swears for testing.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleSeedSupabase}
                  className="border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 gap-2 w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  Seed Supabase Database
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearAllData}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Database (Start Fresh)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
