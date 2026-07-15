'use client';

import * as React from 'react';
import Link from 'next/link';
import { db, isSupabaseConfigured } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Save, Database, RefreshCw, Trash2, ShieldAlert, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    if (!isAdmin) return;
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast.warning('Enter a price of 0 or greater.');
      return;
    }

    setSaving(true);
    try {
      await db.updatePricePerSwear(numericPrice);
      toast.success('Settings saved.', {
        description: `Price per swear is now ${formatCurrency(numericPrice)}.`,
      });
    } catch (error) {
      console.error('Failed to save price:', error);
      toast.error('Could not save settings. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedSupabase = async () => {
    if (!isConnected || !isAdmin) return;
    if (confirm('Seed the database with sample employees and swears?')) {
      try {
        await db.seedSupabase();
        toast.success('Database seeded. Reloading...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } catch (error) {
        console.error('Failed to seed Supabase:', error);
        toast.error('Could not seed the database.');
      }
    }
  };

  const handleClearAllData = async () => {
    if (!isAdmin) return;
    if (confirm('Delete all employees and swears? This cannot be undone.')) {
      try {
        await db.clearAllData();
        toast.success('Database cleared.', {
          description: 'Ready for a fresh start.',
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } catch (error) {
        console.error('Failed to clear data:', error);
        toast.error('Could not clear the database.');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded-md" />
          <div className="h-8 w-32 bg-muted rounded-md" />
        </div>
        <Card className="h-60 bg-muted border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight sm:text-3xl">Settings</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Fine amount and database tools.</p>
        </div>
      </div>

      {!isConnected && (
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-danger">Supabase not configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Set <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment to use the app.
            </p>
          </CardContent>
        </Card>
      )}

      {!isAdmin && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              <Link href="/login" className="font-medium text-foreground hover:underline">
                Sign in as admin
              </Link>{' '}
              to change settings or manage the database.
            </span>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card shadow-ledger">
        <CardHeader>
          <CardTitle className="font-heading text-lg">General preferences</CardTitle>
          <CardDescription>Adjust the fine charged per swear</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePrice} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price-per-swear">Price per swear</Label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-2 text-sm font-semibold text-muted-foreground">D</span>
                <Input
                  id="price-per-swear"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7 bg-background border-border font-mono tabular font-semibold"
                  disabled={!isConnected || !isAdmin}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                10 swears = <span className="font-mono tabular font-semibold text-foreground">{formatCurrency(parseFloat(price || '0') * 10)}</span>
              </p>
            </div>
            <Button
              type="submit"
              disabled={saving || !isConnected || !isAdmin}
              className="bg-gold hover:bg-gold/90 text-gold-foreground font-medium gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-ledger">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <span>Database status &amp; tools</span>
          </CardTitle>
          <CardDescription>Connection diagnostics and data management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-3.5 rounded-md bg-secondary/40 border border-border">
            <div>
              <p className="text-sm font-semibold">Connection</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isConnected ? 'Connected to Supabase Postgres.' : 'Supabase environment variables are not set.'}
              </p>
            </div>
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono tabular font-medium border ${
                isConnected ? 'border-clean/30 text-clean' : 'border-danger/30 text-danger'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-clean' : 'bg-danger'}`} />
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          {isConnected && isAdmin && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md border border-gold/25 bg-gold/5 text-gold">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">Sample data</p>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-normal text-muted-foreground">
                    On a blank database, this appends a sample roster and mock swears for testing.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleSeedSupabase}
                  className="border-gold/30 hover:bg-gold/10 hover:text-gold gap-2 w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  Seed sample data
                </Button>
                <Button variant="destructive" onClick={handleClearAllData} className="gap-2 w-full sm:w-auto">
                  <Trash2 className="h-4 w-4" />
                  Clear database
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
