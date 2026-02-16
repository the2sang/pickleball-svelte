<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";

    let partners = [];
    let total = 0;
    let page = 1;
    let size = 20;
    let keyword = "";
    let loading = true;
    let error = "";

    onMount(() => {
        auth.refresh();
        const user = getUser();
        if (!user || user.accountType !== "ADMIN") {
            goto("/admin");
            return;
        }
        fetchPartners();
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

    async function fetchPartners() {
        loading = true;
        error = "";
        try {
            const params = new URLSearchParams({
                page: String(page),
                size: String(size),
            });
            if (keyword.trim()) params.set("keyword", keyword.trim());

            const res = await fetch(`/api/v1/admin/partners?${params}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            if (res.status === 401 || res.status === 403) {
                auth.logout();
                goto("/admin");
                return;
            }

            if (!res.ok) throw new Error("조회 실패");

            const data = await res.json();
            partners = data.data;
            total = data.total;
        } catch (err) {
            error = "사업장 목록을 불러올 수 없습니다.";
        } finally {
            loading = false;
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        page = 1;
        fetchPartners();
    }

    function goDetail(id) {
        goto(`/admin/partners/${id}`);
    }

    function handleLogout() {
        auth.logout();
        goto("/admin");
    }

    function prevPage() {
        if (page > 1) {
            page--;
            fetchPartners();
        }
    }
    function nextPage() {
        if (page * size < total) {
            page++;
            fetchPartners();
        }
    }

    function levelLabel(level) {
        return level === "1" ? "승인완료" : "승인요청";
    }
    function levelClass(level) {
        return level === "1" ? "badge-approved" : "badge-pending";
    }
</script>

<svelte:head>
    <title>사업장관리 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <SiteHeader title="사업장관리" brandHref="/admin/partners" hasNav={true}>
        <button class="pb-btn-ghost nav-link logout-btn" on:click={handleLogout}>
          로그아웃
        </button>
    </SiteHeader>

    <main class="main">
        <!-- 검색 -->
        <form class="search-bar" on:submit={handleSearch}>
            <input
                type="text"
                class="search-input"
                placeholder="사업장명 검색..."
                bind:value={keyword}
            />
            <button type="submit" class="search-btn">검색</button>
        </form>

        {#if error}
            <div class="error-msg">⚠️ {error}</div>
        {/if}

        {#if loading}
            <div class="loading">불러오는 중...</div>
        {:else if partners.length === 0}
            <div class="empty">등록된 사업장이 없습니다.</div>
        {:else}
            <div class="table-wrap">
                <table class="partner-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>사업장명</th>
                            <th>대표자</th>
                            <th>전화번호</th>
                            <th>주소</th>
                            <th>승인상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each partners as p, idx}
                            <tr
                                class="clickable"
                                on:click={() => goDetail(p.id)}
                            >
                                <td>{(page - 1) * size + idx + 1}</td>
                                <td class="name-cell">{p.businessPartner}</td>
                                <td>{p.owner}</td>
                                <td>{p.phoneNumber}</td>
                                <td class="addr-cell">{p.partnerAddress}</td>
                                <td>
                                    <span
                                        class="badge {levelClass(
                                            p.partnerLevel,
                                        )}"
                                    >
                                        {levelLabel(p.partnerLevel)}
                                    </span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- 페이지네이션 -->
            <div class="pagination">
                <button
                    class="page-btn"
                    on:click={prevPage}
                    disabled={page <= 1}>◀ 이전</button
                >
                <span class="page-info"
                    >{page} / {Math.max(1, Math.ceil(total / size))}</span
                >
                <button
                    class="page-btn"
                    on:click={nextPage}
                    disabled={page * size >= total}>다음 ▶</button
                >
            </div>
        {/if}
    </main>
</div>

<style>
    .page {
        min-height: 100vh;
        background: #f7fafc;
    }
    .nav-link { }
    .logout-btn:hover {
        background: rgba(229, 62, 62, 0.3);
        border-color: rgba(229, 62, 62, 0.5);
        transform: translateY(-1px);
    }

    .main {
        max-width: 960px;
        margin: 0 auto;
        padding: 24px 16px;
    }

    /* Search */
    .search-bar {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
    }
    .search-input {
        flex: 1;
        padding: 10px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s;
    }
    .search-input:focus {
        border-color: #4299e1;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
    }
    .search-btn {
        padding: 10px 20px;
        background: #2b6cb0;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s;
    }
    .search-btn:hover {
        background: #2c5282;
    }

    /* Table */
    .table-wrap {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        overflow-x: auto;
    }
    .partner-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
    }
    .partner-table th {
        background: #edf2f7;
        padding: 12px 14px;
        text-align: left;
        font-weight: 700;
        color: #2d3748;
        white-space: nowrap;
        border-bottom: 2px solid #e2e8f0;
    }
    .partner-table td {
        padding: 12px 14px;
        border-bottom: 1px solid #edf2f7;
        color: #4a5568;
    }
    .clickable {
        cursor: pointer;
        transition: background 0.12s;
    }
    .clickable:hover {
        background: #ebf8ff;
    }
    .name-cell {
        font-weight: 600;
        color: #2b6cb0;
    }
    .addr-cell {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* Badge */
    .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
    }
    .badge-approved {
        background: #c6f6d5;
        color: #22543d;
    }
    .badge-pending {
        background: #fefcbf;
        color: #975a16;
    }

    /* Pagination */
    .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-top: 20px;
    }
    .page-btn {
        padding: 8px 16px;
        background: #fff;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.15s;
    }
    .page-btn:hover:not(:disabled) {
        background: #edf2f7;
        border-color: #cbd5e0;
    }
    .page-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
    .page-info {
        font-size: 14px;
        font-weight: 600;
        color: #4a5568;
    }

    /* States */
    .loading,
    .empty {
        text-align: center;
        padding: 48px 16px;
        color: #718096;
        font-size: 15px;
    }
    .error-msg {
        padding: 14px 16px;
        background: #fff5f5;
        border: 1px solid #feb2b2;
        border-radius: 8px;
        color: #c53030;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 16px;
    }
</style>
