<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let {
    profiles = [],
    drinks = [],
    filters
  }: {
    profiles: { id: number; name: string }[];
    drinks: { id: number; name: string; category: string }[];
    filters: { profileId: string; drinkId: string; category: string; from: string; to: string };
  } = $props();

  let profileId = $state(filters.profileId);
  let drinkId = $state(filters.drinkId);
  let category = $state(filters.category);
  let from = $state(filters.from);
  let to = $state(filters.to);

  const categories = $derived([...new Set(drinks.map((d) => d.category))].filter(Boolean));

  function apply() {
    const params = new URLSearchParams();
    if (profileId) params.set('profile_id', profileId);
    if (drinkId) params.set('drink_id', drinkId);
    if (category) params.set('category', category);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    goto(`?${params.toString()}`, { invalidateAll: true });
  }

  function reset() {
    profileId = '';
    drinkId = '';
    category = '';
    from = '';
    to = '';
    goto('?', { invalidateAll: true });
  }

  const isFiltered = $derived(
    profileId || drinkId || category || from || to
  );
</script>

<div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mb-6">
  <div class="flex flex-wrap gap-3 items-end">
    <!-- Profile filter -->
    {#if profiles.length > 0}
      <div class="min-w-[8rem]">
        <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Person</label>
        <select
          bind:value={profileId}
          class="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <option value="">All</option>
          {#each profiles as p}
            <option value={String(p.id)}>{p.name}</option>
          {/each}
        </select>
      </div>
    {/if}

    <!-- Category filter -->
    {#if categories.length > 1}
      <div class="min-w-[8rem]">
        <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
        <select
          bind:value={category}
          class="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <option value="">All</option>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </div>
    {/if}

    <!-- Date range -->
    <div>
      <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From</label>
      <input
        type="date"
        bind:value={from}
        class="text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-300"
      />
    </div>
    <div>
      <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">To</label>
      <input
        type="date"
        bind:value={to}
        class="text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-300"
      />
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        onclick={apply}
        class="px-4 py-1.5 text-sm font-medium rounded-lg bg-sky-400 hover:bg-sky-500 text-white transition-colors"
      >Apply</button>
      {#if isFiltered}
        <button
          onclick={reset}
          class="px-4 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >Clear</button>
      {/if}
    </div>
  </div>

  {#if isFiltered}
    <p class="mt-2 text-xs text-sky-500 dark:text-sky-400">Filters active — showing filtered results</p>
  {/if}
</div>
