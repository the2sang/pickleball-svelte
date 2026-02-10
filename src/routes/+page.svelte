<script>
  import PartnerSelector from '$lib/components/PartnerSelector.svelte';
  import DateSelector from '$lib/components/DateSelector.svelte';
  import CourtGrid from '$lib/components/CourtGrid.svelte';
  import DetailModal from '$lib/components/DetailModal.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import SuccessToast from '$lib/components/SuccessToast.svelte';
  import { selectedPartner, selectedDate } from '$lib/stores/reservation.js';
</script>

<svelte:head>
  <title>피클볼 게임 예약</title>
</svelte:head>

<div class="page">
  <!-- Header -->
  <header class="header">
    <div class="header-inner">
      <div class="header-content">
        <div class="logo">🏓</div>
        <div>
          <h1 class="header-title">피클볼 게임 예약</h1>
          <p class="header-sub">원하는 시간대의 게임을 찾아 예약하세요</p>
        </div>
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
  .header-inner { max-width: 960px; margin: 0 auto; }
  .header-content { display: flex; align-items: center; gap: 12px; }
  .logo {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(255, 255, 255, 0.15);
    display: flex; align-items: center; justify-content: center; font-size: 22px;
  }
  .header-title {
    margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
  }
  .header-sub {
    margin: 2px 0 0; font-size: 12px; opacity: 0.7;
  }
  .main {
    max-width: 960px;
    margin: 0 auto;
    padding: 20px 16px;
  }
</style>
