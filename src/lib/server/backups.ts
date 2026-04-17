import { readFile, stat } from 'node:fs/promises';
import { TIERS, DEFAULT_RETAIN, emptyTier } from '$lib/backups';
import type { BackupEntry, BackupManifest, BackupTier, TierData } from '$lib/backups';

const MANIFEST_PATH = '/var/lib/bristoe-backup/manifest.json';

export async function readBackupManifest(): Promise<BackupManifest> {
  const tiers = Object.fromEntries(
    TIERS.map((t) => [t, emptyTier(t, DEFAULT_RETAIN[t])])
  ) as Record<BackupTier, TierData>;

  let raw: string;
  let mtime: string | null = null;
  try {
    const [buf, st] = await Promise.all([readFile(MANIFEST_PATH, 'utf8'), stat(MANIFEST_PATH)]);
    raw = buf;
    mtime = st.mtime.toISOString();
  } catch {
    return { available: false, updatedAt: null, manifestMtime: null, tiers };
  }

  let parsed: { updatedAt?: string; tiers?: Record<string, { last?: BackupEntry; history?: BackupEntry[]; retain?: number }> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { available: false, updatedAt: null, manifestMtime: mtime, tiers };
  }

  for (const tier of TIERS) {
    const src = parsed.tiers?.[tier];
    if (!src) continue;
    const history = (src.history ?? []).slice(-30);
    const last = src.last ?? (history.length ? history[history.length - 1] : null);
    const lastSuccess = [...history].reverse().find((e) => e.status === 'success') ?? null;
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].status === 'success') streak++;
      else break;
    }
    tiers[tier] = {
      tier,
      retain: src.retain ?? DEFAULT_RETAIN[tier],
      last: last ?? null,
      history,
      successStreak: streak,
      lastSuccess
    };
  }

  return {
    available: true,
    updatedAt: parsed.updatedAt ?? null,
    manifestMtime: mtime,
    tiers
  };
}
