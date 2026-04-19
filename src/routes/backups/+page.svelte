<script lang="ts">
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { TIERS, humanAge, formatBytes, formatDuration, staleness } from '$lib/backups';
  import type { BackupTier, TierData, DriveHealth } from '$lib/backups';

  function pctUsed(d: DriveHealth): number {
    if (!d.totalBytes) return 0;
    return Math.min(100, Math.max(0, ((d.totalBytes - d.freeBytes) / d.totalBytes) * 100));
  }

  function usageColor(pct: number): string {
    if (pct >= 90) return 'bg-rose-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  let { data } = $props();

  const drive = $derived(data.manifest.drive);
  const used = $derived(pctUsed(drive));

  const TIER_META: Record<BackupTier, { icon: string; label: string; cadence: string }> = {
    daily:     { icon: '📅', label: 'Daily',     cadence: 'every day at 03:00' },
    weekly:    { icon: '🗓️', label: 'Weekly',    cadence: 'Sundays at 03:30' },
    monthly:   { icon: '📆', label: 'Monthly',   cadence: '1st of month at 04:00' },
    quarterly: { icon: '🧭', label: 'Quarterly', cadence: '1st of Jan/Apr/Jul/Oct at 04:30' }
  };

  const STATE_STYLE: Record<string, string> = {
    fresh:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    due:      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    overdue:  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    unknown:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  };

  function totalSize(m: typeof data.manifest): number {
    return TIERS.reduce((sum, t) => sum + (m.tiers[t].lastSuccess?.sizeBytes ?? 0), 0);
  }

  function healthyTiers(m: typeof data.manifest): number {
    return TIERS.filter((t) => staleness(t, m.tiers[t].last) === 'fresh').length;
  }

  function lastOverall(m: typeof data.manifest): string | null {
    let latest: string | null = null;
    for (const t of TIERS) {
      const ts = m.tiers[t].last?.timestamp;
      if (ts && (!latest || ts > latest)) latest = ts;
    }
    return latest;
  }
</script>

<svelte:head>
  <title>Backups — 21 Bristoe Stats</title>
  <meta name="description" content="Pi backup tier status, history, and retention" />
</svelte:head>

<div class="space-y-10">
  <div class="text-center pb-2">
    <h1 class="text-4xl sm:text-5xl font-bold tracking-tight">
      <span class="text-accent">Backups</span>
    </h1>
    <p class="mt-2 text-slate-500 dark:text-slate-400">
      Tiered rsync snapshots of <code class="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">/home/faber</code> to the USB drive
    </p>
  </div>

  {#if !data.manifest.available}
    <div class="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-700 dark:text-amber-400">
      No backup manifest yet. Cron will populate it on next scheduled run (or run <code class="font-mono text-xs">/home/faber/bin/backup.sh daily</code> manually).
    </div>
  {/if}

  <!-- Overview -->
  <section>
    <SectionHeader title="Overview" icon="💾" />
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Healthy tiers"
        value={`${healthyTiers(data.manifest)} / ${TIERS.length}`}
        icon="✅"
        accent
      />
      <StatCard
        label="Latest snapshot"
        value={humanAge(lastOverall(data.manifest))}
        icon="⏱️"
        sublabel={lastOverall(data.manifest) ?? ''}
      />
      <StatCard
        label="Total backup size"
        value={formatBytes(totalSize(data.manifest))}
        icon="📦"
        sublabel="sum of last successful per tier"
      />
      <StatCard
        label="Manifest updated"
        value={humanAge(data.manifest.manifestMtime ?? data.manifest.updatedAt)}
        icon="📝"
      />
    </div>
  </section>

  <!-- Tier cards -->
  <section>
    <SectionHeader title="Tiers" icon="🧱" />
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each TIERS as tier}
        {@const t = data.manifest.tiers[tier] as TierData}
        {@const meta = TIER_META[tier]}
        {@const state = staleness(tier, t.last)}
        <article class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all duration-300 hover:shadow-lg">
          <header class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{meta.icon}</span>
              <div>
                <h3 class="font-semibold text-slate-800 dark:text-slate-200">{meta.label}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">{meta.cadence}</p>
              </div>
            </div>
            <span class="text-xs font-medium px-2 py-1 rounded-full {STATE_STYLE[state]}">{state}</span>
          </header>

          <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt class="text-slate-500 dark:text-slate-400">Last run</dt>
            <dd class="text-slate-800 dark:text-slate-200 font-medium">{humanAge(t.last?.timestamp)}</dd>

            <dt class="text-slate-500 dark:text-slate-400">Status</dt>
            <dd class="text-slate-800 dark:text-slate-200 font-medium">
              {#if t.last}
                <span class="{t.last.status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
                  {t.last.status}
                </span>
              {:else}
                —
              {/if}
            </dd>

            <dt class="text-slate-500 dark:text-slate-400">Last good size</dt>
            <dd class="text-slate-800 dark:text-slate-200 font-medium">{formatBytes(t.lastSuccess?.sizeBytes ?? 0)}</dd>

            <dt class="text-slate-500 dark:text-slate-400">Duration</dt>
            <dd class="text-slate-800 dark:text-slate-200 font-medium">{formatDuration(t.lastSuccess?.durationSec ?? 0)}</dd>

            <dt class="text-slate-500 dark:text-slate-400">Files</dt>
            <dd class="text-slate-800 dark:text-slate-200 font-medium">{(t.lastSuccess?.fileCount ?? 0).toLocaleString()}</dd>

            <dt class="text-slate-500 dark:text-slate-400">Retained</dt>
            <dd class="text-slate-800 dark:text-slate-200 font-medium">{t.retain} snapshots</dd>

            <dt class="text-slate-500 dark:text-slate-400">Success streak</dt>
            <dd class="text-slate-800 dark:text-slate-200 font-medium">{t.successStreak} run{t.successStreak === 1 ? '' : 's'}</dd>
          </dl>

          {#if t.last?.error}
            <p class="mt-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2 rounded">
              {t.last.error}
            </p>
          {/if}

          <!-- Recent history strip -->
          {#if t.history.length > 0}
            <div class="mt-4 flex gap-1" aria-label="Recent runs">
              {#each t.history.slice(-14) as entry}
                <span
                  class="h-6 flex-1 rounded-sm {entry.status === 'success' ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-rose-400 dark:bg-rose-600'}"
                  title="{entry.timestamp} — {entry.status}"
                ></span>
              {/each}
            </div>
            <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">last {Math.min(t.history.length, 14)} run{t.history.length === 1 ? '' : 's'}</p>
          {/if}
        </article>
      {/each}
    </div>
  </section>

  <!-- Drive health -->
  <section>
    <SectionHeader title="Drive health" icon="🧪" />
    <article class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <header class="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 class="font-semibold text-slate-800 dark:text-slate-200">128 GB USB (SanDisk Ultra)</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">{drive.mountpoint}</p>
        </div>
        <span
          class="text-xs font-medium px-2 py-1 rounded-full {drive.mounted
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}"
        >
          {drive.mounted ? 'mounted' : 'offline'}
        </span>
      </header>

      <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt class="text-slate-500 dark:text-slate-400">Free</dt>
        <dd class="text-slate-800 dark:text-slate-200 font-medium">{formatBytes(drive.freeBytes)}</dd>

        <dt class="text-slate-500 dark:text-slate-400">Total</dt>
        <dd class="text-slate-800 dark:text-slate-200 font-medium">{formatBytes(drive.totalBytes)}</dd>

        <dt class="text-slate-500 dark:text-slate-400">Used</dt>
        <dd class="text-slate-800 dark:text-slate-200 font-medium">{used.toFixed(1)}%</dd>

        <dt class="text-slate-500 dark:text-slate-400">UUID</dt>
        <dd class="text-slate-800 dark:text-slate-200 font-mono text-xs break-all">{drive.uuid ?? '—'}</dd>

        <dt class="text-slate-500 dark:text-slate-400">As of</dt>
        <dd class="text-slate-800 dark:text-slate-200 font-medium">{humanAge(drive.updatedAt)}</dd>
      </dl>

      <div class="mt-4">
        <div class="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div class="h-full {usageColor(used)} transition-all" style="width: {used}%"></div>
        </div>
      </div>
    </article>
  </section>

  <!-- Destination -->
  <section>
    <SectionHeader title="Destination" icon="🗄️" />
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
      <p>128 GB USB drive (label <code class="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">usbbackup</code>) mounted at <code class="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">/mnt/usbbackup</code></p>
      <p>Snapshots under <code class="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">/mnt/usbbackup/backups/&lt;tier&gt;/&lt;timestamp&gt;</code></p>
      <p>Dedup: <code class="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">rsync --link-dest</code> against previous snapshot in the same tier</p>
    </div>
  </section>
</div>
