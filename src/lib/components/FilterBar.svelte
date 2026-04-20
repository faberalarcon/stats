<script lang="ts">
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';

  let {
    profiles = [],
    drinks = [],
    filters
  }: {
    profiles: { id: number; name: string }[];
    drinks: { id: number; name: string; category: string }[];
    filters: { profileId: string; drinkId: string; category: string; from: string; to: string };
  } = $props();

  let profileId = $state(untrack(() => filters.profileId));
  let drinkId = $state(untrack(() => filters.drinkId));
  let category = $state(untrack(() => filters.category));
  let from = $state(untrack(() => filters.from));
  let to = $state(untrack(() => filters.to));

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

<fieldset class="filters">
  <legend class="filters__legend">Filter the ledger</legend>

  <div class="filters__grid">
    {#if profiles.length > 0}
      <label class="filters__field">
        <span class="dossier-label">Person</span>
        <select bind:value={profileId} class="dossier-select">
          <option value="">All</option>
          {#each profiles as p}
            <option value={String(p.id)}>{p.name}</option>
          {/each}
        </select>
      </label>
    {/if}

    {#if categories.length > 1}
      <label class="filters__field">
        <span class="dossier-label">Category</span>
        <select bind:value={category} class="dossier-select">
          <option value="">All</option>
          {#each categories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </label>
    {/if}

    <label class="filters__field">
      <span class="dossier-label">From</span>
      <input type="date" bind:value={from} class="dossier-input" />
    </label>

    <label class="filters__field">
      <span class="dossier-label">To</span>
      <input type="date" bind:value={to} class="dossier-input" />
    </label>

    <div class="filters__actions">
      <button type="button" class="dossier-button dossier-button--accent" onclick={apply}>Apply</button>
      {#if isFiltered}
        <button type="button" class="dossier-button dossier-button--ghost" onclick={reset}>Clear</button>
      {/if}
    </div>
  </div>

  {#if isFiltered}
    <p class="filters__note">
      <span class="dossier-status dossier-status--alert">Filters active</span>
    </p>
  {/if}
</fieldset>

<style>
  .filters {
    border: 1px solid var(--color-paper-300);
    padding: 1.25rem 1.5rem 1.5rem;
    background: var(--color-paper-100);
    margin-bottom: 2rem;
    min-width: 0;
  }
  .filters__legend {
    font-family: var(--font-body);
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-blood-500);
    padding: 0 0.6rem;
  }
  .filters__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 1.25rem 1.5rem;
    align-items: end;
  }
  .filters__field {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .filters__actions {
    display: flex;
    gap: 0.75rem;
    align-items: end;
    flex-wrap: wrap;
  }
  .filters__note {
    margin: 1rem 0 0;
    padding-top: 1rem;
    border-top: 1px solid var(--color-paper-300);
  }
</style>
