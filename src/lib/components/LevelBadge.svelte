<script>
  import { LEVEL_COLORS } from '$lib/data/mock.js';

  /** @type {{ level: string }} */
  let { level } = $props();

  const colors = $derived(LEVEL_COLORS[level] || { bg: '#F5F5F5', text: '#616161', border: '#E0E0E0' });
</script>

<span
  class="level-badge"
  style="background:{colors.bg}; color:{colors.text}; border-color:{colors.border};"
>
  {level}
</span>

<style>
  .level-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid;
    letter-spacing: 0.5px;
  }
</style>
