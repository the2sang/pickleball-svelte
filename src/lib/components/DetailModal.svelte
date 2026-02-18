<script>
  import Modal from './Modal.svelte';
  import LevelBadge from './LevelBadge.svelte';
  import PlayerChip from './PlayerChip.svelte';
  import { selectedDate, modalOpen, modalData, confirmOpen, refreshTrigger } from '$lib/stores/reservation.js';
  import { auth } from '$lib/stores/auth.js';
  import { buildApiUrl } from "$lib/api.js";
  import {
    getReservationCounts,
    isCancelDeadlinePassed,
    isGeneralMember,
  } from '$lib/utils/reservationPolicy.js';
  import { parseApiErrorResponse } from '$lib/utils/apiError.js';

  let cancelLoading = $state(false);
  let cancelError = $state('');
  let cancelConfirmOpen = $state(false);

  function handleReserve() {
    modalOpen.set(false);
    confirmOpen.set(true);
  }

  function showCancelConfirm() {
    cancelConfirmOpen = true;
  }

  async function executeCancelReservation() {
    if (!myReservation || !$auth) return;

    cancelLoading = true;
    cancelError = '';
    cancelConfirmOpen = false;

    try {
      const res = await fetch(
        buildApiUrl(`/api/v1/reservations/${myReservation.reservationId}`),
        {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${$auth.accessToken}`,
        },
      });

      if (!res.ok) {
        const apiErr = await parseApiErrorResponse(res);
        throw new Error(apiErr.message);
      }

      modalOpen.set(false);
      refreshTrigger.update(n => n + 1);
    } catch (e) {
      cancelError = e.message;
    } finally {
      cancelLoading = false;
    }
  }

  const players = $derived($modalData?.reservation?.players ?? []);
  const playerCount = $derived(players.length);
  const capacity = $derived($modalData?.reservation?.capacity ?? $modalData?.court?.capacity ?? 6);
  const reservedCount = $derived($modalData?.reservation?.reservedCount ?? playerCount);
  const counts = $derived(getReservationCounts(reservedCount, capacity));

  const confirmedPlayers = $derived(players.filter(p => !p.isWaiting));
  const waitingPlayers = $derived(players.filter(p => p.isWaiting));

  const status = $derived(String($modalData?.reservation?.status ?? '').trim().toUpperCase());
  const scheduleType = $derived(String($modalData?.reservation?.scheduleType ?? '').trim().toUpperCase());
  const isClosed = $derived(status === 'CLOSED');
  const isRental = $derived(scheduleType === 'RENTAL');
  const isRentalRestricted = $derived(isRental && isGeneralMember($auth?.accountType));
  const isFull = $derived(counts.isFull);
  const canReserve = $derived(!isClosed && !isRentalRestricted && !isFull);

  const cancelDeadlinePassed = $derived(
    !$modalData ? false : isCancelDeadlinePassed($modalData.timeSlot, $selectedDate)
  );

  const currentUsername = $derived($auth?.username ?? '');
  const myReservation = $derived(players.find(p => p.username === currentUsername) ?? null);
  const isMyReserved = $derived(!!myReservation);
</script>

<Modal open={$modalOpen} onclose={() => modalOpen.set(false)}>
  {#snippet children()}
    {#if $modalData}
      <div class="header">
        <div>
          <h3 class="court-name">{$modalData.court.courtName || $modalData.court.name || '코트'}</h3>
          <p class="meta">{$selectedDate} · {$modalData.timeSlot}</p>
        </div>
        <LevelBadge level={$modalData.court.courtLevel || $modalData.court.level} />
      </div>

      <div class="players-section">
        <div class="players-label">
          확정 예약자 ({confirmedPlayers.length}/{capacity}명)
        </div>
        {#if confirmedPlayers.length > 0}
          <div class="players-list">
            {#each confirmedPlayers as p (p.orderNumber)}
              <div class="player-item" class:is-me={p.username === currentUsername}>
                <span class="player-order">{p.orderNumber}</span>
                <PlayerChip player={p} />
                {#if p.username === currentUsername}
                  <span class="me-badge">나</span>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-msg">아직 예약자가 없습니다. 첫 번째 참가자가 되어보세요! 🎉</div>
        {/if}
      </div>

      {#if waitingPlayers.length > 0}
        <div class="waiting-section">
          <div class="waiting-label">
            대기 회원 ({waitingPlayers.length}명)
          </div>
          <div class="players-list">
            {#each waitingPlayers as p (p.orderNumber)}
              <div class="player-item waiting" class:is-me={p.username === currentUsername}>
                <span class="player-order waiting">{p.orderNumber}</span>
                <PlayerChip player={p} />
                {#if p.username === currentUsername}
                  <span class="me-badge">나</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if cancelError}
        <div class="error-msg">{cancelError}</div>
      {/if}

      <div class="actions">
        <button class="pb-btn-ghost btn-secondary" onclick={() => modalOpen.set(false)}>닫기</button>
        {#if isMyReserved}
          <button
            class="pb-btn-danger btn-cancel-reservation"
            onclick={showCancelConfirm}
            disabled={cancelLoading || cancelDeadlinePassed}
            title={cancelDeadlinePassed ? '게임 개시 2시간 전 이후에는 취소할 수 없습니다' : ''}
          >
            {#if cancelLoading}
              처리중...
            {:else if cancelDeadlinePassed}
              취소 불가(2시간 전)
            {:else}
              예약 취소하기
            {/if}
          </button>
        {:else if isClosed}
          <button class="pb-btn-ghost btn-disabled" disabled>마감</button>
        {:else if isRentalRestricted}
          <button class="pb-btn-ghost btn-disabled" disabled>일반 예약 불가</button>
        {:else if isFull}
          <button class="pb-btn-ghost btn-disabled" disabled>마감</button>
        {:else}
          <button class="pb-btn-primary btn-primary" onclick={handleReserve}>
            예약 신청하기
          </button>
        {/if}
      </div>
    {/if}
  {/snippet}
</Modal>

<!-- 취소 확인 모달 -->
<Modal open={cancelConfirmOpen} onclose={() => cancelConfirmOpen = false}>
  {#snippet children()}
    <div class="cancel-confirm-body">
      <div class="warning-icon">⚠️</div>
      <h3 class="cancel-title">예약 취소 확인</h3>
      <p class="cancel-message">
        지금 예약취소하고 다시 예약하실 경우<br />
        순번이 뒤로 밀립니다.<br /><br />
        진행하시겠습니까?
      </p>
      <div class="cancel-actions">
        <button
          class="pb-btn-ghost btn-cancel-no"
          onclick={() => cancelConfirmOpen = false}
          disabled={cancelLoading}
        >
          아니오
        </button>
        <button
          class="pb-btn-danger btn-cancel-yes"
          onclick={executeCancelReservation}
          disabled={cancelLoading}
        >
          {cancelLoading ? '처리중...' : '확인'}
        </button>
      </div>
    </div>
  {/snippet}
</Modal>

<style>
  .header {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;
  }
  .court-name { margin: 0; font-size: 18px; font-weight: 800; color: #1a365d; }
  .meta { margin: 4px 0 0; font-size: 13px; color: #718096; }
  .players-section {
    background: #e8f5e9; border-radius: 10px; padding: 14px; margin-bottom: 12px;
    border: 2px solid #a5d6a7;
  }
  .waiting-section {
    background: #fff3e0; border-radius: 10px; padding: 14px; margin-bottom: 16px;
    border: 2px solid #ffcc80;
  }
  .players-label {
    font-size: 13px; font-weight: 700; color: #2e7d32; margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .waiting-label {
    font-size: 13px; font-weight: 700; color: #e65100; margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .players-list { display: flex; flex-direction: column; gap: 8px; }
  .player-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    transition: all 0.15s;
  }
  .player-item.waiting {
    background: #fffbf5;
  }
  .player-item.is-me {
    background: #fffde7;
    border: 2px solid #fdd835;
    box-shadow: 0 1px 6px rgba(253, 216, 53, 0.3);
  }
  .player-item.is-me.waiting {
    background: #fffde7;
    border-color: #fdd835;
    box-shadow: 0 1px 6px rgba(253, 216, 53, 0.3);
  }
  .player-order {
    min-width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2e7d32;
    color: white;
    border-radius: 50%;
    font-size: 13px;
    font-weight: 700;
  }
  .player-order.waiting {
    background: #e65100;
  }
  .me-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 700;
    color: #795548;
    background: #fff176;
    border: 1px solid #fdd835;
    padding: 2px 10px;
    border-radius: 10px;
    white-space: nowrap;
  }
  .empty-msg { text-align: center; padding: 16px; color: #a0aec0; font-size: 13px; }
  .error-msg {
    color: #e53e3e;
    font-size: 13px;
    margin-bottom: 10px;
    font-weight: 600;
    text-align: center;
    padding: 8px;
    background: #fff5f5;
    border-radius: 8px;
  }
  .actions { display: flex; gap: 10px; }
  .btn-secondary {
    flex: 1;
  }
  .btn-primary {
    flex: 2;
  }
  .btn-cancel-reservation {
    flex: 2;
  }
  .btn-disabled {
    flex: 2;
    background: #e2e8f0;
    color: #a0aec0; font-weight: 700; font-size: 14px; font-family: inherit;
    cursor: not-allowed;
  }

  /* 취소 확인 모달 스타일 */
  .cancel-confirm-body {
    text-align: center;
    padding: 8px;
  }
  .warning-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  .cancel-title {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 800;
    color: #c53030;
  }
  .cancel-message {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.8;
    color: #4a5568;
  }
  .cancel-actions {
    display: flex;
    gap: 10px;
  }
  .btn-cancel-no {
    flex: 1;
  }
  .btn-cancel-yes {
    flex: 1;
  }
</style>
