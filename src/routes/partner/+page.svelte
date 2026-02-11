<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth.js";
    import logo from "$lib/assets/main_logo.png";

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

<div class="page">
    <header class="header">
        <div class="header-inner">
            <div class="header-content">
                <a href="/partner" class="brand-link">
                    <img src={logo} alt="LESGO PiCKLE" class="brand-logo" />
                    <h3 class="brand-title">사업장 관리</h3>
                </a>
            </div>
            <div class="nav-links">
                {#if $auth}
                    <span class="user-greeting">
                        <span class="user-icon">🏢</span>
                        <span class="user-name"
                            >{$auth.name || $auth.username}</span
                        >님
                    </span>
                    <a href="/partner/profile" class="nav-link profile-link"
                        >사업장정보</a
                    >
                    <button class="nav-link logout-btn" on:click={handleLogout}
                        >로그아웃</button
                    >
                {/if}
            </div>
        </div>
    </header>

    <main class="main">
        <div class="welcome-card">
            <div class="welcome-icon">🏟️</div>
            <h2 class="welcome-title">사업장 관리 페이지</h2>
            <p class="welcome-desc">
                사업장 정보를 관리하고, 코트 및 예약 현황을 확인할 수 있습니다.
            </p>
            <div class="quick-links">
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
    .header {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        color: #fff;
        padding: 16px 20px;
    }
    .header-inner {
        max-width: 960px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }
    .header-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .brand-link {
        display: flex;
        align-items: center;
        text-decoration: none;
        gap: 12px;
        transition: opacity 0.2s;
    }
    .brand-link:hover {
        opacity: 0.8;
    }
    .brand-logo {
        height: 70px;
        width: auto;
        display: block;
    }
    .brand-title {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.5px;
        white-space: nowrap;
    }
    .nav-links {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .user-greeting {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        padding: 6px 14px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
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
        padding: 8px 18px;
        border-radius: 8px;
        color: #fff;
        text-decoration: none;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        transition: all 0.15s;
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
