<script>
  import Modal from "./Modal.svelte";
  import paddleImage from "$lib/assets/pickleball-paddle.svg";
  import {
    selectedDate,
    partnerInfo,
    modalData,
    confirmOpen,
    successOpen,
    successMessage,
    refreshTrigger,
  } from "$lib/stores/reservation.js";
  import { auth } from "$lib/stores/auth.js";
  import { parseApiErrorResponse } from "$lib/utils/apiError.js";

  let loading = $state(false);
  let error = $state("");

  async function handleConfirm() {
    if (!$modalData || !$auth) return;

    loading = true;
    error = "";

    try {
      const payload = {
        courtId: $modalData.court.id,
        gameDate: $selectedDate,
        timeSlot: $modalData.timeSlot,
        teamName: "",
      };

      const res = await fetch("/api/v1/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${$auth.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const apiErr = await parseApiErrorResponse(res);
        throw new Error(apiErr.message);
      }

      // Success
      confirmOpen.set(false);
      successMessage.set('예약이 완료되었습니다!');
      successOpen.set(true);
      refreshTrigger.update((n) => n + 1);
      setTimeout(() => {
        successOpen.set(false);
        successMessage.set('');
      }, 2500);
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  const partnerName = $derived($partnerInfo?.businessPartner ?? $partnerInfo?.name ?? "");
</script>

<Modal open={$confirmOpen} onclose={() => confirmOpen.set(false)}>
  {#snippet children()}
    <div class="confirm-body">
      <div class="confirm-header">
        <img class="icon" src={paddleImage} alt="피클볼 패들" />
        <h3 class="title">예약을 확정하시겠습니까?</h3>
      </div>

      {#if $modalData}
        <div class="summary">
          <div><strong>사업장:</strong> {partnerName}</div>
          <div>
            <strong>코트:</strong>
            {$modalData.court.courtName || $modalData.court.name || '코트'} ({$modalData.court.courtLevel || $modalData.court.level || ''})
          </div>
          <div><strong>날짜:</strong> {$selectedDate}</div>
          <div><strong>시간:</strong> {$modalData.timeSlot}</div>
        </div>
      {/if}

      {#if error}
        <div class="error-msg">{error}</div>
      {/if}

      <div class="warning">
        ⚠️ 게임 개시 2시간 전, 이후에는 예약 취소가 제한됩니다
      </div>

      <div class="actions">
        <button
          class="pb-btn-ghost btn-cancel"
          onclick={() => confirmOpen.set(false)}
          disabled={loading}>취소</button
        >
        <button class="pb-btn-success btn-confirm" onclick={handleConfirm} disabled={loading}>
          {loading ? "처리중..." : "확정하기"}
        </button>
      </div>
    </div>
  {/snippet}
</Modal>

<style>
  .confirm-body {
    text-align: center;
  }
  .confirm-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
  .title {
    margin: 0;
    font-size: 17px;
    font-weight: 800;
    color: #1a365d;
  }
  .summary {
    background: #f7fafc;
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #4a5568;
    line-height: 1.8;
    text-align: left;
  }
  .warning {
    background: #fff8e1;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 16px;
    font-size: 11px;
    color: #f57f17;
  }
  .actions {
    display: flex;
    gap: 10px;
  }
  .btn-cancel {
    flex: 1;
  }
  .btn-confirm {
    flex: 2;
  }
  .error-msg {
    color: #e53e3e;
    font-size: 13px;
    margin-bottom: 10px;
    font-weight: 600;
  }
</style>
