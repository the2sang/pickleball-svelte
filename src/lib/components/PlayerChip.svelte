<script>
  /** @type {{ player: { name: string, level: string, dupr?: string, sex: string } }} */
  let { player } = $props();

  const sexIcon = $derived(player.sex === "남성" || player.sex === "남" ? "♂" : "♀");
  const sexColor = $derived(player.sex === "남성" || player.sex === "남" ? "#1976D2" : "#C2185B");
  const displayName = $derived(player.nicName || player.name);
</script>

<div class="player-chip">
  <span class="sex-icon" style="color:{sexColor}">{sexIcon}</span>
  <span class="name">{displayName}</span>
  <span class="level">{player.gameLevel || player.level}</span>
  {#if player.duprPoint || player.dupr}
    <span class="dupr">DUPR {player.duprPoint || player.dupr}</span>
  {/if}
</div>

<style>
  .player-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #fafafa;
    border-radius: 8px;
    border: 1px solid #eeeeee;
    font-size: 13px;
  }
  .sex-icon {
    font-weight: 700;
    font-size: 14px;
  }
  .name {
    font-weight: 600;
    color: #212121;
  }
  .level {
    color: #757575;
    font-size: 11px;
  }
  .dupr {
    background: #fff8e1;
    color: #f57f17;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 10px;
    border: 1px solid #ffe082;
  }
</style>
