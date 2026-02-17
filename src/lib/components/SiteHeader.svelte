<script>
  let {
    title = "패들들고 LesGO!",
    brandHref = "/",
    hasNav = true,
    navClass = "pb-nav nav-links",
    children,
  } = $props();

  import logo from "$lib/assets/main_logo2.png";
</script>

<header class="pb-header header">
  <div class="pb-header-inner header-inner">
    <div class="header-content">
      <a href={brandHref} class="pb-brand-link brand-link">
        <img src={logo} alt="LESGO PiCKLE" class="pb-brand-logo brand-logo" />
      <h1 class="pb-brand-title brand-title">{title}</h1>
    </a>
  </div>

  {#if hasNav}
    <div class={navClass}>
      {@render children?.()}
    </div>
  {/if}
</div>
</header>

<style>
  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
</style>
