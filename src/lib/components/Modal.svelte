<script>
  /** @type {{ open: boolean, onclose: () => void, children: any }} */
  let { open, onclose, children } = $props();
</script>

{#if open}
  <div class="modal-overlay">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="backdrop" onclick={onclose}></div>
    <div class="pb-card modal-content">
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
  }
  .modal-content {
    position: relative;
    padding: 28px;
    max-width: 480px;
    width: 90%;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
