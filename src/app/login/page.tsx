'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { GiShieldBounces } from 'react-icons/gi';
import { useAuth } from '@/lib/auth-context';
import { isSupabaseConfigured } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function LoginPage() {
  const { session, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (session) router.replace('/');
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      toast.error('Sign-in failed.', { description: error });
      return;
    }
    toast.success('Signed in as admin.');
    router.push('/');
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-3xl p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-hot text-hot-foreground">
            <GiShieldBounces className="h-6 w-6" />
          </div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-hot">Restricted</p>
          <h1 className="mt-1 font-heading text-xl font-bold">Admin sign-in</h1>
          <p className="mt-1 text-xs text-muted-foreground">Sign in to log strikes or edit the roster.</p>
        </div>

        <div className="mt-5">
          {!isSupabaseConfigured() ? (
            <p className="text-center text-sm text-muted-foreground">
              Supabase is not configured for this environment.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="h-10 border-border bg-background/40 focus-visible:border-hot focus-visible:ring-hot/20"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10 border-border bg-background/40 focus-visible:border-hot focus-visible:ring-hot/20"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-hot font-semibold text-hot-foreground hover:bg-hot/90"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
