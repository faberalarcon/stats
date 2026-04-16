<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';

  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

  let {
    labels,
    data,
    colors = [],
    horizontal = false,
    label = 'Count'
  }: {
    labels: string[];
    data: number[];
    colors?: string[];
    horizontal?: boolean;
    label?: string;
  } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  const defaultColor = '#7dd3fc';

  onMount(() => {
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.2)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label,
          data,
          backgroundColor: colors.length > 0 ? colors : data.map(() => defaultColor),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: {
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: isDark ? '#e2e8f0' : '#1e293b',
            bodyColor: isDark ? '#cbd5e1' : '#475569',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10
          }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } }
        }
      }
    });

    return () => chart?.destroy();
  });
</script>

<div class="relative w-full" style="height: 280px">
  <canvas bind:this={canvas}></canvas>
</div>
