<script>
  import { TIME_SLOTS, getReservation, getSlotStatus } from '$lib/data/mock.js';
  import { selectedDate, filteredCourts, modalOpen, modalData } from '$lib/stores/reservation.js';
  import LevelBadge from './LevelBadge.svelte';

  function openDetail(court, timeSlot) {
    const res = getReservation(court.id, timeSlot, $selectedDate);
    modalData.set({ court, timeSlot, reservation: res });
    modalOpen.set(true);
  }

  function statusStyle(status) {
    if (status === 'full') return { bg: '#FFEBEE', color: '#C62828' };
    if (status === 'available') return { bg: '#FFF3E0', color: '#E65100' };
    return { bg: '#E8F5E9', color: '#2E7D32' };
  }

  function statusLabel(status) {
    if (status === 'full') return '마감';
    if (status === 'available') return '예약가능';
    return '빈자리';
  }
</script>

<div class="card slide-up">
  <div class="step-header">
    <span class="step-number">3</span>
    <span class="step-title">시간대별 게임 현황</span>
  </div>
  <div class="legend">
    <span class="legend-item"><span class="dot" style="background:#E8F5E9"></span> 예약가능</span>
    <span class="legend-item"><span class="dot" style="background:#FFF3E0"></span> 일부예약</span>
    <span class="legend-item"><span class="dot" style="background:#FFEBEE"></span> 마감</span>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th class="sticky-col">시간대</th>
          {#each $filteredCourts as court (court.id)}
            <th class="court-th">
              <div>{court.name}</div>
              <LevelBadge level={court.level} />
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each TIME_SLOTS as slot}
          <tr>
            <td class="sticky-col time-cell">⏰ {slot}</td>
            {#each $filteredCourts as court (court.id)}
              {@const info = getSlotStatus(court, slot, $selectedDate)}
              {@const style = statusStyle(info.status)}
              <td class="slot-cell">
                <button
                  class="slot-btn"
                  disabled={info.status === 'full'}
                  style="background:{style.bg}; color:{style.color}; opacity:{info.status === 'full' ? 0.7 : 1}"
                  onclick={() => openDetail(court, slot)}
                >
                  <div class="slot-count">{info.count}/{info.capacity}명</div>
                  <div class="slot-label">{statusLabel(info.status)}</div>
                </button>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .card {
    background: #fff; border-radius: 14px; padding: 20px;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06);
  }
  .slide-up { animation: slideUp 0.4s ease; }
  .step-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
  }
  .step-number {
    width: 26px; height: 26px; border-radius: 50%; background: #1a365d;
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
  }
  .step-title { font-weight: 700; font-size: 15px; color: #1a365d; }
  .legend {
    display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
  }
  .legend-item {
    display: flex; align-items: center; gap: 4px; font-size: 11px; color: #718096;
  }
  .dot { width: 10px; height: 10px; border-radius: 3px; }
  .table-wrap { overflow-x: auto; }
  table {
    width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px;
  }
  thead th {
    padding: 10px 12px; font-weight: 700; color: #2d3748;
    border-bottom: 2px solid #e2e8f0; background: #f7fafc; text-align: center;
    min-width: 110px;
  }
  .sticky-col {
    position: sticky; left: 0; z-index: 2; background: #f7fafc;
    padding: 10px 12px; font-weight: 700; color: #2d3748;
    border-bottom: 2px solid #e2e8f0; text-align: left; min-width: 100px;
  }
  tbody .sticky-col {
    background: #fff; z-index: 1; border-bottom: 1px solid #edf2f7;
  }
  .time-cell { font-weight: 600; color: #4a5568; white-space: nowrap; }
  .slot-cell {
    padding: 6px; border-bottom: 1px solid #edf2f7; text-align: center;
  }
  .slot-btn {
    width: 100%; padding: 10px 8px; border-radius: 8px; border: none;
    cursor: pointer; transition: all 0.15s; font-family: inherit;
  }
  .slot-btn:disabled { cursor: not-allowed; }
  .slot-btn:not(:disabled):hover { transform: scale(1.04); }
  .slot-count { font-weight: 700; font-size: 13px; }
  .slot-label { font-size: 10px; opacity: 0.8; margin-top: 2px; }
  .court-th { min-width: 110px; }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
