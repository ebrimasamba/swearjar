'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, isSupabaseConfigured } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Settings, Save, Database, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [price, setPrice] = React.useState<string>('5');
  const [loading, setLoading] = React.useState(true);
  const [isCloud, setIsCloud] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    async function loadSettings() {
      try {
        const p = await db.getPricePerSwear();
        setPrice(String(p));
        setIsCloud(isSupabaseConfigured());
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

  const handleResetDemoData = () => {
    if (confirm('Are you sure you want to restore the default seed data? All current local storage modifications will be lost.')) {
      db.resetLocalDemoData();
      toast.info('Local Storage reset! Reloading application...', {
        duration: 2000,
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  const handleSeedSupabase = async () => {
    if (!isCloud) return;
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
      {/* Title */}
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

      {/* Main Settings Card */}
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
              disabled={saving}
              className="bg-linear-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Connection & Diagnostics Card */}
      <Card className="border-border/40 bg-card/45 backdrop-blur-xs shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <span>Database Status & Tools</span>
          </CardTitle>
          <CardDescription>View system diagnostics and reset database tables</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* DB Mode indicator */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-secondary/30 border border-border/50">
            <div>
              <p className="text-sm font-bold">Connection Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCloud
                  ? 'Connected securely to Supabase Postgres database.'
                  : 'Running locally in web demo mode. Data is stored in your browser.'}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isCloud
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}
            >
              {isCloud ? 'Cloud (Supabase)' : 'Local Storage'}
            </span>
          </div>

          {/* Reset button based on DB type */}
          {!isCloud ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/25 bg-amber-500/5 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Demo Database Reset Option</p>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-normal">
                    This will delete all custom employees, swears, and settings currently stored in your browser's Local Storage, restoring the default Dunder Mifflin seed dataset.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleResetDemoData}
                className="border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 gap-2 w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Browser Demo Data
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">Supabase Cloud Database Seeding</p>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-normal">
                    If your Supabase database was just set up and is completely blank, click below to append seed employees (Michael Scott, Dwight Schrute, etc.) and mock swears for testing.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleSeedSupabase}
                className="border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 gap-2 w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Seed Supabase Database
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
