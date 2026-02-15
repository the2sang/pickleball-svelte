<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth.js";
    import logo from "$lib/assets/main_logo.png";

    let courts = [];
    let selectedCourtId = null;

    // 오늘 날짜를 YYYY-MM-DD 형식으로 생성
    function getTodayString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let selectedDate = getTodayString(); // 오늘 날짜 디폴트
    let timeSlots = [];
    let loading = false;
    let saving = false;
    let error = "";
    let successMsg = "";

    // Generate 1-hour interval options from 06:00 to 24:00
    const timeOptions = [];
    for (let h = 6; h <= 24; h++) {
        const timeStr = `${String(h).padStart(2, "0")}:00`;
        timeOptions.push(timeStr);
    }

    onMount(async () => {
        auth.refresh();
        const user = getUser();
        if (!user || user.accountType !== "PARTNER") {
            goto("/login");
            return;
        }
        await fetchCourts();
    });

    function getUser() {
        let user = null;
        const unsub = auth.subscribe((v) => (user = v));
        unsub();
        return user;
    }

    function getToken() {
        return getUser()?.accessToken;
    }

    async function fetchCourts() {
        try {
            const res = await fetch("/api/v1/partner-manage/courts", {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error("코트 목록을 불러올 수 없습니다.");
            courts = await res.json();
            if (courts.length > 0) {
                selectedCourtId = courts[0].id;
                fetchSettings();
            }
        } catch (err) {
            error = err.message;
        }
    }

    function generateTimeSlots(gameTime) {
        // gameTime format: "06:00 ~ 22:00"
        if (!gameTime) return [];

        try {
            const [startStr, endStr] = gameTime.split("~").map((s) => s.trim());
            let startHour = parseInt(startStr.split(":")[0]);
            let endHour = parseInt(endStr.split(":")[0]);

            let slots = [];
            for (let h = startHour; h < endHour; h += 2) {
                let nextH = h + 2;
                if (nextH > endHour) nextH = endHour;

                let sTime = `${h.toString().padStart(2, "0")}:00`;
                let eTime = `${nextH.toString().padStart(2, "0")}:00`;

                slots.push({
                    startTime: sTime,
                    endTime: eTime,
                    type: "OPEN_GAME", // Default
                });
            }
            return slots;
        } catch (e) {
            console.error("Time parse error", e);
            return [];
        }
    }

    async function fetchSettings() {
        if (!selectedCourtId) return;
        loading = true;
        error = "";
        successMsg = "";

        try {
            // 1. Get court details to generate base slots
            const court = courts.find((c) => c.id === selectedCourtId);
            let baseSlots = generateTimeSlots(court.gameTime);

            // 2. Get saved settings
            const res = await fetch(
                `/api/v1/partner-manage/reservation/settings?courtId=${selectedCourtId}&date=${selectedDate}`,
                {
                    headers: { Authorization: `Bearer ${getToken()}` },
                },
            );

            if (res.ok) {
                const data = await res.json();

                if (data.timeSlots && data.timeSlots.length > 0) {
                    // Use saved settings
                    timeSlots = data.timeSlots.map((s) => ({
                        startTime:
                            s.startTime.length > 5
                                ? s.startTime.substring(0, 5)
                                : s.startTime,
                        endTime:
                            s.endTime === "00:00" || s.endTime === "00:00:00"
                                ? "24:00"
                                : s.endTime.length > 5
                                  ? s.endTime.substring(0, 5)
                                  : s.endTime,
                        type: s.type,
                    }));
                } else {
                    // Use default generation
                    timeSlots = baseSlots;
                }
            } else {
                timeSlots = baseSlots;
            }
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function hasOverlap(slots) {
        if (slots.length < 2) return null;

        const toMinutes = (t) => {
            const [h, m] = t.split(":").map(Number);
            return h === 0 && t === "24:00" ? 1440 : h * 60 + m;
        };

        const sorted = [...slots]
            .map((s, i) => ({ ...s, idx: i }))
            .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

        for (let i = 0; i < sorted.length - 1; i++) {
            const curEnd = toMinutes(sorted[i].endTime);
            const nextStart = toMinutes(sorted[i + 1].startTime);
            if (curEnd > nextStart) {
                return { a: sorted[i], b: sorted[i + 1] };
            }
        }
        return null;
    }

    async function handleSave() {
        if (!selectedCourtId) return;

        const overlap = hasOverlap(timeSlots);
        if (overlap) {
            error = `시간대가 겹칩니다: ${overlap.a.startTime}~${overlap.a.endTime} ↔ ${overlap.b.startTime}~${overlap.b.endTime}`;
            return;
        }

        saving = true;
        error = "";
        successMsg = "";

        try {
            const payload = {
                courtId: selectedCourtId,
                date: selectedDate,
                timeSlots: timeSlots.map((s) => ({
                    startTime: s.startTime === "24:00" ? "00:00" : s.startTime,
                    endTime: s.endTime === "24:00" ? "00:00" : s.endTime,
                    type: s.type,
                })),
            };

            const res = await fetch(
                "/api/v1/partner-manage/reservation/settings",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify(payload),
                },
            );

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                if (body?.code === "SCHEDULE_OVERLAP") {
                    throw new Error("시간대가 겹치는 스케줄이 있습니다. 시간을 조정해주세요.");
                }
                throw new Error(body?.message || "저장 실패");
            }

            successMsg = "저장되었습니다.";
            setTimeout(() => (successMsg = ""), 3000);
        } catch (err) {
            error = err.message;
        } finally {
            saving = false;
        }
    }

    function handleCourtChange() {
        fetchSettings();
    }

    function handleDateChange() {
        fetchSettings();
    }

    function addMinutes(timeStr, mins) {
        let [h, m] = timeStr.split(":").map(Number);

        let totalMins = h * 60 + m + mins;

        // Handle next day if needed (though simplified to 24:00 max usually)
        // If result is exactly 24:00 (1440 mins)
        if (totalMins === 1440) return "24:00";
        if (totalMins > 1440) totalMins %= 1440; // Wrap around for next day start

        let newH = Math.floor(totalMins / 60);
        let newM = totalMins % 60;

        return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    }

    function getDiffMinutes(start, end) {
        let [h1, m1] = start.split(":").map(Number);
        let [h2, m2] = end.split(":").map(Number);

        // Support 24:00
        if (h1 === 24) h1 = 24; // already 24
        if (h2 === 24) h2 = 24;

        return h2 * 60 + m2 - (h1 * 60 + m1);
    }

    function handleStartTimeChange(index, event) {
        const newStartTime = event.target.value;
        if (!newStartTime) return;

        const currentSlot = timeSlots[index];

        // Validation 1: Start Time must be earlier than End Time
        if (getDiffMinutes(newStartTime, currentSlot.endTime) <= 0) {
            alert("시작 시간은 종료 시간보다 빨라야 합니다.");
            timeSlots = [...timeSlots];
            return;
        }

        if (index > 0) {
            const prevSlot = timeSlots[index - 1];
            // Validation 2: Start Time must be equal to or after Previous End Time (No Overlap)
            if (getDiffMinutes(prevSlot.endTime, newStartTime) < 0) {
                alert(
                    "시작 시간은 이전 시간대의 종료 시간보다 늦거나 같아야 합니다.",
                );
                timeSlots = [...timeSlots];
                return;
            }
            // Decoupled: Do NOT update prevSlot.endTime
        }

        // Update current slot start time ONLY (End Time remains fixed)
        currentSlot.startTime = newStartTime;

        timeSlots = [...timeSlots];
    }

    function updateSlotEndTime(index, newEndTime) {
        // Validation: newEndTime should be after startTime
        const currentSlot = timeSlots[index];
        if (getDiffMinutes(currentSlot.startTime, newEndTime) <= 0) {
            alert("종료 시간은 시작 시간보다 늦어야 합니다.");
            timeSlots = [...timeSlots]; // Re-render to reset input
            return;
        }

        // Calculate shift for subsequent slots
        // Rule: Next slot starts at `newEndTime`.
        // We preserve the Duration of subsequent slots.

        let prevEndTime = newEndTime;

        // Update current slot
        timeSlots[index].endTime = newEndTime;

        for (let i = index + 1; i < timeSlots.length; i++) {
            const slot = timeSlots[i];
            const duration = getDiffMinutes(slot.startTime, slot.endTime);

            slot.startTime = prevEndTime;
            // Recalculate end time based on original duration
            slot.endTime = addMinutes(prevEndTime, duration);

            prevEndTime = slot.endTime;
        }

        timeSlots = [...timeSlots]; // Trigger reactivity
    }

    function handleEndTimeChange(index, event) {
        const newEndTime = event.target.value;
        if (!newEndTime) return;
        updateSlotEndTime(index, newEndTime);
    }

    function handleDurationChange(index, event) {
        const hours = parseInt(event.target.value);
        if (isNaN(hours)) return;
        const currentSlot = timeSlots[index];
        const newEndTime = addMinutes(currentSlot.startTime, hours * 60);

        updateSlotEndTime(index, newEndTime);

        // Reset select to default
        event.target.value = "";
    }

    function handleDeleteSlot(index) {
        timeSlots.splice(index, 1);
        timeSlots = [...timeSlots];
    }

    function handleAddSlot() {
        let newStartTime = "06:00";
        if (timeSlots.length > 0) {
            const lastSlot = timeSlots[timeSlots.length - 1];
            newStartTime =
                lastSlot.endTime === "24:00" ? "00:00" : lastSlot.endTime;
        }

        const newEndTime = addMinutes(newStartTime, 60); // 1 hour default

        timeSlots = [
            ...timeSlots,
            {
                startTime: newStartTime,
                endTime: newEndTime,
                type: "OPEN_GAME",
            },
        ];
    }
</script>

<svelte:head>
    <title>코트별 예약설정 - LESGO PiCKLE</title>
</svelte:head>

<div class="page">
    <header class="header">
        <div class="header-inner">
            <div class="header-content">
                <a href="/partner" class="brand-link">
                    <img src={logo} alt="LESGO PiCKLE" class="brand-logo" />
                    <h3 class="brand-title">코트별 예약설정</h3>
                </a>
            </div>
        </div>
    </header>

    <main class="main">
        <button class="back-btn" on:click={() => goto("/partner")}
            >← 메인으로</button
        >

        <div class="controls-card">
            <div class="control-group">
                <label for="courtSelect" class="label">코트 선택</label>
                <select
                    id="courtSelect"
                    class="select-input"
                    bind:value={selectedCourtId}
                    on:change={handleCourtChange}
                >
                    {#each courts as court}
                        <option value={court.id}>{court.courtName}</option>
                    {/each}
                </select>
            </div>
            <div class="control-group">
                <label for="dateSelect" class="label">날짜 선택</label>
                <input
                    id="dateSelect"
                    type="date"
                    class="date-input"
                    bind:value={selectedDate}
                    on:change={handleDateChange}
                />
            </div>
        </div>

        {#if loading}
            <div class="loading">불러오는 중...</div>
        {:else}
            <div class="slots-container">
                {#if successMsg}
                    <div class="success-msg">✅ {successMsg}</div>
                {/if}
                {#if error}
                    <div class="error-msg">⚠️ {error}</div>
                {/if}

                <div class="slots-header">
                    <span
                        >{courts.find((c) => c.id == selectedCourtId)
                            ?.courtName || ""} 시간대</span
                    >
                    <span>운영 타입</span>
                </div>

                {#if timeSlots.length === 0}
                    <div class="empty-msg">
                        운영 시간이 설정되지 않았거나 잘못되었습니다.
                    </div>
                {:else}
                    {#each timeSlots as slot, i}
                        <div class="slot-row">
                            <div class="time-label">
                                <select
                                    class="time-input"
                                    value={slot.startTime}
                                    on:change={(e) =>
                                        handleStartTimeChange(i, e)}
                                >
                                    {#each timeOptions as t}
                                        <option value={t}>{t}</option>
                                    {/each}
                                </select>
                                <span class="time-text"> ~ </span>
                                <select
                                    class="time-input"
                                    value={slot.endTime}
                                    on:change={(e) => handleEndTimeChange(i, e)}
                                >
                                    {#each timeOptions as t}
                                        <option value={t}>{t}</option>
                                    {/each}
                                </select>
                                <select
                                    class="duration-select"
                                    on:change={(e) =>
                                        handleDurationChange(i, e)}
                                >
                                    <option value="" disabled selected
                                        >시간 선택</option
                                    >
                                    {#each Array(12) as _, h}
                                        <option value={h + 1}
                                            >{h + 1}시간</option
                                        >
                                    {/each}
                                </select>
                                <span class="duration-info">
                                    {Math.floor(
                                        getDiffMinutes(
                                            slot.startTime,
                                            slot.endTime,
                                        ) / 60,
                                    )}시간
                                </span>
                                <button
                                    class="delete-btn"
                                    on:click={() => handleDeleteSlot(i)}
                                >
                                    삭제
                                </button>
                            </div>
                            <div class="type-selector">
                                <label
                                    class="radio-label {slot.type ===
                                    'OPEN_GAME'
                                        ? 'active-open'
                                        : ''}"
                                >
                                    <input
                                        type="radio"
                                        value="OPEN_GAME"
                                        bind:group={slot.type}
                                    />
                                    오픈게임
                                </label>
                                <label
                                    class="radio-label {slot.type === 'RENTAL'
                                        ? 'active-rental'
                                        : ''}"
                                >
                                    <input
                                        type="radio"
                                        value="RENTAL"
                                        bind:group={slot.type}
                                    />
                                    전체 대관
                                </label>
                            </div>
                        </div>
                    {/each}

                    <div class="button-group">
                        <button
                            class="add-btn"
                            on:click={handleAddSlot}
                            disabled={loading || saving}
                        >
                            시간대 추가
                        </button>
                        <button
                            class="save-btn"
                            on:click={handleSave}
                            disabled={loading || saving}
                        >
                            {saving ? "저장 중..." : "설정 저장"}
                        </button>
                    </div>
                {/if}
            </div>
        {/if}
    </main>
</div>

<style>
    .page {
        min-height: 100vh;
        background: #f7fafc;
    }
    .header {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        color: #fff;
        padding: 16px 20px;
    }
    .header-inner {
        max-width: 800px;
        margin: 0 auto;
    }
    .brand-link {
        display: flex;
        align-items: center;
        text-decoration: none;
        gap: 12px;
    }
    .brand-logo {
        height: 50px;
        width: auto;
    }
    .brand-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #fff;
    }

    .main {
        max-width: 800px;
        margin: 0 auto;
        padding: 24px 16px;
    }
    .back-btn {
        background: none;
        border: none;
        color: #4a5568;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 20px;
    }

    .controls-card {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        align-items: flex-end;
    }
    .control-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
    }
    .label {
        font-size: 14px;
        font-weight: 700;
        color: #4a5568;
    }
    .select-input,
    .date-input {
        padding: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        outline: none;
    }

    .slots-container {
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .slots-header {
        display: flex;
        justify-content: space-between;
        padding-bottom: 12px;
        border-bottom: 2px solid #edf2f7;
        font-weight: 700;
        color: #4a5568;
        margin-bottom: 16px;
    }
    .slot-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #edf2f7;
    }
    .time-label {
        font-size: 16px;
        font-weight: 600;
        color: #2d3748;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .time-input {
        padding: 4px 8px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-family: inherit;
        font-size: 15px;
        color: #2d3748;
        outline: none;
    }
    .time-input:focus {
        border-color: #3182ce;
        box-shadow: 0 0 0 1px #3182ce;
    }
    .duration-select {
        padding: 4px 8px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-family: inherit;
        font-size: 14px;
        color: #4a5568;
        outline: none;
        margin-left: 4px;
        cursor: pointer;
    }
    .duration-info {
        margin-left: 8px;
        padding: 4px 10px;
        background: #edf2f7;
        border: 1px solid #cbd5e0;
        color: #2d3748;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
    }
    .delete-btn {
        margin-left: 8px;
        padding: 4px 10px;
        background: #fff5f5;
        border: 1px solid #feb2b2;
        color: #c53030;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .delete-btn:hover {
        background: #feb2b2;
        color: #742a2a;
    }
    .type-selector {
        display: flex;
        gap: 8px;
    }

    .radio-label {
        padding: 8px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        color: #718096;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .radio-label input {
        display: none;
    }
    .active-open {
        background: #c6f6d5;
        border-color: #9ae6b4;
        color: #22543d;
        font-weight: 700;
    }
    .active-rental {
        background: #bee3f8;
        border-color: #90cdf4;
        color: #2c5282;
        font-weight: 700;
    }

    .button-group {
        margin-top: 24px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }
    .button-group button {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        font-size: 16px;
        color: white;
        transition: background 0.2s;
    }
    .add-btn {
        background: #4a5568;
    }
    .add-btn:hover {
        background: #2d3748;
    }
    .save-btn {
        background: #3182ce;
    }
    .save-btn:hover {
        background: #2b6cb0;
    }
    .button-group button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .loading,
    .empty-msg {
        text-align: center;
        padding: 40px;
        color: #718096;
    }
    .success-msg {
        padding: 12px;
        background: #f0fff4;
        color: #22543d;
        border-radius: 8px;
        margin-bottom: 20px;
        font-weight: 500;
    }
    .error-msg {
        padding: 12px;
        background: #fff5f5;
        color: #c53030;
        border-radius: 8px;
        margin-bottom: 20px;
        font-weight: 500;
    }
</style>
