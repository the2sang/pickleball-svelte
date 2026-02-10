<script>
  import { MOCK_PARTNERS } from '$lib/data/mock.js';
  import { selectedPartner } from '$lib/stores/reservation.js';

  function selectPartner(id) {
    selectedPartner.set(id);
  }
</script>

<div class="card">
  <div class="step-header">
    <span class="step-number">1</span>
    <span class="step-title">사업장 선택</span>
  </div>
  <div class="partner-grid">
    {#each MOCK_PARTNERS as p (p.id)}
      <button
        class="partner-card"
        class:selected={$selectedPartner === p.id}
        onclick={() => selectPartner(p.id)}
      >
        <div class="partner-name">{p.name}</div>
        <div class="partner-addr">{p.address}</div>
        <div class="partner-phone">📞 {p.phone}</div>
      </button>
    {/each}
  </div>
</div>

<style>
  .card {
    background: #fff;
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
    animation: fadeIn 0.3s ease;
  }
  .step-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }
  .step-number {
    width: 26px; height: 26px;
    border-radius: 50%;
    background: #1a365d;
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
  }
  .step-title {
    font-weight: 700;
    font-size: 15px;
    color: #1a365d;
  }
  .partner-grid {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .partner-card {
    flex: 1 1 200px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1.5px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    font-family: inherit;
  }
  .partner-card.selected {
    border: 2px solid #1a365d;
    background: #ebf4ff;
    transform: scale(1.01);
  }
  .partner-name {
    font-weight: 700; font-size: 14px; color: #1a365d; margin-bottom: 4px;
  }
  .partner-addr {
    font-size: 11px; color: #718096;
  }
  .partner-phone {
    font-size: 11px; color: #a0aec0; margin-top: 2px;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
