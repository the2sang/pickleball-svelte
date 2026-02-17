<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";

    onMount(() => {
        auth.refresh();
        const user = getUser();
        if (!user || user.accountType !== "PARTNER") {
            goto("/login");
            return;
        }
    });

    function getUser() {
        let user = null;
        const unsub = auth.subscribe((v) => (user = v));
        unsub();
        return user;
    }

    function handleLogout() {
        auth.logout();
        goto("/login");
    }
</script>

<svelte:head>
    <title>사업장 관리 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <SiteHeader title="사업장 관리" brandHref="/partner" hasNav={!!$auth}>
      {#if $auth}
        <span class="pb-user-pill user-greeting">
            <span class="user-icon">🏢</span>
            <span class="user-name">{$auth?.name || $auth?.username || '사용자'}</span>님
        </span>
        <a
          href="/partner/court"
          class={`pb-btn-ghost nav-link court-link ${$page.url.pathname === '/partner/court' ? 'is-active' : ''}`}
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
      {/if}
    </SiteHeader>

    <main class="main">
        <div class="welcome-card">
            <div class="welcome-icon">🏟️</div>
            <h2 class="welcome-title">사업장 관리 페이지</h2>
            <p class="welcome-desc">
                사업장 정보를 관리하고, 코트 및 예약 현황을 확인할 수 있습니다.
            </p>
            <div class="quick-links">
                <a href="/partner/court" class="quick-link">
                    <span class="quick-icon">🏸</span>
                    <span class="quick-text">코트 관리</span>
                </a>
                <a href="/partner/courtReservation" class="quick-link">
                    <span class="quick-icon">⚙️</span>
                    <span class="quick-text">코트별 예약설정</span>
                </a>
                <a href="/partner/profile" class="quick-link">
                    <span class="quick-icon">📋</span>
                    <span class="quick-text">사업장정보 수정</span>
                </a>
            </div>
        </div>
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
        padding: 8px 18px;
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
    .nav-link.court-link {
        color: #1a365d;
    }
    .profile-link {
        background: rgba(72, 187, 120, 0.2);
        border: 1.5px solid rgba(72, 187, 120, 0.4);
    }
    .profile-link:hover {
        background: rgba(72, 187, 120, 0.35);
        border-color: rgba(72, 187, 120, 0.6);
        transform: translateY(-1px);
    }
    .logout-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        font-family: inherit;
    }
    .logout-btn:hover {
        background: rgba(229, 62, 62, 0.3);
        border-color: rgba(229, 62, 62, 0.5);
        transform: translateY(-1px);
    }

    .main {
        max-width: 960px;
        margin: 0 auto;
        padding: 40px 16px;
    }

    .welcome-card {
        background: #fff;
        border-radius: 16px;
        padding: 48px 32px;
        text-align: center;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }
    .welcome-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    .welcome-title {
        font-size: 24px;
        font-weight: 800;
        color: #2d3748;
        margin: 0 0 12px;
    }
    .welcome-desc {
        font-size: 15px;
        color: #718096;
        margin: 0 0 32px;
        line-height: 1.6;
    }

    .quick-links {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;
    }
    .quick-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 28px;
        background: #edf2f7;
        border-radius: 12px;
        text-decoration: none;
        color: #2d3748;
        font-weight: 600;
        font-size: 15px;
        transition: all 0.15s;
    }
    .quick-link:hover {
        background: #e2e8f0;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
    }
    .quick-icon {
        font-size: 20px;
    }
    .quick-text {
        white-space: nowrap;
    }
</style>
