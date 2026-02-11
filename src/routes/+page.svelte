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

<div class="page">
  <!-- Header -->
  <header class="header">
    <div class="header-inner">
      <div class="header-content">
        <a href="/" class="brand-link">
          <img src={logo} alt="LESGO PiCKLE" class="brand-logo" />
          <h1 class="brand-title">피클볼 게임 예약하러 가자.. Let's GO!</h1>
        </a>
        <!-- <p class="header-sub">원하는 시간대의 게임을 찾아 예약하세요</p> -->
      </div>
      <div class="nav-links">
        {#if $auth}
          <span class="user-greeting">
            <span class="user-icon">👤</span>
            <span class="user-name">{$auth.name || $auth.username}</span>님
          </span>
          <a href="/profile" class="nav-link profile-link">회원정보</a>
          <button class="nav-link logout-btn" on:click={handleLogout}>
            로그아웃
          </button>
        {:else}
          <a href="/login" class="nav-link login-link">로그인</a>
          <a href="/signup" class="nav-link signup-link">회원가입</a>
        {/if}
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main">
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
  .header {
    background: linear-gradient(135deg, #1a365d 0%, #2a4a7f 50%, #1e3a5f 100%);
    padding: 20px 24px;
    color: #fff;
    box-shadow: 0 4px 20px rgba(26, 54, 93, 0.3);
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
    font-size: 17px;
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
  .login-link {
    background: rgba(255, 255, 255, 0.1);
    border: 1.5px solid rgba(255, 255, 255, 0.3);
  }
  .login-link:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
  }
  .signup-link {
    background: rgba(255, 255, 255, 0.2);
    border: 1.5px solid rgba(255, 255, 255, 0.4);
  }
  .signup-link:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.6);
    transform: translateY(-1px);
  }
  .profile-link {
    background: rgba(66, 153, 225, 0.2);
    border: 1.5px solid rgba(66, 153, 225, 0.4);
  }
  .profile-link:hover {
    background: rgba(66, 153, 225, 0.35);
    border-color: rgba(66, 153, 225, 0.6);
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
    padding: 20px 16px;
  }
</style>
