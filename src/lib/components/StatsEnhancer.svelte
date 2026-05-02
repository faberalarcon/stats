<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    defaultStatsPreloadHrefs,
    houseRangeHrefs,
    piRangeHrefs,
    sectionIndexForPath,
    statsSections
  } from '$lib/stats-sections';
  import { onDestroy, onMount } from 'svelte';

  const WARMUP_BATCH_SIZE = 40;
  const SWIPE_MIN_X = 70;
  const SWIPE_RATIO = 1.5;
  const INTERACTIVE_SELECTOR = [
    'a',
    'button',
    'input',
    'select',
    'textarea',
    'label',
    'summary',
    '[role="button"]',
    '[contenteditable="true"]',
    '.filters',
    '.tab-row',
    '.house__range-tabs',
    '.pi__range-tabs',
    '.app-header__nav',
    '.hubnav'
  ].join(',');

  type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };
  type IdleWindow = Window & {
    requestIdleCallback?: (callback: (deadline: IdleDeadline) => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };
  type Point = { x: number; y: number };

  let pendingIdle: number | null = null;
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  let activePointer: { id: number; start: Point } | null = null;
  const sentWarmups = new Set<string>();

  function localDate(date: Date): string {
    const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return shifted.toISOString().slice(0, 10);
  }

  function hrefWithParams(pathname: string, entries: Array<[string, string | number]>): string {
    const params = new URLSearchParams();
    for (const [key, value] of entries) params.set(key, String(value));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function currentVariantHref(url: URL): string {
    if (url.pathname === '/house') {
      return `/house?range=${url.searchParams.get('range') ?? '7d'}`;
    }
    if (url.pathname === '/pi') {
      return `/pi?range=${url.searchParams.get('range') ?? '1d'}`;
    }
    return `${url.pathname}${url.search}`;
  }

  function datePresetHrefs(): string[] {
    const now = new Date();
    const today = localDate(now);

    const monday = new Date(now);
    const day = monday.getDay();
    monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);

    return [
      hrefWithParams('/drinks', [['from', today], ['to', today]]),
      hrefWithParams('/drinks', [['from', localDate(monday)], ['to', today]]),
      hrefWithParams('/drinks', [['from', localDate(monthStart)], ['to', today]]),
      hrefWithParams('/drinks', [['from', localDate(ninetyDaysAgo)], ['to', today]])
    ];
  }

  function buildDrinkWarmups(data: Record<string, unknown>): string[] {
    const stats = data.stats as
      | {
          profiles?: Array<{ id: number }>;
          drinks?: Array<{ id: number; category: string }>;
        }
      | null
      | undefined;

    const hrefs: string[] = [];
    for (const profile of stats?.profiles ?? []) {
      hrefs.push(hrefWithParams('/drinks', [['profile_id', profile.id]]));
    }
    for (const drink of stats?.drinks ?? []) {
      hrefs.push(hrefWithParams('/drinks', [['drink_id', drink.id]]));
    }

    const categories = new Set((stats?.drinks ?? []).map((drink) => drink.category).filter(Boolean));
    for (const category of categories) {
      hrefs.push(hrefWithParams('/drinks', [['category', category]]));
    }

    hrefs.push(...datePresetHrefs());
    return hrefs;
  }

  function buildWarmupHrefs(url: URL, data: Record<string, unknown>): string[] {
    let hrefs: string[] = [];
    if (url.pathname === '/') hrefs = defaultStatsPreloadHrefs;
    else if (url.pathname === '/house') hrefs = houseRangeHrefs;
    else if (url.pathname === '/pi') hrefs = piRangeHrefs;
    else if (url.pathname === '/drinks') hrefs = buildDrinkWarmups(data);

    const current = currentVariantHref(url);
    return [...new Set(hrefs)]
      .filter((href) => href !== current && href !== `${url.pathname}${url.search}`);
  }

  function canWarmup(): boolean {
    if (!browser) return false;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return connection?.saveData !== true;
  }

  async function postWarmup(hrefs: string[]) {
    if (!hrefs.length || !canWarmup()) return;
    for (let i = 0; i < hrefs.length; i += WARMUP_BATCH_SIZE) {
      await fetch('/api/preload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hrefs: hrefs.slice(i, i + WARMUP_BATCH_SIZE) })
      }).catch(() => undefined);
    }
  }

  function scheduleWarmup(hrefs: string[]) {
    if (!browser || !hrefs.length || !canWarmup()) return;

    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      pendingIdle = idleWindow.requestIdleCallback(() => void postWarmup(hrefs), { timeout: 1800 });
      return;
    }

    pendingTimeout = setTimeout(() => void postWarmup(hrefs), 250);
  }

  function isMobileSwipeTarget(): boolean {
    return browser && window.matchMedia('(pointer: coarse) and (max-width: 760px)').matches;
  }

  function isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
  }

  function handlePointerDown(event: PointerEvent) {
    if (!isMobileSwipeTarget() || !event.isPrimary || event.pointerType === 'mouse') return;
    if (isInteractiveTarget(event.target)) return;
    activePointer = { id: event.pointerId, start: { x: event.clientX, y: event.clientY } };
  }

  function handlePointerUp(event: PointerEvent) {
    if (!activePointer || activePointer.id !== event.pointerId) return;

    const start = activePointer.start;
    activePointer = null;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;

    const currentIndex = sectionIndexForPath($page.url.pathname);
    if (currentIndex === -1) return;

    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    const nextSection = statsSections[nextIndex];
    if (nextSection) void goto(nextSection.href);
  }

  function handlePointerCancel(event: PointerEvent) {
    if (activePointer?.id === event.pointerId) activePointer = null;
  }

  $effect(() => {
    const hrefs = buildWarmupHrefs($page.url, $page.data);
    const key = hrefs.join('\n');
    if (!key || sentWarmups.has(key)) return;
    sentWarmups.add(key);
    scheduleWarmup(hrefs);
  });

  onMount(() => {
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('pointercancel', handlePointerCancel, { passive: true });
  });

  onDestroy(() => {
    if (!browser) return;

    document.removeEventListener('pointerdown', handlePointerDown);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerCancel);

    const idleWindow = window as IdleWindow;
    if (pendingIdle !== null && idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(pendingIdle);
    if (pendingTimeout !== null) clearTimeout(pendingTimeout);
  });
</script>
