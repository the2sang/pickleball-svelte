<script>
  import '../app.css';
  import { page } from '$app/stores';
  let { children } = $props();

  const reservationPaths = ['/', '/partner/courtReservation'];

  function isReservationRoute(pathname) {
    return reservationPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
  }
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
</svelte:head>

{@render children()}

{#if isReservationRoute($page.url.pathname)}
  <div class="orientation-overlay" role="status" aria-live="polite">
    <div class="orientation-card">
      <div class="orientation-icon" aria-hidden="true">↻</div>
      <p class="orientation-text">
        본 사이트는 가로화면에 최적화 되어 있으니 회전해 주세요
      </p>
    </div>
  </div>
{/if}

<style>
  .orientation-overlay {
    display: none;
  }

  @media (max-width: 900px) and (orientation: portrait) {
    .orientation-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(10, 19, 33, 0.9);
      backdrop-filter: blur(2px);
    }

    .orientation-card {
      width: min(92vw, 360px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: linear-gradient(145deg, rgba(26, 54, 93, 0.95), rgba(42, 74, 127, 0.9));
      color: #fff;
      text-align: center;
      padding: 24px 20px;
      box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
    }

    .orientation-icon {
      width: 52px;
      height: 52px;
      margin: 0 auto 12px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.4);
      display: grid;
      place-items: center;
      font-size: 26px;
      line-height: 1;
      font-weight: 700;
    }

    .orientation-text {
      margin: 0;
      font-size: 15px;
      line-height: 1.45;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
  }
</style>
