<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Error — 21 Bristoe Stats</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
  <p class="text-6xl font-bold text-slate-200 dark:text-slate-800">{$page.status}</p>
  <h1 class="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-200">
    {$page.status === 404 ? 'Page not found' : 'Something went wrong'}
  </h1>
  <p class="mt-2 text-slate-500 dark:text-slate-400 max-w-sm">
    {$page.error?.message ?? 'An unexpected error occurred.'}
  </p>
  <a
    href="/"
    class="mt-6 px-5 py-2 rounded-lg bg-sky-400 hover:bg-sky-500 text-white font-medium transition-colors"
  >
    Go home
  </a>
</div>
