<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";
    import { parseApiErrorResponse } from "$lib/utils/apiError.js";

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
    let approvedRentalSlots = [];
    let loading = false;
    let saving = false;
    let error = "";
    let successMsg = "";
    let slotStatus = "등록 전";

    let rentalRequests = [];
    let rentalLoading = false;
    let rentalError = "";
    let rentalActingId = null;

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
            const fetchedCourts = await res.json();
            courts = [...fetchedCourts].sort((a, b) =>
                (a.courtName || "").localeCompare(b.courtName || ""),
            );

            if (courts.length > 0 && !selectedCourtId) {
                selectedCourtId = courts[0].id;
                fetchSettings();
            }
        } catch (err) {
            error = err.message;
        }
    }

    function normalizeTime(t) {
        if (!t) return "";
        if (t === "00:00" || t === "00:00:00") return "24:00";
        return t.length > 5 ? t.substring(0, 5) : t;
    }

    function toMinutes(t) {
        if (!t) return NaN;
        if (t === "24:00") return 1440;
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    }

    function overlaps(aStart, aEnd, bStart, bEnd) {
        return aStart < bEnd && aEnd > bStart;
    }

    function updateSlotStatusFromSlots(slots) {
        slotStatus = slots.length > 0 ? "가져오기 성공" : "등록 전";
    }

    async function fetchSettings() {
        if (!selectedCourtId) return;
        loading = true;
        error = "";
        successMsg = "";

        try {
            // 1. Get saved settings
            const res = await fetch(
                `/api/v1/partner-manage/reservation/settings?courtId=${selectedCourtId}&date=${selectedDate}`,
                {
                    headers: { Authorization: `Bearer ${getToken()}` },
                },
            );

            if (res.ok) {
                const data = await res.json();

                if (data.timeSlots && data.timeSlots.length > 0) {
                    approvedRentalSlots = data.timeSlots
                        .filter((s) => s.type === "RENTAL")
                        .map((s) => ({
                            startTime: normalizeTime(s.startTime),
                            endTime: normalizeTime(s.endTime),
                        }));

                    timeSlots = data.timeSlots
                        .filter((s) => s.type === "OPEN_GAME")
                        .map((s) => ({
                            startTime: normalizeTime(s.startTime),
                            endTime: normalizeTime(s.endTime),
                        }));
                } else {
                    approvedRentalSlots = [];
                    timeSlots = [];
                }
                updateSlotStatusFromSlots(timeSlots);
            } else {
                approvedRentalSlots = [];
                timeSlots = [];
                updateSlotStatusFromSlots(timeSlots);
            }

            await fetchRentalRequests();
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function fetchRentalRequests() {
        if (!selectedCourtId || !selectedDate) return;
        rentalLoading = true;
        rentalError = "";

        try {
            const res = await fetch(
                `/api/v1/partner-manage/rentals/requests?courtId=${selectedCourtId}&date=${selectedDate}&status=ALL`,
                {
                    headers: { Authorization: `Bearer ${getToken()}` },
                },
            );

            if (!res.ok) {
                const apiErr = await parseApiErrorResponse(res);
                throw new Error(apiErr.message);
            }

            rentalRequests = await res.json();
        } catch (e) {
            rentalError = e.message;
            rentalRequests = [];
        } finally {
            rentalLoading = false;
        }
    }

    function isPendingRentalRequest(request) {
        return (request?.approvalStatus || "").toUpperCase() === "PENDING";
    }

    function isApprovedRentalRequest(request) {
        return (request?.approvalStatus || "").toUpperCase() === "APPROVED";
    }

    function rentalStatusLabel(status) {
        if (!status) return "-";
        const normalized = status.toUpperCase();

        if (normalized === "PENDING") return "대기중";
        if (normalized === "APPROVED") return "승인됨";
        if (normalized === "REJECTED") return "거절됨";

        return status;
    }

    function rentalStatusClass(request) {
        if (isPendingRentalRequest(request)) return "rental-status-pending";
        if (isApprovedRentalRequest(request)) return "rental-status-approved";
        return "rental-status-rejected";
    }

    async function approveRequest(id) {
        rentalActingId = id;
        rentalError = "";
        try {
            const res = await fetch(
                `/api/v1/partner-manage/rentals/requests/${id}/approve`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${getToken()}` },
                },
            );

            if (!res.ok) {
                const apiErr = await parseApiErrorResponse(res);
                throw new Error(apiErr.message);
            }

            await fetchSettings();
        } catch (e) {
            rentalError = e.message;
        } finally {
            rentalActingId = null;
        }
    }

    async function rejectRequest(id) {
        rentalActingId = id;
        rentalError = "";
        try {
            const res = await fetch(
                `/api/v1/partner-manage/rentals/requests/${id}/reject`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({ reason: "" }),
                },
            );

            if (!res.ok) {
                const apiErr = await parseApiErrorResponse(res);
                throw new Error(apiErr.message);
            }

            await fetchSettings();
        } catch (e) {
            rentalError = e.message;
        } finally {
            rentalActingId = null;
        }
    }

    function hasOverlap(slots) {
        if (slots.length < 2) return null;

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

        let filteredSlots = timeSlots;
        if (approvedRentalSlots.length > 0 && timeSlots.length > 0) {
            const beforeCount = timeSlots.length;
            filteredSlots = timeSlots.filter((s) => {
                const sStart = toMinutes(s.startTime);
                const sEnd = toMinutes(s.endTime);
                for (const r of approvedRentalSlots) {
                    const rStart = toMinutes(r.startTime);
                    const rEnd = toMinutes(r.endTime);
                    if (overlaps(sStart, sEnd, rStart, rEnd)) {
                        return false;
                    }
                }
                return true;
            });

            const removed = beforeCount - filteredSlots.length;
            if (removed > 0) {
                alert(
                    `승인된 대관 시간대와 겹치는 오픈게임 시간대 ${removed}개를 제외하고 저장합니다.`,
                );
            }
        }

        saving = true;
        error = "";
        successMsg = "";

        try {
            const payload = {
                courtId: selectedCourtId,
                date: selectedDate,
                timeSlots: filteredSlots.map((s) => ({
                    startTime: s.startTime === "24:00" ? "00:00" : s.startTime,
                    endTime: s.endTime === "24:00" ? "00:00" : s.endTime,
                    type: "OPEN_GAME",
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

            timeSlots = filteredSlots;
            slotStatus = "저장 됨";
            successMsg = "저장되었습니다.";
            setTimeout(() => (successMsg = ""), 3000);
        } catch (err) {
            error = err.message;
            slotStatus = "저장 실패";
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

    function shiftDate(dateStr, days) {
        if (!dateStr) return "";
        const d = new Date(`${dateStr}T00:00:00`);
        if (Number.isNaN(d.getTime())) return "";
        d.setDate(d.getDate() + days);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    async function handleLoadPreviousDaySlots() {
        if (!selectedCourtId || !selectedDate) return;

        const prevDate = shiftDate(selectedDate, -1);
        if (!prevDate) {
            error = "전날 날짜 계산에 실패했습니다.";
            return;
        }

        loading = true;
        error = "";
        successMsg = "";

        try {
            const res = await fetch(
                `/api/v1/partner-manage/reservation/settings?courtId=${selectedCourtId}&date=${prevDate}`,
                {
                    headers: { Authorization: `Bearer ${getToken()}` },
                },
            );

            if (!res.ok) {
                throw new Error("전날 시간대를 불러오지 못했습니다.");
            }

            const data = await res.json();
            const prevOpenSlots = (data.timeSlots || [])
                .filter((s) => (s.type || "").toUpperCase() === "OPEN_GAME")
                .map((s) => ({
                    startTime: normalizeTime(s.startTime),
                    endTime: normalizeTime(s.endTime),
                }))
                .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

            timeSlots = prevOpenSlots;
            updateSlotStatusFromSlots(prevOpenSlots);
            successMsg =
                prevOpenSlots.length > 0
                    ? `전날(${prevDate}) 시간대 ${prevOpenSlots.length}개를 가져왔습니다.`
                    : `전날(${prevDate})에 등록된 오픈게임 시간대가 없습니다.`;
            setTimeout(() => (successMsg = ""), 3000);
        } catch (err) {
            error = err.message || "전날 시간대를 가져오지 못했습니다.";
        } finally {
            loading = false;
        }
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
        const hasPendingRental = rentalRequests.some(isPendingRentalRequest);
        if (hasPendingRental) {
            alert(
                "대관 신청에 대한 승인처리를 먼저 진행하셔야 시간대 추가를 할 수 있습니다",
            );
            return;
        }

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
            },
        ];
    }

    function getSlotStatusClass() {
        if (slotStatus === "저장 됨") return "saved";
        if (slotStatus === "저장 실패") return "failed";
        if (slotStatus === "가져오기 성공") return "loaded";
        return "unregistered";
    }

    function handleLogout() {
        auth.logout();
        goto("/login");
    }
</script>

<svelte:head>
    <title>코트별 예약설정 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <SiteHeader title="코트별 예약설정" brandHref="/partner" hasNav={!!$auth}>
        <span class="pb-user-pill user-greeting">
            <span class="user-icon">🏸</span>
            <span class="user-name">{$auth?.name || $auth?.username || '사용자'}</span>님
        </span>
        <a
            href="/partner/court"
            class={`pb-btn-ghost nav-link court-link ${$page.url.pathname === '/partner/court' || $page.url.pathname.startsWith('/partner/court/') ? 'is-active' : ''}`}
            >코트관리</a
        >
        <a
            href="/partner/courtReservation"
            class={`pb-btn-ghost nav-link court-link ${$page.url.pathname === '/partner/courtReservation' ? 'is-active' : ''}`}
            >예약설정</a
        >
        <a
            href="/partner/profile"
            class={`pb-btn-ghost nav-link profile-link ${$page.url.pathname === '/partner/profile' ? 'is-active' : ''}`}
            >사업장정보</a
        >
        <button class="pb-btn-ghost nav-link logout-btn" on:click={handleLogout}>로그아웃</button>
    </SiteHeader>

    <main class="pb-container main">
        <button class="pb-btn-ghost back-btn" on:click={() => goto("/partner")}
            >← 메인으로</button
        >

        <div class="pb-card controls-card">
            <div class="control-group">
                <label for="courtSelect" class="pb-label label">코트 선택</label>
                <select
                    id="courtSelect"
                    class="pb-input select-input"
                    bind:value={selectedCourtId}
                    on:change={handleCourtChange}
                >
                    {#each courts as court}
                        <option value={court.id}>{court.courtName}</option>
                    {/each}
                </select>
            </div>
            <div class="control-group">
                <label for="dateSelect" class="pb-label label">운동일자</label>
                <input
                    id="dateSelect"
                    type="date"
                    class="pb-input date-input"
                    bind:value={selectedDate}
                    on:change={handleDateChange}
                />
            </div>
        </div>

        {#if loading}
            <div class="loading">불러오는 중...</div>
        {:else}
            <div class="pb-card slots-container">
                {#if successMsg}
                    <div class="success-msg">✅ {successMsg}</div>
                {/if}
                {#if error}
                    <div class="error-msg">⚠️ {error}</div>
                {/if}

                <div class="slots-header">
                    <div class="slots-title-wrap">
                        <span
                            >{courts.find((c) => c.id == selectedCourtId)
                                ?.courtName || ""} 운영시간</span
                        >
                        <span
                            class={`save-state ${getSlotStatusClass()}`}
                        >
                            {slotStatus}
                        </span>
                    </div>
                    <span>운영 타입</span>
                </div>

                {#if timeSlots.length === 0}
                    <div class="empty-msg">
                        아직 등록된 오픈게임 시간대가 없습니다. 아래 "시간대 추가" 버튼으로 등록해주세요.
                    </div>
                {:else}
                    {#each timeSlots as slot, i}
                        <div class="slot-row">
                            <div class="time-label">
                                <select
                                    class="pb-input time-input"
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
                                    class="pb-input time-input"
                                    value={slot.endTime}
                                    on:change={(e) => handleEndTimeChange(i, e)}
                                >
                                    {#each timeOptions as t}
                                        <option value={t}>{t}</option>
                                    {/each}
                                </select>
                                <select
                                    class="pb-input duration-select"
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
                                    class="pb-btn-ghost delete-btn"
                                    on:click={() => handleDeleteSlot(i)}
                                >
                                    삭제
                                </button>
                            </div>
                            <div class="type-badge">오픈게임</div>
                        </div>
                    {/each}
                {/if}

                    <div class="button-group">
                        <button
                            class="pb-btn-ghost copy-btn"
                            on:click={handleLoadPreviousDaySlots}
                            disabled={loading || saving}
                        >
                            전날 시간대 가져오기
                        </button>
                        <button
                            class="pb-btn-ghost add-btn"
                            on:click={handleAddSlot}
                            disabled={loading || saving}
                        >
                            시간대 추가
                        </button>
                        <button
                            class="pb-btn-primary save-btn"
                            on:click={handleSave}
                            disabled={loading || saving}
                        >
                            {saving ? "저장 중..." : "설정 저장"}
                        </button>
                    </div>
            </div>

            <div class="pb-card rental-container">
                <div class="rental-header">
                    <span>대관 요청</span>
                    {#if rentalLoading}
                        <span class="rental-loading">불러오는 중...</span>
                    {/if}
                </div>

                {#if rentalError}
                    <div class="error-msg">⚠️ {rentalError}</div>
                {/if}

                {#if !rentalLoading && rentalRequests.length === 0}
                    <div class="empty-msg">대관 신청이 없습니다.</div>
                {:else}
                    {#each rentalRequests as r (r.id)}
                        <div class="rental-row">
                            <div class="rental-info">
                                <div class="rental-title">
                                    {r.timeSlot} · {r.username}{#if r.name}({r.name}){/if}
                                </div>
                                <div class="rental-meta">신청일: {r.gameDate}</div>
                            </div>
                            <div class="rental-actions">
                                <span class={`rental-status ${rentalStatusClass(r)}`}>
                                    {rentalStatusLabel(r.approvalStatus)}
                                </span>
                                {#if isPendingRentalRequest(r)}
                                    <button
                                        class="rental-btn approve"
                                        on:click={() => approveRequest(r.id)}
                                        disabled={rentalActingId === r.id}
                                    >
                                        승인
                                    </button>
                                    <button
                                        class="rental-btn reject"
                                        on:click={() => rejectRequest(r.id)}
                                        disabled={rentalActingId === r.id}
                                    >
                                        거절
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/each}
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
    .user-greeting {
        white-space: nowrap;
    }
    .user-icon {
        font-size: 16px;
    }
    .user-name {
        color: #90cdf4;
        font-weight: 700;
    }
    .nav-link {
        padding: 8px 14px;
        border-radius: 8px;
        color: #2d3748;
        background: rgba(255, 255, 255, 0.16);
        text-decoration: none;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        transition: all 0.15s;
        border: 1px solid transparent;
    }
    .nav-link:hover {
        background: rgba(255, 255, 255, 0.3);
        color: #1a365d;
        border-color: rgba(255, 255, 255, 0.45);
        transform: translateY(-1px);
    }
    .nav-link.is-active {
        color: #1a365d;
        background: rgba(255, 255, 255, 0.34);
        border-color: rgba(255, 255, 255, 0.6);
        box-shadow: 0 8px 18px rgba(26, 54, 93, 0.14);
    }
    .court-link {
        color: #1a365d;
    }
    .profile-link {
        background: rgba(72, 187, 120, 0.2);
        border: 1.5px solid rgba(72, 187, 120, 0.4);
    }
    .profile-link:hover {
        background: rgba(72, 187, 120, 0.35);
        border-color: rgba(72, 187, 120, 0.6);
    }
    .main {
        max-width: 800px;
        margin: 0 auto;
        padding: 24px 16px;
    }
    .back-btn {
        color: #4a5568;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 20px;
        padding: 10px 16px;
    }

    .controls-card {
        padding: 20px;
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
        outline: none;
    }

    .slots-container {
        padding: 24px;
        margin-bottom: 20px;
    }

    .rental-container {
        padding: 20px 24px;
    }
    .rental-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 800;
        color: #1a365d;
        margin-bottom: 12px;
    }
    .rental-loading {
        font-size: 12px;
        color: #718096;
        font-weight: 700;
    }
    .rental-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        margin-bottom: 10px;
        background: #f7fafc;
    }
    .rental-row:last-child {
        margin-bottom: 0;
    }
    .rental-title {
        font-weight: 800;
        color: #2d3748;
        font-size: 14px;
    }
    .rental-meta {
        font-size: 12px;
        color: #718096;
        margin-top: 4px;
        font-weight: 700;
    }
    .rental-actions {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .rental-status {
        padding: 7px 10px;
        border-radius: 14px;
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
    }

    .rental-status-pending {
        background: #fff5f5;
        color: #c53030;
        border: 1px solid #fca5a5;
    }

    .rental-status-approved {
        background: #f0fff4;
        color: #22543d;
        border: 1px solid #9ae6b4;
    }

    .rental-status-rejected {
        background: #fff5f5;
        color: #9b2c2c;
        border: 1px solid #feb2b2;
    }

    .rental-btn {
        padding: 10px 12px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        font-weight: 800;
        font-size: 13px;
        font-family: inherit;
        white-space: nowrap;
    }
    .rental-btn.approve {
        background: linear-gradient(135deg, #2e7d32, #43a047);
        color: #fff;
        box-shadow: 0 4px 12px rgba(46, 125, 50, 0.22);
    }
    .rental-btn.reject {
        background: #fff;
        border: 1.5px solid #e2e8f0;
        color: #c53030;
    }
    .rental-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    .slots-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        border-bottom: 2px solid #edf2f7;
        font-weight: 700;
        color: #4a5568;
        margin-bottom: 16px;
    }
    .slots-title-wrap {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    .save-state {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
        line-height: 1;
    }
    .save-state.saved {
        color: #22543d;
        background: #c6f6d5;
        border: 1px solid #9ae6b4;
    }
    .save-state.loaded {
        color: #1e3a8a;
        background: #dbeafe;
        border: 1px solid #93c5fd;
    }
    .save-state.unregistered {
        color: #4a5568;
        background: #edf2f7;
        border: 1px solid #cbd5e0;
    }
    .save-state.failed {
        color: #9b2c2c;
        background: #fff5f5;
        border: 1px solid #feb2b2;
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
        width: fit-content;
        min-width: 72px;
        font-family: inherit;
        font-size: 15px;
        color: #2d3748;
        outline: none;
        padding-top: 8px;
        padding-bottom: 8px;
    }
    .duration-select {
        width: fit-content;
        min-width: 84px;
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
        width: fit-content;
        padding: 8px 12px;
        margin-left: 8px;
        color: #c53030;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .delete-btn:hover {
        color: #742a2a;
    }
    .type-badge {
        padding: 8px 14px;
        border: 1px solid #9ae6b4;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 800;
        color: #22543d;
        background: #c6f6d5;
        white-space: nowrap;
    }

    .button-group {
        margin-top: 24px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }
    .copy-btn {
        color: #2b6cb0;
        border-color: #bfdbfe;
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
