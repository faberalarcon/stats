export type BackupTier = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export const TIERS: BackupTier[] = ['daily', 'weekly', 'monthly', 'quarterly'];

export interface BackupEntry {
  timestamp: string;
  status: 'success' | 'failed';
  sizeBytes: number;
  fileCount: number;
  durationSec: number;
  error?: string;
}

export interface TierData {
  tier: BackupTier;
  retain: number;
  last: BackupEntry | null;
  history: BackupEntry[];
  successStreak: number;
  lastSuccess: BackupEntry | null;
}

export interface BackupManifest {
  available: boolean;
  updatedAt: string | null;
  manifestMtime: string | null;
  tiers: Record<BackupTier, TierData>;
}

export const DEFAULT_RETAIN: Record<BackupTier, number> = {
  daily: 7,
  weekly: 4,
  monthly: 12,
  quarterly: 4
};

export function emptyTier(tier: BackupTier, retain: number): TierData {
  return {
    tier,
    retain,
    last: null,
    history: [],
    successStreak: 0,
    lastSuccess: null
  };
}

export function parseTimestamp(ts: string): Date | null {
  const m = ts.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
}

export function humanAge(ts: string | null | undefined): string {
  if (!ts) return 'never';
  const d = parseTimestamp(ts) ?? new Date(ts);
  if (!d || isNaN(d.getTime())) return ts;
  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'in the future';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function formatBytes(n: number): string {
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
}

export function formatDuration(sec: number): string {
  if (!sec) return '—';
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function staleness(tier: BackupTier, last: BackupEntry | null): 'fresh' | 'due' | 'overdue' | 'unknown' {
  if (!last) return 'unknown';
  const d = parseTimestamp(last.timestamp);
  if (!d) return 'unknown';
  const hoursSince = (Date.now() - d.getTime()) / 3600000;
  const windows: Record<BackupTier, [number, number]> = {
    daily: [26, 36],
    weekly: [24 * 7 + 2, 24 * 7 + 12],
    monthly: [24 * 31 + 2, 24 * 31 + 24],
    quarterly: [24 * 93 + 4, 24 * 93 + 48]
  };
  const [due, overdue] = windows[tier];
  if (hoursSince >= overdue) return 'overdue';
  if (hoursSince >= due) return 'due';
  return 'fresh';
}
