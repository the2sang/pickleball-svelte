<script>
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
</svelte:head>

{@render children()}
