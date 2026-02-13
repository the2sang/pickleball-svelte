<script>
  import { getNext7Days, get7DaysAround, formatDate } from '$lib/data/mock.js';
  import { selectedDate } from '$lib/stores/reservation.js';

  let dates = $state(getNext7Days());
  let centerDate = $state(formatDate(new Date()));
  let showCalendar = $state(false);
  let calendarInput = $state('');

  // Update dates when center changes
  function updateDates(newCenter) {
    centerDate = newCenter;
    dates = get7DaysAround(newCenter);
  }

  // Move to previous week
  function previousWeek() {
    const d = new Date(centerDate);
    d.setDate(d.getDate() - 7);
    updateDates(formatDate(d));
  }

  // Move to next week
  function nextWeek() {
    const d = new Date(centerDate);
    d.setDate(d.getDate() + 7);
    updateDates(formatDate(d));
  }

  // Handle calendar date selection
  function handleCalendarChange(e) {
    const newDate = e.target.value;
    if (newDate) {
      selectedDate.set(newDate);
      updateDates(newDate);
      showCalendar = false;
    }
  }

  // Go to today
  function goToToday() {
    const today = formatDate(new Date());
    selectedDate.set(today);
    centerDate = today;
    dates = getNext7Days();
  }

  // Go to yesterday
  function goToYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    selectedDate.set(yesterdayStr);
    updateDates(yesterdayStr);
  }
</script>

<div class="card slide-up">
  <div class="step-header">
    <span class="step-number">2</span>
    <span class="step-title">날짜 선택</span>
    <button class="yesterday-link" onclick={goToYesterday}>어제</button>
    <button class="today-link" onclick={goToToday}>오늘</button>
  </div>

  <!-- Calendar Picker & Week Navigation -->
  <div class="date-controls">
    <button class="nav-btn" onclick={previousWeek} title="이전 주">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>

    <button class="calendar-btn" onclick={() => showCalendar = !showCalendar}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span>달력에서 선택</span>
    </button>

    <button class="nav-btn" onclick={nextWeek} title="다음 주">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  </div>

  {#if showCalendar}
    <div class="calendar-picker">
      <input
        type="date"
        class="date-input"
        bind:value={calendarInput}
        onchange={handleCalendarChange}
        max="2099-12-31"
      />
    </div>
  {/if}

  <!-- Date Buttons -->
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
  .step-title {
    font-weight: 700; font-size: 15px; color: #1a365d; flex: 1;
  }
  .yesterday-link {
    background: none;
    border: 1.5px solid #a0aec0;
    color: #718096;
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }
  .yesterday-link:hover {
    background: #718096;
    border-color: #718096;
    color: #fff;
  }
  .today-link {
    background: none;
    border: 1.5px solid #4299e1;
    color: #4299e1;
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }
  .today-link:hover {
    background: #4299e1;
    color: #fff;
  }

  /* Date Controls */
  .date-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .nav-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    background: #fff;
    color: #4a5568;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    font-family: inherit;
  }
  .nav-btn:hover {
    border-color: #bee3f8;
    background: #f7fafc;
    color: #1a365d;
  }
  .nav-btn svg {
    width: 16px;
    height: 16px;
  }
  .calendar-btn {
    flex: 1;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1.5px solid #e2e8f0;
    background: #fff;
    color: #4a5568;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.15s;
    font-family: inherit;
  }
  .calendar-btn:hover {
    border-color: #4299e1;
    background: #ebf8ff;
    color: #2b6cb0;
  }
  .calendar-btn svg {
    width: 18px;
    height: 18px;
  }

  /* Calendar Picker */
  .calendar-picker {
    margin-bottom: 12px;
    padding: 12px;
    background: #f7fafc;
    border-radius: 10px;
    border: 1.5px solid #e2e8f0;
    animation: fadeIn 0.2s ease;
  }
  .date-input {
    width: 100%;
    padding: 10px 14px;
    border: 1.5px solid #cbd5e0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    color: #2d3748;
    background: #fff;
    cursor: pointer;
    transition: all 0.15s;
  }
  .date-input:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
  .date-input::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: opacity(0.6);
  }
  .date-input::-webkit-calendar-picker-indicator:hover {
    filter: opacity(1);
  }

  /* Date Row */
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
  .date-btn:hover {
    border-color: #bee3f8;
    background: #f7fafc;
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
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
