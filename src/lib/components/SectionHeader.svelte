<script lang="ts">
  let { title, icon = '' }: { title: string; icon?: string } = $props();
</script>

<div class="flex items-center gap-2 mb-4">
  {#if icon}
    <span class="text-xl">{icon}</span>
  {/if}
  <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
</div>
