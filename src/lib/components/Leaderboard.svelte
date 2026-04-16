<script lang="ts">
  let {
    entries,
    maxCount = 0
  }: {
    entries: { name: string; color: string; count: number }[];
    maxCount?: number;
  } = $props();

  const max = maxCount > 0 ? maxCount : Math.max(...entries.map((e) => e.count), 1);
</script>

<div class="space-y-2">
  {#each entries as entry, i}
    <div class="flex items-center gap-3">
      <span class="text-sm font-medium text-slate-500 dark:text-slate-400 w-5 text-right">{i + 1}</span>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{entry.name}</span>
          <span class="text-sm font-bold text-slate-600 dark:text-slate-300 ml-2">{entry.count}</span>
        </div>
        <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            style="width: {Math.max((entry.count / max) * 100, 2)}%; background-color: {entry.color}"
          ></div>
        </div>
      </div>
    </div>
  {/each}

  {#if entries.length === 0}
    <p class="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No data yet</p>
  {/if}
</div>
