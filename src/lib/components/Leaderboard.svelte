<script lang="ts">
  let {
    entries,
    maxCount = 0
  }: {
    entries: { name: string; color: string; count: number }[];
    maxCount?: number;
  } = $props();

  const max = $derived(maxCount > 0 ? maxCount : Math.max(...entries.map((e) => e.count), 1));

  function roman(n: number): string {
    const vals: [number, string][] = [
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];
    let out = '';
    for (const [v, s] of vals) { while (n >= v) { out += s; n -= v; } }
    return out || 'I';
  }
</script>

<table class="dossier-table ledger">
  <thead>
    <tr>
      <th class="rank">№</th>
      <th>Name</th>
      <th class="num">Count</th>
      <th class="share" aria-hidden="true"></th>
    </tr>
  </thead>
  <tbody>
    {#each entries as entry, i}
      <tr>
        <td class="rank">{roman(i + 1)}</td>
        <td class="name">
          <span class="name__dot" aria-hidden="true" style="background:{entry.color}"></span>
          {entry.name}
        </td>
        <td class="num">{entry.count.toLocaleString()}</td>
        <td class="share">
          <span class="share__bar">
            <span
              class="share__fill"
              style="width:{Math.max((entry.count / max) * 100, 2)}%;background:{entry.color}"
            ></span>
          </span>
        </td>
      </tr>
    {/each}

    {#if entries.length === 0}
      <tr>
        <td colspan="4" class="empty">No data yet</td>
      </tr>
    {/if}
  </tbody>
</table>

<style>
  .ledger .rank {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--color-blood-500);
    width: 3rem;
    font-size: 0.95rem;
    font-variation-settings: 'opsz' 48, 'SOFT' 100;
  }
  .ledger .name {
    font-family: var(--font-body);
    color: var(--color-ink-900);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }
  .name__dot {
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    border-radius: 50%;
  }
  .ledger .share { width: 34%; min-width: 80px; }
  .share__bar {
    display: block;
    height: 6px;
    background: var(--color-paper-200);
    overflow: hidden;
  }
  .share__fill {
    display: block;
    height: 100%;
    transition: width 0.6s ease-out;
  }
  .ledger td.empty {
    text-align: center;
    font-style: italic;
    color: var(--color-ink-500);
    padding: 1.75rem 0;
  }
</style>
