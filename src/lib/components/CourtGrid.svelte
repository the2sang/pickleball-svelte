<script>
  import {
    selectedDate,
    filteredCourts,
    modalOpen,
    modalData,
  } from "$lib/stores/reservation.js";
  import { auth } from "$lib/stores/auth.js";
  import LevelBadge from "./LevelBadge.svelte";

  let courtSlotsMap = {};
  let timeRows = [];
  let loading = false;
  let selectedCourtId = null;

  $: if ($selectedDate && $filteredCourts && $filteredCourts.length > 0) {
    loadSlots();
  }

  $: if ($filteredCourts && $filteredCourts.length > 0 && !selectedCourtId) {
    selectedCourtId = $filteredCourts[0].id;
  }

  $: selectedCourt = $filteredCourts?.find(c => c.id === selectedCourtId);
  $: selectedCourtSlots = selectedCourtId ? courtSlotsMap[selectedCourtId] : null;

  async function loadSlots() {
    loading = true;
    courtSlotsMap = {};
    const allSlots = new Set();

    const token = $auth?.accessToken;
    if (!token) {
      console.log("No auth token available");
      loading = false;
      return;
    }

    try {
      const promises = $filteredCourts.map(async (court) => {
        const url = `/api/v1/courts/${court.id}/slots?date=${$selectedDate}`;
        console.log("Fetching slots:", url);
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Response status:", res.status, "for court:", court.id);
        if (res.ok) {
          const data = await res.json();
          console.log("Court slots data:", court.id, data);
          courtSlotsMap[court.id] = data;
          data.slots.forEach((s) => allSlots.add(s.timeSlot));
        } else {
          console.error("Failed to fetch slots for court:", court.id, res.status);
        }
      });

      await Promise.all(promises);

      // Sort slots
      timeRows = Array.from(allSlots).sort();
      console.log("Time rows:", timeRows);
      console.log("Court slots map:", courtSlotsMap);
    } catch (e) {
      console.error("Error loading slots:", e);
    } finally {
      loading = false;
    }
  }

  function getSlotInfo(timeSlot) {
    if (!selectedCourtSlots) return null;
    return selectedCourtSlots.slots.find((s) => s.timeSlot === timeSlot);
  }

  function openDetail(timeSlot, info) {
    if (!info || !selectedCourt) return;
    // Pass info directly to modal
    modalData.set({
      court: selectedCourt,
      timeSlot,
      reservation: { ...info, date: $selectedDate },
    });
    modalOpen.set(true);
  }

  function selectCourt(courtId) {
    selectedCourtId = courtId;
  }

  function getStatusStyle(info) {
    if (!info) return { bg: "#f7fafc", color: "#cbd5e0", opacity: 0.5 }; // No slot
    if (info.status === "CLOSED") return { bg: "#edf2f7", color: "#a0aec0" };
    if (info.status === "FULL") return { bg: "#FFEBEE", color: "#C62828" };

    // Available
    if (info.reservedCount > 0) return { bg: "#FFF3E0", color: "#E65100" }; // Partial
    return { bg: "#E8F5E9", color: "#2E7D32" }; // Empty
  }

  function getStatusLabel(info) {
    if (!info) return "-";
    if (info.status === "CLOSED") return "마감"; // Or '운영안함'
    if (info.status === "FULL") return "마감";
    if (info.reservedCount > 0) return "예약가능";
    return "빈자리";
  }

  function getScheduleTypeLabel(scheduleType) {
    if (scheduleType === "RENTAL") return "대관";
    if (scheduleType === "OPEN_GAME") return "오픈게임";
    return "";
  }
</script>

<div class="card slide-up">
  <div class="step-header">
    <span class="step-number">3</span>
    <span class="step-title">시간대별 게임 현황</span>
    {#if loading}
      <span class="loading-text">불러오는 중...</span>
    {/if}
  </div>

  <div class="legend">
    <span class="legend-item"
      ><span class="dot" style="background:#E8F5E9"></span> 빈자리</span
    >
    <span class="legend-item"
      ><span class="dot" style="background:#FFF3E0"></span> 일부예약</span
    >
    <span class="legend-item"
      ><span class="dot" style="background:#FFEBEE"></span> 마감</span
    >
    <span class="legend-item"
      ><span class="dot" style="background:#edf2f7"></span> 불가</span
    >
  </div>

  <!-- Court Tabs -->
  <div class="tabs">
    {#each $filteredCourts as court (court.id)}
      <button
        class="tab"
        class:active={selectedCourtId === court.id}
        on:click={() => selectCourt(court.id)}
      >
        <div class="tab-name">{court.courtName || court.name || '코트'}</div>
        <LevelBadge level={court.courtLevel || court.level} />
      </button>
    {/each}
  </div>

  <!-- Court Content -->
  {#if selectedCourt && selectedCourtSlots}
    <div class="court-content">
      <div class="court-info">
        <h3 class="court-title">{selectedCourtSlots.courtName || selectedCourt.courtName || selectedCourt.name || '코트'}</h3>
        <div class="court-details">
          <span>정원: {selectedCourtSlots.personnelNumber}명</span>
          <LevelBadge level={selectedCourtSlots.courtLevel || selectedCourt.courtLevel || selectedCourt.level} />
        </div>
      </div>

      <div class="slots-list">
        {#each selectedCourtSlots.slots as slotInfo (slotInfo.timeSlot)}
          {@const style = getStatusStyle(slotInfo)}
          {@const isRental = slotInfo.scheduleType === 'RENTAL'}
          <button
            class="slot-item"
            disabled={slotInfo.status === "FULL" || slotInfo.status === "CLOSED" || isRental}
            style="background:{style.bg}; border-color:{style.color}"
            on:click={() => openDetail(slotInfo.timeSlot, slotInfo)}
          >
            <div class="slot-left">
              <div class="slot-time">⏰ {slotInfo.timeSlot}</div>
              {#if slotInfo.scheduleType}
                <span class="slot-type" class:rental={isRental}>
                  {getScheduleTypeLabel(slotInfo.scheduleType)}
                </span>
              {/if}
            </div>
            {#if isRental}
              <div class="slot-info">
                <div class="rental-notice">일반 예약 불가</div>
              </div>
            {:else}
              <div class="slot-info">
                <div class="slot-count" style="color:{style.color}">
                  {slotInfo.reservedCount}/{slotInfo.capacity}명
                </div>
                <div class="slot-status" style="color:{style.color}">
                  {getStatusLabel(slotInfo)}
                </div>
              </div>
            {/if}
          </button>
        {/each}
      </div>

      {#if selectedCourtSlots.slots.length === 0}
        <div class="empty-msg">예약 가능한 시간대가 없습니다.</div>
      {/if}
    </div>
  {:else if !loading}
    <div class="empty-msg">코트 정보를 불러올 수 없습니다.</div>
  {/if}
</div>

<style>
  .card {
    background: #fff;
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  }
  .slide-up {
    animation: slideUp 0.4s ease;
  }
  .step-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .step-number {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #1a365d;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
  }
  .step-title {
    font-weight: 700;
    font-size: 15px;
    color: #1a365d;
  }
  .loading-text {
    font-size: 12px;
    color: #718096;
    margin-left: auto;
  }
  .legend {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #718096;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .tab {
    padding: 12px 20px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 100px;
  }
  .tab:hover {
    border-color: #bee3f8;
    background: #f7fafc;
  }
  .tab.active {
    border-color: #1a365d;
    background: #ebf8ff;
    box-shadow: 0 2px 8px rgba(26, 54, 93, 0.1);
  }
  .tab-name {
    font-weight: 700;
    font-size: 14px;
    color: #2d3748;
  }

  /* Court Content */
  .court-content {
    animation: fadeIn 0.3s ease;
  }
  .court-info {
    background: #f7fafc;
    padding: 16px;
    border-radius: 10px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .court-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1a365d;
  }
  .court-details {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #4a5568;
    font-weight: 600;
  }

  /* Slots List */
  .slots-list {
    display: grid;
    gap: 10px;
  }
  .slot-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-radius: 10px;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    background: #fff;
  }
  .slot-item:not(:disabled):hover {
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  .slot-item:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  .slot-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .slot-time {
    font-weight: 700;
    font-size: 16px;
    color: #2d3748;
  }
  .slot-type {
    font-size: 12px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 12px;
    background: #e3f2fd;
    color: #1565c0;
  }
  .slot-type.rental {
    background: #fff3e0;
    color: #e65100;
  }
  .slot-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .slot-count {
    font-weight: 700;
    font-size: 18px;
  }
  .slot-status {
    font-size: 13px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.6);
  }
  .rental-notice {
    font-size: 13px;
    font-weight: 600;
    color: #e65100;
    padding: 4px 12px;
    border-radius: 12px;
    background: rgba(255, 243, 224, 0.6);
  }

  .empty-msg {
    padding: 40px;
    text-align: center;
    color: #718096;
    font-size: 14px;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
