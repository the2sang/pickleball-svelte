<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.js";
    import { buildApiUrl } from "$lib/api.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";

    let formData = {
        courtName: "",
        personnelNumber: 30,
        courtLevel: "",
        gameTime: "06:00 ~ 22:00",
        reservClose: "N", // Default open
        courtGugun: "01", // Default Gangnam
    };
    /*
        Court Gugun Mapping (Example)
        01: 강남구, 02: 송파구, ... 
        Partner manages their own gugun usually, but court might differ?
        For now simple select.
    */

    let saving = false;
    let error = "";

    onMount(() => {
        auth.refresh();
        const user = getUser();
        if (!user || user.accountType !== "PARTNER") {
            goto("/login");
        }
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

  async function handleSave(e) {
        e.preventDefault();
        saving = true;
        error = "";

        try {
            const res = await fetch(buildApiUrl("/api/v1/partner-manage/courts"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.message || "등록 실패");
            }

            goto("/partner/court");
        } catch (err) {
            error = err.message;
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
    <title>코트 등록 - LESGO PiCKLE</title>
</svelte:head>

    <div class="page">
    <SiteHeader title="코트 등록" brandHref="/partner/court" hasNav={!!$auth}>
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
         >사설클럽정보</a
         >
        <button class="pb-btn-ghost nav-link logout-btn" on:click={handleLogout}
          >로그아웃</button
        >
    </SiteHeader>

    <main class="main">
        <button class="back-btn" on:click={() => goto("/partner/court")}
            >← 목록으로</button
        >

        <div class="form-container">
            {#if error}
                <div class="error-msg">⚠️ {error}</div>
            {/if}

            <form class="court-form" on:submit={handleSave}>
                <div class="field-group">
                    <label for="courtName" class="field-label"
                        >코트명 <span class="required">*</span></label
                    >
                    <input
                        id="courtName"
                        type="text"
                        class="field-input"
                        bind:value={formData.courtName}
                        required
                        placeholder="예: A코트 (실내)"
                    />
                </div>

                <div class="row">
                    <div class="field-group half">
                        <label for="personnelNumber" class="field-label"
                            >수용인원</label
                        >
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
                        <label for="courtLevel" class="field-label"
                            >타입 (실내/실외/루프탑)</label
                        >
                        <select
                            id="courtLevel"
                            class="field-input"
                            bind:value={formData.courtLevel}
                        >
                            <option value="실내">선택하세요(기본-실내)</option>
                            <option value="실내">실내</option>
                            <option value="실외">실외</option>
                            <option value="로프탑">루프탑</option>
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
                    <label for="reservClose" class="field-label">예약상태</label
                    >
                    <select
                        id="reservClose"
                        class="field-input"
                        bind:value={formData.reservClose}
                    >
            <option value="N">접수가능</option>
                        <option value="Y">예약마감</option>
                    </select>
                </div>

                <div class="btn-row">
                    <button
                        type="button"
                        class="cancel-btn"
                        on:click={() => goto("/partner/court")}>취소</button
                    >
                    <button type="submit" class="save-btn" disabled={saving}>
                        {saving ? "저장 중..." : "저장"}
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

    .court-form {
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
    .half {
        flex: 1;
    }

    .field-label {
        font-size: 14px;
        font-weight: 700;
        color: #2d3748;
    }
    .required {
        color: #e53e3e;
    }
    .field-input {
        padding: 12px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: 15px;
        outline: none;
        transition: border-color 0.2s;
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
        padding: 12px 32px;
        background: #3182ce;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
    }
    .save-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
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
