<script>
  import {
    selectedDate,
    filteredCourts,
    modalOpen,
    modalData,
    refreshTrigger,
    partnerInfo,
  } from "$lib/stores/reservation.js";
  import { auth } from "$lib/stores/auth.js";
  import { getReservationCounts, isGeneralMember, isPastSlot } from "$lib/utils/reservationPolicy.js";
  import LevelBadge from "./LevelBadge.svelte";
  import RentalRequestModal from "./RentalRequestModal.svelte";

  let courtSlotsMap = {};
  let timeRows = [];
  let loading = false;
  let selectedCourtId = null;
  let showLoginPrompt = false;
  let showClosedPrompt = false;
  let rentalOpen = false;

  $: if ($selectedDate && $filteredCourts && $filteredCourts.length > 0 && $refreshTrigger >= 0) {
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

    try {
      const promises = $filteredCourts.map(async (court) => {
        const url = `/api/v1/courts/${court.id}/slots?date=${$selectedDate}`;
        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(url, { headers });
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

  async function openApplicants(timeSlot, info) {
    if (!info || !selectedCourt) return;

    if (!$auth) {
      showLoginPrompt = true;
      return;
    }

    // 현재 시간이 지난 시간대인지 확인
    if (isPastSlot(timeSlot, $selectedDate)) {
      showClosedPrompt = true;
      return;
    }

    let nextInfo = info;

    try {
      const res = await fetch(
        `/api/v1/courts/${selectedCourt.id}/slots/${encodeURIComponent(timeSlot)}/players?date=${$selectedDate}`
      );
      if (res.ok) {
        const players = await res.json();
        const reservedCount = Array.isArray(players) ? players.length : info.reservedCount ?? 0;
        nextInfo = {
          ...info,
          players,
          reservedCount,
        };
      } else {
        console.error("Failed to fetch players:", selectedCourt.id, timeSlot, res.status);
      }
    } catch (e) {
      console.error("Failed to fetch players for slot:", e);
    }

    modalData.set({
      court: selectedCourt,
      timeSlot,
      reservation: { ...nextInfo, date: $selectedDate },
      shouldAutoClose: true,
    });
    modalOpen.set(true);
  }

  function selectCourt(courtId) {
    selectedCourtId = courtId;
  }

  function openRentalRequest() {
    if (!$auth) {
      showLoginPrompt = true;
      return;
    }
    if ($auth.accountType === 'PARTNER') {
      return;
    }
    rentalOpen = true;
  }

  function getStatusStyle(info, timeSlot) {
    if (!info) return { bg: "#f7fafc", color: "#cbd5e0", opacity: 0.5 }; // No slot

    // 현재 시간이 지난 시간대는 마감 처리
    if (timeSlot && isPastSlot(timeSlot, $selectedDate)) {
      return { bg: "#edf2f7", color: "#a0aec0" };
    }

    if (info.status === "CLOSED") return { bg: "#edf2f7", color: "#a0aec0" };

    const counts = getReservationCounts(
      info.reservedCount ?? info.players?.length ?? 0,
      info.capacity ?? info.personnelNumber
    );

    if (counts.isFull) return { bg: "#FFEBEE", color: "#C62828" };

    // Available
    if (counts.total > 0) return { bg: "#FFF3E0", color: "#E65100" }; // Partial
    return { bg: "#E8F5E9", color: "#2E7D32" }; // Empty
  }

  function getStatusLabel(info, timeSlot) {
    if (!info) return "-";

    // 현재 시간이 지난 시간대는 마감
    if (timeSlot && isPastSlot(timeSlot, $selectedDate)) {
      return "마감";
    }

    if (info.status === "CLOSED") return "마감";

    const counts = getReservationCounts(
      info.reservedCount ?? info.players?.length ?? 0,
      info.capacity ?? info.personnelNumber
    );

    if (counts.isFull) return "마감";
    if (counts.total > 0) return "일부예약";
    return "예약접수";
  }

  function getScheduleTypeLabel(scheduleType) {
    if (scheduleType === "RENTAL") return "대관";
    if (scheduleType === "OPEN_GAME") return "오픈게임";
    return "";
  }

  // 시간대 포맷팅: "06:00~09:00" → "오전6시~9시(3시간)"
  function formatTimeSlot(timeSlot) {
    try {
      const [startStr, endStr] = timeSlot.split('~').map(s => s.trim());
      const [startHour, startMin] = startStr.split(':').map(Number);
      const [endHour, endMin] = endStr.split(':').map(Number);

      // 오전/오후 구분
      const startPeriod = startHour < 12 ? '오전' : '오후';
      const endPeriod = endHour < 12 ? '오전' : '오후';

      // 12시간 형식 변환
      const startHour12 = startHour === 0 ? 12 : (startHour > 12 ? startHour - 12 : startHour);
      const endHour12 = endHour === 0 ? 12 : (endHour > 12 ? endHour - 12 : endHour);

      // 시간 포맷 (분이 00이면 생략, 앞자리 0 제거)
      const formatTime = (hour, min, showPeriod = true, period = '') => {
        const minStr = min > 0 ? `${min}분` : '';
        return `${showPeriod ? period : ''}${hour}시${minStr}`;
      };

      const startTimeStr = formatTime(startHour12, startMin, true, startPeriod);
      const endTimeStr = formatTime(endHour12, endMin, startPeriod !== endPeriod, endPeriod);

      // 시간 차이 계산
      const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      const durationStr = minutes > 0
        ? `${hours}시간${minutes}분`
        : `${hours}시간`;

      return `${startTimeStr}~${endTimeStr}(${durationStr})`;
    } catch (e) {
      console.error('시간 포맷팅 오류:', e);
      return timeSlot; // 오류 시 원본 반환
    }
  }
</script>

<div class="pb-card card slide-up">
  <div class="step-header">
    <span class="step-number">3</span>
    <span class="step-title">시간대별 게임 현황</span>
    {#if loading}
      <span class="loading-text">불러오는 중...</span>
    {/if}
  </div>

  <div class="legend">
    <span class="legend-item"
      ><span class="dot" style="background:#E8F5E9"></span> 예약접수</span
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
  <div class="tabs-row">
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
    {#if $auth && $auth.accountType !== 'PARTNER'}
      <button class="rental-btn" on:click={openRentalRequest}>대관신청</button>
    {/if}
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
          {@const style = getStatusStyle(slotInfo, slotInfo.timeSlot)}
          {@const isRental = slotInfo.scheduleType === 'RENTAL'}
          {@const isGeneral = !!$auth && isGeneralMember($auth?.accountType)}
          {@const isRentalRestricted = isRental && isGeneral}
          {@const isPast = isPastSlot(slotInfo.timeSlot, $selectedDate)}
          {@const counts = getReservationCounts(
            slotInfo.reservedCount ?? slotInfo.players?.length ?? 0,
            slotInfo.capacity ?? slotInfo.personnelNumber ?? selectedCourtSlots.personnelNumber
          )}
          <div class="slot-wrapper">
            <div
              class="slot-item"
              class:locked={slotInfo.status === "CLOSED" || isPast}
              style="background:{style.bg}; border-color:{style.color}"
            >
              <div class="slot-left">
                <div class="slot-time">⏰ {formatTimeSlot(slotInfo.timeSlot)}</div>
                {#if slotInfo.scheduleType}
                  <span class="slot-type" class:rental={isRental}>
                    {getScheduleTypeLabel(slotInfo.scheduleType)}
                  </span>
                {/if}
              </div>
                {#if isRentalRestricted}
                  <div class="slot-info">
                    <button
                      class="slot-status-link slot-status-link--disabled"
                      style="color:{style.color}"
                      type="button"
                      on:click={() => openApplicants(slotInfo.timeSlot, slotInfo)}
                    >
                      불가
                    </button>
                    <div class="rental-notice">일반 예약 불가</div>
                    <button
                      class="pb-btn-ghost player-view-btn"
                      aria-label="신청자 보기"
                      type="button"
                      on:click={() => openApplicants(slotInfo.timeSlot, slotInfo)}
                    >
                      <span
                        class="people-icon"
                        class:people-icon--active={counts.total > 0}
                        class:people-icon--empty={counts.total === 0}
                        aria-hidden="true"
                      >
                        👤
                      </span>
                    </button>
                  </div>
              {:else}
                <div class="slot-info">
                  <div class="slot-count" style="color:{style.color}">
                    {counts.total}/{counts.cap}명
                  </div>
                  <button
                    class="slot-status-link"
                    style="color:{style.color}"
                    type="button"
                    on:click={() => openApplicants(slotInfo.timeSlot, slotInfo)}
                  >
                    {getStatusLabel(slotInfo, slotInfo.timeSlot)}
                  </button>
                  <button
                    class="pb-btn-ghost player-view-btn"
                    aria-label="신청자 보기"
                    type="button"
                    disabled={slotInfo.status === "CLOSED" || isPast}
                    on:click={() => openApplicants(slotInfo.timeSlot, slotInfo)}
                  >
                    <span
                      class="people-icon"
                      class:people-icon--active={counts.total > 0}
                      class:people-icon--empty={counts.total === 0}
                      aria-hidden="true"
                    >
                      👤
                    </span>
                  </button>
                </div>
              {/if}
            </div>
          </div>
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

<!-- Login Prompt Modal -->
{#if showLoginPrompt}
  <div
    class="login-overlay"
    role="button"
    tabindex="0"
    on:click={() => (showLoginPrompt = false)}
    on:keydown={(e) => e.key === "Escape" && (showLoginPrompt = false)}
  >
    <div
      class="login-modal"
      role="dialog"
      tabindex="0"
      aria-labelledby="login-prompt-title"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <div class="login-modal-icon">🔒</div>
      <h3 id="login-prompt-title" class="login-modal-title">로그인이 필요합니다</h3>
      <p class="login-modal-msg">
        로그인 후 예약 진행이 가능합니다.<br />
        계정이 없는 경우 회원가입 바랍니다.
      </p>
      <div class="login-modal-actions">
        <a href="/login" class="login-modal-btn primary">로그인</a>
        <a href="/signup" class="login-modal-btn secondary">회원가입</a>
      </div>
      <button class="login-modal-close" on:click={() => (showLoginPrompt = false)}>닫기</button>
    </div>
  </div>
{/if}

<!-- Closed Prompt Modal -->
{#if showClosedPrompt}
  <div
    class="login-overlay"
    role="button"
    tabindex="0"
    on:click={() => (showClosedPrompt = false)}
    on:keydown={(e) => e.key === "Escape" && (showClosedPrompt = false)}
  >
    <div
      class="login-modal"
      role="dialog"
      tabindex="0"
      aria-labelledby="closed-prompt-title"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <div class="login-modal-icon">⏰</div>
      <h3 id="closed-prompt-title" class="login-modal-title">예약 마감되었습니다</h3>
      <p class="login-modal-msg">
        해당 시간대는 이미 지나 예약이 불가능합니다.<br />
        다른 시간대를 선택해주세요.
      </p>
      <div class="login-modal-actions">
        <button class="login-modal-btn primary" on:click={() => (showClosedPrompt = false)}>확인</button>
      </div>
    </div>
  </div>
{/if}

<RentalRequestModal
  open={rentalOpen}
  onclose={() => (rentalOpen = false)}
  partnerName={$partnerInfo?.businessPartner || $partnerInfo?.name || ''}
  courts={$filteredCourts}
  defaultCourtId={selectedCourtId}
  defaultDate={$selectedDate}
/>

<style>
  .card {
    padding: 20px;
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
  .tabs-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    flex: 1;
  }

  .rental-btn {
    flex-shrink: 0;
    padding: 12px 14px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #1a365d, #2a4a7f);
    color: #fff;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(26, 54, 93, 0.22);
    transition: transform 0.15s, box-shadow 0.15s;
    white-space: nowrap;
  }
  .rental-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(26, 54, 93, 0.26);
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
    gap: 6px;
  }
  .slot-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-radius: 10px;
    border: 2px solid;
    cursor: default;
    transition: all 0.2s;
    font-family: inherit;
    background: #fff;
    width: 100%;
  }
  .slot-item:not(.locked):hover {
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  .slot-item.locked {
    cursor: not-allowed;
    opacity: 0.7;
  }
  .slot-left {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .slot-time {
    font-weight: 700;
    font-size: 13px;
    color: #2d3748;
  }
  .slot-type {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
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
    gap: 10px;
  }
  .player-view-btn {
    margin-left: auto;
    padding: 4px;
    padding: 0;
    border-radius: 999px;
    min-width: auto;
    width: 26px;
    height: 26px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #38bdf8;
    border: 1px solid #38bdf8;
    color: #fff;
  }

  .player-view-btn:disabled {
    background: #9ca3af;
    border-color: #9ca3af;
    color: #f9fafb;
  }

  .people-icon {
    font-size: 14px;
    line-height: 1;
    color: #f59e0b;
  }
  .people-icon--active {
    color: #f59e0b;
  }
  .people-icon--empty {
    color: #38bdf8;
  }
  .slot-count {
    font-weight: 700;
    font-size: 14px;
  }
  .slot-status-link {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.6);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
    font-family: inherit;
    line-height: 1.4;
  }

  .slot-status-link:hover {
    text-decoration-thickness: 2px;
  }

  .slot-status-link--disabled {
    background: #fffaf5;
    border: 1px solid #fcd9b6;
  }
  .rental-notice {
    font-size: 12px;
    font-weight: 600;
    color: #e65100;
    padding: 2px 8px;
    border-radius: 12px;
    background: rgba(255, 243, 224, 0.6);
  }

  .empty-msg {
    padding: 40px;
    text-align: center;
    color: #718096;
    font-size: 14px;
  }

  /* Login Prompt Modal */
  .login-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }
  .login-modal {
    background: #fff;
    border-radius: 16px;
    padding: 32px 28px 24px;
    max-width: 380px;
    width: 90%;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease;
  }
  .login-modal-icon {
    font-size: 44px;
    margin-bottom: 12px;
  }
  .login-modal-title {
    margin: 0 0 10px;
    font-size: 18px;
    font-weight: 800;
    color: #1a365d;
  }
  .login-modal-msg {
    margin: 0 0 22px;
    font-size: 14px;
    color: #4a5568;
    line-height: 1.7;
  }
  .login-modal-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }
  .login-modal-btn {
    flex: 1;
    padding: 12px 0;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    text-align: center;
    transition: all 0.15s;
  }
  .login-modal-btn.primary {
    background: linear-gradient(135deg, #1a365d, #2a4a7f);
    color: #fff;
    box-shadow: 0 4px 12px rgba(26, 54, 93, 0.3);
  }
  .login-modal-btn.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(26, 54, 93, 0.4);
  }
  .login-modal-btn.secondary {
    background: #fff;
    color: #1a365d;
    border: 1.5px solid #e2e8f0;
  }
  .login-modal-btn.secondary:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
  }
  .login-modal-close {
    background: none;
    border: none;
    color: #a0aec0;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
    padding: 4px 12px;
  }
  .login-modal-close:hover {
    color: #718096;
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
