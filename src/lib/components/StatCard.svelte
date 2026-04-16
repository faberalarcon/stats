<script lang="ts">
  let {
    label,
    value,
    unit = '',
    icon = '',
    sublabel = '',
    accent = false
  }: {
    label: string;
    value: string | number;
    unit?: string;
    icon?: string;
    sublabel?: string;
    accent?: boolean;
  } = $props();
</script>

<div
  class="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-0.5"
  class:ring-2={accent}
  class:ring-orange-400={accent}
>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <p class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
      <p class="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {value}<span class="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1">{unit}</span>
      </p>
      {#if sublabel}
        <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>
      {/if}
    </div>
    {#if icon}
      <span class="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">{icon}</span>
    {/if}
  </div>
</div>
