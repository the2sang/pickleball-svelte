<script>
  import { successOpen } from '$lib/stores/reservation.js';
</script>

{#if $successOpen}
  <div class="toast">✅ 예약이 완료되었습니다!</div>
{/if}

<style>
  .toast {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
    background: #2e7d32;
    color: #fff;
    padding: 14px 28px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(46, 125, 50, 0.4);
    animation: pop 0.3s ease;
  }
  @keyframes pop {
    0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
    50% { transform: translateX(-50%) scale(1.05); }
    100% { transform: translateX(-50%) scale(1); opacity: 1; }
  }
</style>
