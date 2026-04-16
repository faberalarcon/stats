<script lang="ts">
  let {
    label,
    active = false,
    activeText = 'On',
    inactiveText = 'Off'
  }: {
    label: string;
    active: boolean;
    activeText?: string;
    inactiveText?: string;
  } = $props();
</script>

<div class="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors {active
  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}">
  <span class="relative flex h-2 w-2">
    {#if active}
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
    {/if}
    <span class="relative inline-flex rounded-full h-2 w-2 {active ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}"></span>
  </span>
  <span>{label}</span>
  <span class="text-xs">{active ? activeText : inactiveText}</span>
</div>
