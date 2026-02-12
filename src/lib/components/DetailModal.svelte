<script>
  import Modal from './Modal.svelte';
  import LevelBadge from './LevelBadge.svelte';
  import PlayerChip from './PlayerChip.svelte';
  import { selectedDate, modalOpen, modalData, confirmOpen } from '$lib/stores/reservation.js';

  function handleReserve() {
    modalOpen.set(false);
    confirmOpen.set(true);
  }

  const players = $derived($modalData?.reservation?.players ?? []);
  const playerCount = $derived(players.length);
  const capacity = $derived($modalData?.reservation?.capacity ?? $modalData?.court?.capacity ?? 6);
  const confirmedPlayers = $derived(players.filter(p => !p.isWaiting));
  const waitingPlayers = $derived(players.filter(p => p.isWaiting));
  const isFull = $derived(playerCount >= capacity);
  const canReserve = $derived(playerCount < capacity + 10); // 최대 10명까지 대기 가능
</script>

<Modal open={$modalOpen} onclose={() => modalOpen.set(false)}>
  {#snippet children()}
    {#if $modalData}
      <div class="header">
        <div>
          <h3 class="court-name">{$modalData.court.name}</h3>
          <p class="meta">{$selectedDate} · {$modalData.timeSlot}</p>
        </div>
        <LevelBadge level={$modalData.court.level} />
      </div>

      <div class="players-section">
        <div class="players-label">
          확정 예약자 ({confirmedPlayers.length}/{capacity}명)
        </div>
        {#if confirmedPlayers.length > 0}
          <div class="players-list">
            {#each confirmedPlayers as p (p.orderNumber)}
              <div class="player-item">
                <span class="player-order">{p.orderNumber}</span>
                <PlayerChip player={p} />
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
              <div class="player-item waiting">
                <span class="player-order waiting">{p.orderNumber}</span>
                <PlayerChip player={p} />
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if !canReserve}
        <div class="full-msg">대기 인원이 가득 찼습니다</div>
      {:else}
        <div class="actions">
          <button class="btn-secondary" onclick={() => modalOpen.set(false)}>닫기</button>
          <button class="btn-primary" onclick={handleReserve}>
            {#if isFull}
              대기 예약 신청하기
            {:else}
              예약 신청하기
            {/if}
          </button>
        </div>
      {/if}
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
  }
  .player-item.waiting {
    background: #fffbf5;
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
  .empty-msg { text-align: center; padding: 16px; color: #a0aec0; font-size: 13px; }
  .full-msg {
    text-align: center; padding: 12px; background: #ffebee;
    border-radius: 8px; color: #c62828; font-size: 13px; font-weight: 600;
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
</style>
