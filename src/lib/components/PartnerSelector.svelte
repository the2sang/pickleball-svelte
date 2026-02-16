<script>
  import {
    selectedPartner,
    partnerInfo,
    courts,
  } from "$lib/stores/reservation.js";
  import { auth } from "$lib/stores/auth.js";
  import { onMount } from "svelte";

  let partners = [];
  let keyword = "";
  let loading = false;
  let totalCount = 0;
  let searchTimer;
  let fetchError = "";

  onMount(() => {
    fetchPartners();
  });

  function handleSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      fetchPartners();
    }, 300);
  }

  async function fetchPartners() {
    loading = true;
    fetchError = "";
    const headers = {};

    if ($auth?.accessToken) {
      headers.Authorization = `Bearer ${$auth.accessToken}`;
    }

    try {
      const params = new URLSearchParams({ page: "1", size: "20" });
      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }
      const res = await fetch(`/api/v1/partners?${params}`, {
        headers,
      });
        if (!res.ok) {
          throw new Error(`사업장 조회 실패 (${res.status})`);
        }

        const data = await res.json();
        const list = data?.data ?? data?.content ?? [];
        const source = Array.isArray(list) ? list : [];

        partners = [...source].sort((a, b) => {
          const aName = String(a?.businessPartner ?? a?.partnerName ?? "").trim();
          const bName = String(b?.businessPartner ?? b?.partnerName ?? "").trim();
          return aName.localeCompare(bName, "ko-KR", { sensitivity: "base" });
        });
        totalCount = typeof data?.total === "number" ? data.total : partners.length;
      } catch (e) {
        console.error("사업장 조회 실패:", e);
        fetchError = e?.message || "사업장 목록을 불러오지 못했습니다.";
        partners = [];
        totalCount = 0;
      } finally {
        loading = false;
      }
  }

  function selectPartner(id) {
    selectedPartner.set(id);
    const partner = partners.find((p) => p.id === id);
    if (partner) {
      partnerInfo.set(partner);
      fetchCourts(id);
    }
  }

  async function fetchCourts(partnerId) {
    const headers = {};

    if ($auth?.accessToken) {
      headers.Authorization = `Bearer ${$auth.accessToken}`;
    }

    try {
      const res = await fetch(`/api/v1/partners/${partnerId}/courts`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        courts.set(data);
      } else {
        courts.set([]);
      }
    } catch (e) {
      console.error(e);
      courts.set([]);
    }
  }

  function clearSearch() {
    keyword = "";
    fetchPartners();
  }
</script>

<div class="pb-card card">
  <div class="step-header">
    <span class="step-number">1</span>
    <span class="step-title">사업장 선택</span>
    {#if totalCount > 0}
      <span class="badge">{totalCount}개</span>
    {/if}
  </div>

  <!-- Search Bar -->
  <div class="search-bar">
    <div class="search-input-wrap">
      <svg
        class="search-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </svg>
      <input
        type="text"
        class="search-input"
        placeholder="사업장명 또는 주소로 검색..."
        bind:value={keyword}
        on:input={handleSearch}
      />
      {#if keyword}
        <button class="clear-btn" on:click={clearSearch}>✕</button>
      {/if}
    </div>
  </div>

  <!-- Partner List -->
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <span>검색 중...</span>
    </div>
  {:else if fetchError}
    <div class="error-box">
      <span class="error-icon">⚠️</span>
      <p class="error-text">{fetchError}</p>
      <button class="pb-btn-ghost retry-btn" on:click={fetchPartners}>다시 시도</button>
    </div>
  {:else if partners.length === 0}
    <div class="empty">
      <span class="empty-icon">🔍</span>
      <p class="empty-text">
        {#if keyword}
          '<strong>{keyword}</strong>' 검색 결과가 없습니다
        {:else}
          등록된 사업장이 없습니다
        {/if}
      </p>
    </div>
  {:else}
    <div class="partner-grid">
      {#each partners as p (p.id)}
        <button
          class="partner-card"
          class:selected={$selectedPartner === p.id}
          on:click={() => selectPartner(p.id)}
        >
          <div class="partner-top">
            <div class="partner-name">{p.businessPartner}</div>
            {#if $selectedPartner === p.id}
              <span class="check-badge">✓</span>
            {/if}
          </div>
          <div class="partner-owner">👤 {p.owner}</div>
          <div class="partner-addr">📍 {p.partnerAddress}</div>
          {#if p.courtCount > 0}
            <div class="partner-courts">🏟️ 코트 {p.courtCount}개</div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card {
    padding: 20px;
    margin-bottom: 16px;
    animation: fadeIn 0.3s ease;
  }
  .step-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }
  .step-number {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #1a365d;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
  }
  .step-title {
    font-weight: 700;
    font-size: 15px;
    color: #1a365d;
  }
  .badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    color: #4299e1;
    background: #ebf8ff;
    padding: 3px 10px;
    border-radius: 12px;
  }

  /* Search Bar */
  .search-bar {
    margin-bottom: 16px;
  }
  .search-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-icon {
    position: absolute;
    left: 14px;
    width: 18px;
    height: 18px;
    color: #a0aec0;
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    padding: 12px 40px 12px 42px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    font-family: inherit;
    color: #2d3748;
    background: #f7fafc;
    outline: none;
    transition: all 0.2s;
  }
  .search-input::placeholder {
    color: #a0aec0;
  }
  .search-input:focus {
    border-color: #4299e1;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  }
  .clear-btn {
    position: absolute;
    right: 12px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: #e2e8f0;
    color: #718096;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    font-family: inherit;
  }
  .clear-btn:hover {
    background: #cbd5e0;
    color: #4a5568;
  }

  /* Loading */
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 32px 0;
    color: #718096;
    font-size: 13px;
  }
  .spinner {
    width: 20px;
    height: 20px;
    border: 2.5px solid #e2e8f0;
    border-top-color: #4299e1;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Empty */
  .empty {
    text-align: center;
    padding: 32px 0;
  }
  .empty-icon {
    font-size: 32px;
    display: block;
    margin-bottom: 8px;
  }
  .empty-text {
    color: #718096;
    font-size: 13px;
    margin: 0;
  }

  .error-box {
    text-align: center;
    border: 1.5px dashed #feb2b2;
    border-radius: 12px;
    background: #fff5f5;
    color: #c53030;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .error-icon {
    font-size: 24px;
    line-height: 1;
  }
  .error-text {
    color: #742a2a;
    margin: 0;
    font-size: 13px;
  }
  .retry-btn {
    height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    font-size: 12px;
  }

  /* Partner Grid */
  .partner-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
  }
  .partner-card {
    padding: 14px 16px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    font-family: inherit;
  }
  .partner-card:hover {
    border-color: #bee3f8;
    background: #f7fafc;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  .partner-card.selected {
    border: 2px solid #2b6cb0;
    background: #ebf8ff;
    box-shadow: 0 2px 12px rgba(43, 108, 176, 0.15);
  }
  .partner-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .partner-name {
    font-weight: 700;
    font-size: 14px;
    color: #1a365d;
  }
  .check-badge {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #2b6cb0;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
  }
  .partner-owner {
    font-size: 12px;
    color: #4a5568;
    margin-bottom: 2px;
  }
  .partner-addr {
    font-size: 11px;
    color: #718096;
  }
  .partner-courts {
    font-size: 11px;
    color: #4299e1;
    font-weight: 600;
    margin-top: 6px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
