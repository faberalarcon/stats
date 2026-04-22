<script lang="ts">
  let {
    title,
    numeral = '',
    meta = ''
  }: {
    title: string;
    numeral?: string;
    meta?: string;
  } = $props();

</script>

<div class="section-header">
  <h2 class="section-header__title">{title}</h2>
  {#if meta}
    <p class="section-header__meta">{meta}</p>
  {/if}
</div>

<style>
  .section-header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-paper-300);
  }
  .section-header__title {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 2vw + 0.75rem, 2rem);
    font-weight: 600;
    color: var(--color-ink-900);
    margin: 0;
    line-height: 1.1;
    font-variation-settings: 'opsz' 48, 'SOFT' 30;
  }
  .section-header__meta {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 0.9375rem;
    color: var(--color-ink-500);
    margin: 0;
    font-variation-settings: 'opsz' 24, 'SOFT' 100;
  }
</style>
