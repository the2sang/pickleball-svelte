<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.js";
    import { buildApiUrl } from "$lib/api.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";

let formData = {
        placeName: "",
        personnelNumber: 30,
        placeType: "실내",
        gameTime: "06:00 ~ 22:00",
        reservClose: "N",
    };

    let notice = "";
    let errorMessage = "";
    let saving = false;

    onMount(() => {
        auth.refresh();
        const user = getUser();
        if (!user || user.accountType !== "CIRCLE") {
            goto("/login");
        }
    });

    function getUser() {
        let user = null;
        const unsub = auth.subscribe((v) => (user = v));
        unsub();
        return user;
    }

    async function handleSave(event) {
        event.preventDefault();
        notice = "";
        errorMessage = "";

        const user = getUser();
        if (!user?.accessToken) {
            errorMessage = "로그인 정보가 만료되었습니다. 다시 로그인해주세요.";
            goto("/login");
            return;
        }

        if (!formData.placeName.trim()) {
            errorMessage = "운동장소명을 입력해주세요.";
            return;
        }

        saving = true;
        try {
            const response = await fetch(buildApiUrl("/api/v1/circle-manage/places"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.accessToken}`,
                },
                body: JSON.stringify({
                    placeName: formData.placeName,
                    personnelNumber: Number(formData.personnelNumber),
                    placeType: formData.placeType,
                    gameTime: formData.gameTime,
                    reservClose: formData.reservClose,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                errorMessage = errorData?.message || "운동장소 등록 중 오류가 발생했습니다.";
                return;
            }

            notice = "운동장소가 등록되었습니다.";
            goto("/circle/place");
        } catch {
            errorMessage = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
        } finally {
            saving = false;
        }
    }

    function handleLogout() {
        auth.logout();
        goto("/login");
    }
</script>

<svelte:head>
    <title>운동장소 등록 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <SiteHeader title="운동장소 등록" brandHref="/circle/place" hasNav={!!$auth}>
        <span class="pb-user-pill user-greeting">
            <span class="user-icon">👥</span>
            <span class="user-name">{$auth?.name || $auth?.username || '사용자'}</span>님
        </span>
        <a
            href="/circle/place"
            class={`pb-btn-ghost nav-link menu-link ${$page.url.pathname.startsWith('/circle/place') ? 'is-active' : ''}`}
        >운동장소관리</a>
        <button class="pb-btn-ghost nav-link logout-btn" onclick={handleLogout}>로그아웃</button>
    </SiteHeader>

    <main class="main">
        <button class="back-btn" onclick={() => goto('/circle/place')}>← 목록으로</button>

        <div class="form-container">
            {#if notice}
                <div class="notice-msg">ℹ️ {notice}</div>
            {/if}

            {#if errorMessage}
                <div class="error-msg">⚠️ {errorMessage}</div>
            {/if}

            <form class="place-form" onsubmit={handleSave}>
                <div class="field-group">
                    <label for="placeName" class="field-label">운동장소명 <span class="required">*</span></label>
                    <input
                        id="placeName"
                        type="text"
                        class="field-input"
                        bind:value={formData.placeName}
                        required
                        placeholder="예: 잠실 실내 코트 A"
                    />
                </div>

                <div class="row">
                    <div class="field-group half">
                        <label for="personnelNumber" class="field-label">수용인원</label>
                        <input
                            id="personnelNumber"
                            type="number"
                            class="field-input"
                            bind:value={formData.personnelNumber}
                            min="1"
                            required
                        />
                    </div>

                    <div class="field-group half">
                        <label for="placeType" class="field-label">장소 타입</label>
                        <select id="placeType" class="field-input" bind:value={formData.placeType}>
                            <option value="실내">실내</option>
                            <option value="실외">실외</option>
                            <option value="루프탑">루프탑</option>
                        </select>
                    </div>
                </div>

                <div class="field-group">
                    <label for="gameTime" class="field-label">운영시간</label>
                    <input
                        id="gameTime"
                        type="text"
                        class="field-input"
                        bind:value={formData.gameTime}
                        placeholder="예: 06:00 ~ 22:00"
                    />
                </div>

                <div class="field-group">
                    <label for="reservClose" class="field-label">참가신청 상태</label>
                    <select id="reservClose" class="field-input" bind:value={formData.reservClose}>
                        <option value="N">접수가능</option>
                        <option value="Y">접수마감</option>
                    </select>
                </div>

                <div class="btn-row">
                    <button type="button" class="cancel-btn" onclick={() => goto('/circle/place')}>취소</button>
                    <button type="submit" class="save-btn" disabled={saving}>
                        {saving ? "등록 중..." : "등록"}
                    </button>
                </div>
            </form>
        </div>
    </main>
</div>

<style>
    .page {
        min-height: 100vh;
        background: #f7fafc;
    }
    .user-greeting { white-space: nowrap; }
    .user-icon { font-size: 16px; }
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
        border: 1px solid transparent;
    }
    .menu-link { color: #1a365d; }
    .nav-link.is-active {
        color: #1a365d;
        background: rgba(255, 255, 255, 0.34);
        border-color: rgba(255, 255, 255, 0.6);
    }
    .logout-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        font-family: inherit;
    }
    .main {
        max-width: 600px;
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
    .form-container {
        background: #fff;
        border-radius: 14px;
        padding: 32px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }
    .place-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .field-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .row {
        display: flex;
        gap: 16px;
    }
    .half { flex: 1; }
    .field-label {
        font-size: 14px;
        font-weight: 700;
        color: #2d3748;
    }
    .required { color: #e53e3e; }
    .field-input {
        padding: 12px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: 15px;
        outline: none;
    }
    .field-input:focus {
        border-color: #3182ce;
        box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
    }
    .btn-row {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 12px;
    }
    .cancel-btn {
        padding: 12px 24px;
        background: #edf2f7;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        color: #4a5568;
        cursor: pointer;
    }
    .save-btn {
        padding: 12px 24px;
        background: #3182ce;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
    }
    .notice-msg {
        padding: 12px;
        background: #ebf8ff;
        color: #2c5282;
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
    .save-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>
