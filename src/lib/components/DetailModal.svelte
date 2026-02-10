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
  const capacity = $derived($modalData?.court?.capacity ?? 6);
  const isFull = $derived(playerCount >= capacity);
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
        <div class="players-label">현재 예약자 ({playerCount}/{capacity}명)</div>
        {#if playerCount > 0}
          <div class="players-list">
            {#each players as p, i (i)}
              <PlayerChip player={p} />
            {/each}
          </div>
        {:else}
          <div class="empty-msg">아직 예약자가 없습니다. 첫 번째 참가자가 되어보세요! 🎉</div>
        {/if}
      </div>

      {#if isFull}
        <div class="full-msg">정원이 마감되었습니다</div>
      {:else}
        <div class="actions">
          <button class="btn-secondary" onclick={() => modalOpen.set(false)}>닫기</button>
          <button class="btn-primary" onclick={handleReserve}>예약 신청하기</button>
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
    background: #f7fafc; border-radius: 10px; padding: 14px; margin-bottom: 16px;
  }
  .players-label { font-size: 12px; font-weight: 600; color: #4a5568; margin-bottom: 10px; }
  .players-list { display: flex; flex-direction: column; gap: 6px; }
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
