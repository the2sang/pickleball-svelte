<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.js";
    import { buildApiUrl } from "$lib/api.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";

    let places = $state([]);
    let loading = $state(true);
    let errorMessage = $state("");

    onMount(async () => {
        auth.refresh();
        const user = getUser();
        if (!user || user.accountType !== "CIRCLE") {
            goto("/login");
            return;
        }

        await fetchPlaces(user.accessToken);
    });

    async function fetchPlaces(accessToken) {
        loading = true;
        errorMessage = "";
        try {
            const response = await fetch(buildApiUrl("/api/v1/circle-manage/places"), {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                errorMessage = errorData?.message || "운동장소 목록을 불러오지 못했습니다.";
                places = [];
                return;
            }

            const data = await response.json();
            places = Array.isArray(data) ? data : [];
        } catch {
            errorMessage = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
            places = [];
        } finally {
            loading = false;
        }
    }

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
        <button class="pb-btn-ghost nav-link logout-btn" onclick={handleLogout}>로그아웃</button>
    </SiteHeader>

    <main class="main">
        <div class="page-actions">
            <button class="back-btn" onclick={() => goto('/circle')}>← 메인으로</button>
            <button class="add-btn" onclick={() => goto('/circle/place/new')}>+ 운동장소 추가</button>
        </div>

        {#if loading}
            <div class="empty-state">
                <p>운동장소 목록을 불러오는 중입니다...</p>
            </div>
        {:else if errorMessage}
            <div class="empty-state error-state">
                <p>{errorMessage}</p>
                <button class="add-btn-sm" onclick={() => fetchPlaces(getUser()?.accessToken)}>다시 시도</button>
            </div>
        {:else if places.length === 0}
            <div class="empty-state">
                <p>등록된 운동장소가 없습니다.</p>
                <button class="add-btn-sm" onclick={() => goto('/circle/place/new')}>운동장소 등록하기</button>
            </div>
        {:else}
            <div class="place-list">
                {#each places as place}
                    <article class="place-card">
                        <div class="place-header">
                            <h3>{place.placeName}</h3>
                            <span class={`status-badge ${place.reservClose === 'Y' ? 'closed' : 'open'}`}>
                                {place.reservClose === 'Y' ? '접수마감' : '접수가능'}
                            </span>
                        </div>
                        <div class="meta-grid">
                            <div><strong>수용인원:</strong> {place.personnelNumber}명</div>
                            <div><strong>장소 타입:</strong> {place.placeType || '-'}</div>
                            <div><strong>운영시간:</strong> {place.gameTime || '-'}</div>
                        </div>
                    </article>
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
    .error-state {
        color: #c53030;
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
    .place-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
    .place-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
    }
    .place-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
    }
    .place-header h3 {
        margin: 0;
        font-size: 18px;
        color: #2d3748;
    }
    .status-badge {
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 700;
    }
    .status-badge.open {
        background: #c6f6d5;
        color: #276749;
    }
    .status-badge.closed {
        background: #fed7d7;
        color: #9b2c2c;
    }
    .meta-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        color: #4a5568;
        font-size: 14px;
    }
    @media (max-width: 760px) {
        .meta-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
