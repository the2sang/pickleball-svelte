<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth.js";
    import logo from "$lib/assets/main_logo.png";

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
            const res = await fetch("/api/v1/partner-manage/courts", {
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

<div class="page">
    <header class="header">
        <div class="header-inner">
            <div class="header-content">
                <a href="/partner" class="brand-link">
                    <img src={logo} alt="LESGO PiCKLE" class="brand-logo" />
                    <h3 class="brand-title">코트 관리</h3>
                </a>
            </div>
            <div class="nav-links">
                <button class="nav-link logout-btn" on:click={handleLogout}
                    >로그아웃</button
                >
            </div>
        </div>
    </header>

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
    .header {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        color: #fff;
        padding: 16px 20px;
    }
    .header-inner {
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .brand-link {
        display: flex;
        align-items: center;
        text-decoration: none;
        gap: 12px;
    }
    .brand-logo {
        height: 60px;
        width: auto;
    }
    .brand-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #fff;
    }
    .nav-links {
        display: flex;
        gap: 8px;
    }
    .logout-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: 0.2s;
    }
    .logout-btn:hover {
        background: rgba(255, 50, 50, 0.3);
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
