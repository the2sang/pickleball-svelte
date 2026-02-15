<script>
  import Modal from "$lib/components/Modal.svelte";
  import { auth } from "$lib/stores/auth.js";
  import { refreshTrigger, successOpen, successMessage } from "$lib/stores/reservation.js";
  import { parseApiErrorResponse } from "$lib/utils/apiError.js";

  let {
    open = false,
    onclose = () => {},
    partnerName = "",
    courts = [],
    defaultCourtId = null,
    defaultDate = "",
  } = $props();

  let loading = $state(false);
  let error = $state("");

  let courtId = $state(null);
  let gameDate = $state("");
  let startTime = $state("09:00");
  let endTime = $state("11:00");
  let timeName = $state("대관");
  let endTimeOptions = $state([]);
  let initializedSession = $state("");
  const DEFAULT_START_TIME = "09:00";
  const DEFAULT_END_TIME = "11:00";

  const timeOptions = (() => {
    const options = [];
    for (let h = 9; h <= 24; h++) {
      options.push(`${String(h).padStart(2, "0")}:00`);
    }
    return options;
  })();

  function pickEndTimeFromStart(start) {
    const options = getEndOptionsForStart(start);
    if (options.length === 0) return "";
    return options[0];
  }

  function getOpenSessionKey() {
    return `${defaultCourtId ?? ""}::${defaultDate ?? ""}`;
  }

  function normalizeSelectedTimes() {
    const safeStartTime = timeOptions.includes(startTime)
      ? startTime
      : DEFAULT_START_TIME;
    if (safeStartTime !== startTime) {
      startTime = safeStartTime;
    }

    const availableEndTimes = getEndOptionsForStart(safeStartTime);
    endTimeOptions = availableEndTimes;

    if (!availableEndTimes.includes(endTime)) {
      endTime = availableEndTimes[0] ?? "";
    }
  }

  function initOpenState() {
    courtId = defaultCourtId || (courts?.[0]?.id ?? null);
    gameDate = defaultDate || gameDate;

    startTime = timeOptions.includes(DEFAULT_START_TIME) ? DEFAULT_START_TIME : timeOptions[0] ?? "";
    endTime = timeOptions.includes(DEFAULT_END_TIME)
      ? DEFAULT_END_TIME
      : pickEndTimeFromStart(startTime);

    if (!startTime) {
      return;
    }

    if (toMinutes(endTime) <= toMinutes(startTime)) {
      endTime = pickEndTimeFromStart(startTime);
    }
  }

  $effect(() => {
    if (!open) {
      initializedSession = "";
      endTimeOptions = getEndOptionsForStart(startTime);
      return;
    }

    const sessionKey = getOpenSessionKey();
    if (initializedSession === sessionKey) {
      return;
    }

    error = "";
    initializedSession = sessionKey;
    initOpenState();
  });

  const getEndOptionsForStart = (start) => {
    const startMin = toMinutes(start);
    return timeOptions.filter((t) => toMinutes(t) > startMin);
  };

  $effect(() => {
    normalizeSelectedTimes();
  });

  function getDurationLabel() {
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || endMin <= startMin) {
      return "-";
    }

    const diff = endMin - startMin;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (m === 0) return `${h}시간`;
    return `${h}시간 ${m}분`;
  }

  const durationLabel = $derived(getDurationLabel());

  function toMinutes(t) {
    if (!t) return NaN;
    if (t === "24:00") return 1440;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  async function submit() {
    error = "";

    if (!courtId || !gameDate || !startTime || !endTime) {
      error = "필수 항목을 입력해주세요.";
      return;
    }

    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    if (endMin <= startMin) {
      error = "종료시간은 시작시간보다 이후여야 합니다.";
      return;
    }

    let user = null;
    const unsub = auth.subscribe((v) => (user = v));
    unsub();

    if (!user?.accessToken) {
      error = "로그인이 필요합니다.";
      return;
    }

    loading = true;
    try {
      const payload = {
        courtId,
        gameDate,
        startTime: startTime === "24:00" ? "00:00" : startTime,
        endTime: endTime === "24:00" ? "00:00" : endTime,
        timeName,
      };

      const res = await fetch("/api/v1/rentals/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const apiErr = await parseApiErrorResponse(res);
        throw new Error(apiErr.message);
      }

      successMessage.set("대관 신청이 접수되었습니다!");
      successOpen.set(true);
      setTimeout(() => {
        successOpen.set(false);
        successMessage.set("");
      }, 2500);

      refreshTrigger.update((n) => n + 1);
      onclose();
    } catch (e) {
      error = e.message || "대관 신청에 실패했습니다.";
    } finally {
      loading = false;
    }
  }
</script>

<Modal open={open} onclose={onclose}>
  {#snippet children()}
    <div class="body">
      <div class="icon">🏟️</div>
      <h3 class="title">대관 신청</h3>

      <div class="form">
        <label class="pb-field">
          <span class="pb-label">사업장</span>
          <input class="pb-input" type="text" value={partnerName} disabled />
        </label>

        <label class="pb-field">
          <span class="pb-label">코트</span>
          <select class="pb-input" bind:value={courtId} disabled={courts.length === 0}>
            {#each courts as c (c.id)}
              <option value={c.id}>{c.courtName || c.name || `코트 ${c.id}`}</option>
            {/each}
          </select>
        </label>

        <label class="pb-field">
          <span class="pb-label">신청일자</span>
          <input class="pb-input" type="date" bind:value={gameDate} />
        </label>

        <div class="row">
          <label class="pb-field">
            <span class="pb-label">시작시간</span>
            <select class="pb-input" bind:value={startTime}>
              {#each timeOptions as t (t)}
                {#if t !== "24:00"}
                  <option value={t}>{t}</option>
                {/if}
              {/each}
            </select>
          </label>

          <label class="pb-field">
            <span class="pb-label">종료시간</span>
            <select class="pb-input" bind:value={endTime}>
              {#each endTimeOptions as t (t)}
                <option value={t}>{t}</option>
              {/each}
            </select>
          </label>
        </div>

        <div class="duration">이용시간 : {durationLabel}</div>

      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <div class="actions">
        <button class="pb-btn-ghost btn secondary" onclick={onclose} disabled={loading}>닫기</button>
        <button class="pb-btn-primary btn primary" onclick={submit} disabled={loading || courts.length === 0}>
          {loading ? "처리중..." : "신청하기"}
        </button>
      </div>
    </div>
  {/snippet}
</Modal>

<style>
  .body { text-align: center; }
  .icon { font-size: 40px; margin-bottom: 10px; }
  .title { margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #1a365d; }

  .form {
    background: #f7fafc;
    border-radius: 12px;
    padding: 14px;
    text-align: left;
    border: 1px solid #e2e8f0;
    margin-bottom: 12px;
  }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .duration {
    font-size: 12px;
    font-weight: 700;
    color: #2e7d32;
    padding: 10px 12px;
    background: #e8f5e9;
    border-radius: 10px;
    border: 1px solid #a5d6a7;
    margin: 4px 0 10px;
  }
  .error { color: #e53e3e; font-weight: 700; font-size: 13px; margin-bottom: 10px; }
  .actions { display: flex; gap: 10px; }
  .btn { flex: 1; }

  @media (max-width: 520px) {
    .row { grid-template-columns: 1fr; }
  }
</style>
