<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";

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

    function handleLogout() {
        auth.logout();
        goto("/login");
    }
</script>

<svelte:head>
    <title>동호회 관리 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <SiteHeader title="동호회 관리" brandHref="/circle" hasNav={!!$auth}>
        <span class="pb-user-pill user-greeting">
            <span class="user-icon">👥</span>
            <span class="user-name">{$auth?.name || $auth?.username || '사용자'}</span>님
        </span>
        <a
            href="/circle/place"
            class={`pb-btn-ghost nav-link menu-link ${$page.url.pathname.startsWith('/circle/place') ? 'is-active' : ''}`}
        >운동장소관리</a>
        <button class="pb-btn-ghost nav-link logout-btn" on:click={handleLogout}>로그아웃</button>
    </SiteHeader>

    <main class="main">
        <div class="welcome-card">
            <div class="welcome-icon">🏟️</div>
            <h2 class="welcome-title">동호회 운동장소 관리</h2>
            <p class="welcome-desc">운동장소를 등록하고 회원 참가 신청을 위한 일자별 운영을 준비할 수 있습니다.</p>
            <a href="/circle/place" class="quick-link">
                <span class="quick-icon">📍</span>
                <span class="quick-text">운동장소관리 이동</span>
            </a>
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
        padding: 8px 16px;
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
        max-width: 900px;
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
        margin: 0 0 28px;
        line-height: 1.6;
    }
    .quick-link {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 28px;
        background: #edf2f7;
        border-radius: 12px;
        text-decoration: none;
        color: #2d3748;
        font-weight: 600;
        font-size: 15px;
    }
    .quick-icon { font-size: 20px; }
</style>
