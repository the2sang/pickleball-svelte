<script>
  import Modal from './Modal.svelte';
  import LevelBadge from './LevelBadge.svelte';
  import PlayerChip from './PlayerChip.svelte';
  import { selectedDate, modalOpen, modalData, confirmOpen, refreshTrigger } from '$lib/stores/reservation.js';
  import { auth } from '$lib/stores/auth.js';

  let cancelLoading = $state(false);
  let cancelError = $state('');

  function handleReserve() {
    modalOpen.set(false);
    confirmOpen.set(true);
  }

  async function handleCancel() {
    if (!myReservation || !$auth) return;

    cancelLoading = true;
    cancelError = '';

    try {
      const res = await fetch(`/api/v1/reservations/${myReservation.reservationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${$auth.accessToken}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || '예약 취소에 실패했습니다.');
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
  const confirmedPlayers = $derived(players.filter(p => !p.isWaiting));
  const waitingPlayers = $derived(players.filter(p => p.isWaiting));
  const isFull = $derived(playerCount >= capacity);
  const canReserve = $derived(playerCount < capacity + 10); // 최대 10명까지 대기 가능

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
        <button class="btn-secondary" onclick={() => modalOpen.set(false)}>닫기</button>
        {#if isMyReserved}
          <button class="btn-cancel-reservation" onclick={handleCancel} disabled={cancelLoading}>
            {cancelLoading ? '처리중...' : '예약 취소하기'}
          </button>
        {:else if !canReserve}
          <button class="btn-disabled" disabled>대기 인원 마감</button>
        {:else}
          <button class="btn-primary" onclick={handleReserve}>
            {#if isFull}
              대기 예약 신청하기
            {:else}
              예약 신청하기
            {/if}
          </button>
        {/if}
      </div>
    {/if}
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
    flex: 1; padding: 12px 0; border-radius: 10px;
    border: 1.5px solid #e2e8f0; background: #fff;
    color: #718096; font-weight: 600; cursor: pointer; font-size: 14px; font-family: inherit;
  }
  .btn-primary {
    flex: 2; padding: 12px 0; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #1a365d, #2a4a7f);
    color: #fff; font-weight: 700; cursor: pointer; font-size: 14px; font-family: inherit;
    box-shadow: 0 4px 12px rgba(26, 54, 93, 0.3); transition: all 0.15s;
  }
  .btn-primary:hover { transform: translateY(-1px); }
  .btn-cancel-reservation {
    flex: 2; padding: 12px 0; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #c53030, #e53e3e);
    color: #fff; font-weight: 700; cursor: pointer; font-size: 14px; font-family: inherit;
    box-shadow: 0 4px 12px rgba(197, 48, 48, 0.3); transition: all 0.15s;
  }
  .btn-cancel-reservation:hover:not(:disabled) { transform: translateY(-1px); }
  .btn-cancel-reservation:disabled {
    opacity: 0.7; cursor: not-allowed;
  }
  .btn-disabled {
    flex: 2; padding: 12px 0; border-radius: 10px; border: none;
    background: #e2e8f0;
    color: #a0aec0; font-weight: 700; font-size: 14px; font-family: inherit;
    cursor: not-allowed;
  }
</style>
