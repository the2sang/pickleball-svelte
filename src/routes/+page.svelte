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
  import SiteHeader from "$lib/components/SiteHeader.svelte";

  onMount(() => {
    auth.refresh();
  });

  function handleLogout() {
    auth.logout();
    goto("/login"); // 로그아웃 후 로그인 페이지로 이동
  }
</script>

<svelte:head>
  <title>LESGO</title>
</svelte:head>

<div class="pb-shell page">
  <!-- Header -->
  <SiteHeader title="라켓들고 LesGO!">
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
  </SiteHeader>

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
  .page :global(.pb-header) {
    color: #4a3a00;
    background: linear-gradient(135deg, #fb923c 0%, #f97316 55%, #ea580c 100%);
    box-shadow: 0 10px 30px rgba(154, 52, 18, 0.24);
  }
  .user-greeting {
    white-space: nowrap;
    color: #5b4300;
    background: rgba(255, 255, 255, 0.48);
    border-color: rgba(120, 84, 0, 0.25);
  }
  .user-icon {
    font-size: 16px;
  }
  .user-name {
    color: #7a4f00;
    font-weight: 700;
  }
  .nav-link {
    color: #5a4300;
    text-decoration: none;
    white-space: nowrap;
  }
  .login-link {
    background: rgba(255, 255, 255, 0.35);
    border-color: rgba(120, 84, 0, 0.24);
  }
  .login-link:hover {
    background: rgba(255, 255, 255, 0.55);
    border-color: rgba(120, 84, 0, 0.36);
  }
  .signup-link {
    color: #fff;
    box-shadow: 0 10px 26px rgba(120, 84, 0, 0.24);
  }
  .partner-link {
    background: rgba(255, 255, 255, 0.35);
    border-color: rgba(120, 84, 0, 0.24);
    color: #5a4300;
  }
  .partner-link:hover {
    background: rgba(255, 255, 255, 0.55);
    border-color: rgba(120, 84, 0, 0.36);
  }
  .profile-link {
    background: rgba(255, 255, 255, 0.35);
    border-color: rgba(120, 84, 0, 0.24);
    color: #5a4300;
  }
  .profile-link:hover {
    background: rgba(255, 255, 255, 0.55);
    border-color: rgba(120, 84, 0, 0.36);
  }
  .logout-btn {
    background: rgba(255, 255, 255, 0.35);
    border-color: rgba(120, 84, 0, 0.24);
    color: #5a4300;
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
