import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GM', {
    style: 'currency',
    currency: 'GMD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function isSameMonthAndYear(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

export function getMonthYearKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`; // e.g. "2026-07"
}

export function formatMonthYearKey(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export interface OffenderRank {
  title: string;
  colorClass: string;
}

// Gamified rank tiers based on lifetime swear count, from clean to menace.
export function getOffenderRank(count: number): OffenderRank {
  if (count === 0) return { title: 'Clean Slate', colorClass: 'text-clean' };
  if (count <= 4) return { title: 'Rookie', colorClass: 'text-muted-foreground' };
  if (count <= 14) return { title: 'Repeat Offender', colorClass: 'text-gold' };
  if (count <= 29) return { title: 'Serial Offender', colorClass: 'text-danger' };
  return { title: 'Public Menace', colorClass: 'text-danger' };
}

// Days since an employee's last recorded swear. Null means they have never sworn.
export function getStreakDays(
  swears: { employee_id: string; created_at: string }[],
  employeeId: string
): number | null {
  const timestamps = swears
    .filter((s) => s.employee_id === employeeId)
    .map((s) => new Date(s.created_at).getTime());

  if (timestamps.length === 0) return null;

  const lastSwearTime = Math.max(...timestamps);
  const diffMs = Date.now() - lastSwearTime;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function getRelativeTimeString(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0) return 'just now'; // In case of clock drift

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
