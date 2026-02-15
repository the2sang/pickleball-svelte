<script>
  import PartnerSelector from "$lib/components/PartnerSelector.svelte";
  import DateSelector from "$lib/components/DateSelector.svelte";
  import CourtGrid from "$lib/components/CourtGrid.svelte";
  import DetailModal from "$lib/components/DetailModal.svelte";
  import ConfirmModal from "$lib/components/ConfirmModal.svelte";
  import SuccessToast from "$lib/components/SuccessToast.svelte";
  import { selectedPartner, selectedDate } from "$lib/stores/reservation.js";
  import { auth } from "$lib/stores/auth.js";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import logo from "$lib/assets/main_logo.png";

  onMount(() => {
    auth.refresh();
  });

  function handleLogout() {
    auth.logout();
    goto("/login"); // 로그아웃 후 로그인 페이지로 이동
  }
</script>

<svelte:head>
  <title>LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
  <!-- Header -->
    <header class="pb-header header">
    <div class="pb-header-inner header-inner">
      <div class="header-content">
        <a href="/" class="pb-brand-link brand-link">
          <img src={logo} alt="LESGO PiCKLE" class="pb-brand-logo brand-logo" />
          <h1 class="pb-brand-title brand-title">피클볼 게임 예약하러 가자.. Let's GO!</h1>
        </a>
        <!-- <p class="header-sub">원하는 시간대의 게임을 찾아 예약하세요</p> -->
      </div>
      <div class="pb-nav nav-links">
        {#if $auth}
          <span class="pb-user-pill user-greeting">
            <span class="user-icon">👤</span>
            <span class="user-name">{$auth.name || $auth.username}</span>님
          </span>
          {#if $auth.accountType === 'PARTNER'}
            <a href="/partner" class="pb-btn-ghost nav-link partner-link">사업장 관리</a>
            <a href="/partner/profile" class="pb-btn-ghost nav-link profile-link">사업장정보</a>
          {:else}
            <a href="/profile" class="pb-btn-ghost nav-link profile-link">회원정보</a>
          {/if}
          <button class="pb-btn-ghost nav-link logout-btn" on:click={handleLogout}>
            로그아웃
          </button>
        {:else}
          <a href="/login" class="pb-btn-ghost nav-link login-link">로그인</a>
          <a href="/signup" class="pb-btn-primary nav-link signup-link">회원가입</a>
        {/if}
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="pb-container main">
    <PartnerSelector />

    {#if $selectedPartner}
      <DateSelector />
    {/if}

    {#if $selectedPartner && $selectedDate}
      <CourtGrid />
    {/if}
  </main>

  <!-- Modals & Toast -->
  <DetailModal />
  <ConfirmModal />
  <SuccessToast />
</div>

<style>
  .page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%);
  }
  .header-inner {
  }
  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
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
    color: #fff;
    text-decoration: none;
    white-space: nowrap;
  }
  .login-link {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }
  .login-link:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }
  .signup-link {
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.18);
  }
  .partner-link {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.28);
    color: #e6fffa;
  }
  .partner-link:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.4);
  }
  .profile-link {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.28);
    color: #e2f0ff;
  }
  .profile-link:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.4);
  }
  .logout-btn {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.28);
    cursor: pointer;
    font-family: inherit;
  }
  .logout-btn:hover {
    background: rgba(229, 62, 62, 0.22);
    border-color: rgba(229, 62, 62, 0.45);
  }
  .main {
    padding: 20px 16px;
  }
</style>
