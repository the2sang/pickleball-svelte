<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.js";
    import { buildApiUrl } from "$lib/api.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";

    let courts = [];
    let loading = true;
    let error = "";

    onMount(() => {
        auth.refresh();
        const user = getUser();
        if (!user || user.accountType !== "PARTNER") {
            goto("/login");
            return;
        }
        fetchCourts();
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
        loading = true;
        error = "";
        try {
            const res = await fetch(buildApiUrl("/api/v1/partner-manage/courts"), {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.status === 401 || res.status === 403) {
                auth.logout();
                goto("/login");
                return;
            }
            if (!res.ok) throw new Error("코트 목록을 불러올 수 없습니다.");

            courts = await res.json();
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function handleLogout() {
        auth.logout();
        goto("/login");
    }

    function levelLabel(level) {
        // 백엔드에서 어떤 값으로 저장되는지 확인 필요 (실내/실외 등)
        // 일단 그대로 출력하거나 매핑
        return level || "-";
    }

    function reservCloseLabel(close) {
        return close === "Y" ? "예약마감" : "예약가능";
    }
</script>

<svelte:head>
    <title>코트 관리 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <SiteHeader title="코트 관리" brandHref="/partner" hasNav={!!$auth}>
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

    <main class="main">
        <div class="page-actions">
            <button class="back-btn" on:click={() => goto("/partner")}
                >← 메인으로</button
            >
            <button class="add-btn" on:click={() => goto("/partner/court/new")}
                >+ 코트 추가</button
            >
        </div>

        {#if loading}
            <div class="loading">불러오는 중...</div>
        {:else if error}
            <div class="error-msg">⚠️ {error}</div>
        {:else if courts.length === 0}
            <div class="empty-state">
                <p>등록된 코트가 없습니다.</p>
                <button
                    class="add-btn-sm"
                    on:click={() => goto("/partner/court/new")}
                    >코트 등록하기</button
                >
            </div>
        {:else}
            <div class="court-list">
                {#each courts as court}
                    <div
                        class="court-card"
                        role="button"
                        tabindex="0"
                        on:click={() => goto(`/partner/court/${court.id}`)}
                        on:keydown={(e) =>
                            e.key === "Enter" &&
                            goto(`/partner/court/${court.id}`)}
                    >
                        <div class="card-header">
                            <span class="court-name">{court.courtName}</span>
                            <span
                                class="court-badge {court.reservClose === 'Y'
                                    ? 'badge-closed'
                                    : 'badge-open'}"
                            >
                                {reservCloseLabel(court.reservClose)}
                            </span>
                        </div>
                        <div class="card-body">
                            <div class="info-row">
                                <span class="label">인원</span>
                                <span class="value"
                                    >{court.personnelNumber}명</span
                                >
                            </div>
                            <div class="info-row">
                                <span class="label">타입</span>
                                <span class="value">{court.courtLevel}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">시간</span>
                                <span class="value">{court.gameTime}</span>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </main>
</div>

<style>
    .page {
        min-height: 100vh;
        background: #f7fafc;
    }
    .user-greeting { white-space: nowrap; }
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

    .page-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    .back-btn {
        background: none;
        border: none;
        color: #4a5568;
        font-weight: 600;
        cursor: pointer;
    }
    .add-btn {
        background: #3182ce;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
    }
    .add-btn:hover {
        background: #2b6cb0;
    }

    .loading,
    .error-msg,
    .empty-state {
        text-align: center;
        padding: 40px;
        color: #718096;
    }
    .empty-state p {
        margin-bottom: 16px;
    }
    .add-btn-sm {
        background: #3182ce;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
    }

    .court-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
    }
    .court-card {
        background: white;
        border-radius: 12px;
        padding: 20px; /* Reduced from 24px to look more compact */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        cursor: pointer;
        transition:
            transform 0.2s,
            box-shadow 0.2s;
        border: 1px solid transparent;
    }
    .court-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #bee3f8;
    }
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #edf2f7;
    }
    .court-name {
        font-size: 16px;
        font-weight: 700;
        color: #2d3748;
    }
    .court-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 700;
    }
    .badge-open {
        background: #c6f6d5;
        color: #22543d;
    }
    .badge-closed {
        background: #fed7d7;
        color: #822727;
    }
    .card-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
    }
    .label {
        color: #718096;
        font-weight: 500;
    }
    .value {
        color: #2d3748;
        font-weight: 600;
    }
</style>
