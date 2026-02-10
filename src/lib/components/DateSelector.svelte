<script>
  import { getNext7Days } from '$lib/data/mock.js';
  import { selectedDate } from '$lib/stores/reservation.js';

  const dates = getNext7Days();
</script>

<div class="card slide-up">
  <div class="step-header">
    <span class="step-number">2</span>
    <span class="step-title">날짜 선택</span>
  </div>
  <div class="date-row">
    {#each dates as d (d.value)}
      <button
        class="date-btn"
        class:active={$selectedDate === d.value}
        onclick={() => selectedDate.set(d.value)}
      >
        {d.label}
        {#if d.isToday}
          <span class="today-badge">오늘</span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .card {
    background: #fff;
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  }
  .slide-up {
    animation: slideUp 0.3s ease;
  }
  .step-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
  }
  .step-number {
    width: 26px; height: 26px; border-radius: 50%; background: #1a365d;
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
  }
  .step-title { font-weight: 700; font-size: 15px; color: #1a365d; }
  .date-row {
    display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px;
  }
  .date-btn {
    padding: 10px 14px; border-radius: 10px; min-width: 80px;
    border: 1.5px solid #e2e8f0; background: #fff; color: #4a5568;
    cursor: pointer; font-size: 13px; font-weight: 500;
    transition: all 0.15s; white-space: nowrap;
    position: relative; font-family: inherit;
  }
  .date-btn.active {
    border: 2px solid #1a365d; background: #1a365d; color: #fff; font-weight: 700;
  }
  .today-badge {
    position: absolute; top: -6px; right: -4px;
    font-size: 9px; background: #e53e3e; color: #fff;
    padding: 1px 5px; border-radius: 8px; font-weight: 700;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
