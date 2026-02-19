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
    <title>운동장소관리 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <SiteHeader title="운동장소관리" brandHref="/circle" hasNav={!!$auth}>
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
        <div class="page-actions">
            <button class="back-btn" on:click={() => goto('/circle')}>← 메인으로</button>
            <button class="add-btn" on:click={() => goto('/circle/place/new')}>+ 운동장소 추가</button>
        </div>

        <div class="empty-state">
            <p>등록된 운동장소가 없습니다.</p>
            <button class="add-btn-sm" on:click={() => goto('/circle/place/new')}>운동장소 등록하기</button>
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
    .menu-link {
        color: #1a365d;
    }
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
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
    }
    .empty-state {
        text-align: center;
        padding: 40px;
        color: #718096;
        background: #fff;
        border-radius: 12px;
    }
    .empty-state p {
        margin-bottom: 16px;
    }
    .add-btn-sm {
        background: #3182ce;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
    }
</style>
