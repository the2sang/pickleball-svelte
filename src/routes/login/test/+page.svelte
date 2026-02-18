<script>
  import { goto } from "$app/navigation";
  import { auth } from "$lib/stores/auth.js";
  import { buildApiUrl } from "$lib/api.js";
  import SiteHeader from "$lib/components/SiteHeader.svelte";

  const defaultPassword = "alswl1!314";
  const testAccounts = [
    { label: "파트너 - admin1", username: "admin1", password: defaultPassword },
    { label: "파트너 - admin2", username: "admin2", password: defaultPassword },
    { label: "파트너 - admin3", username: "admin3", password: defaultPassword },
    { label: "회원 - user1", username: "user1", password: defaultPassword },
    { label: "회원 - user2", username: "user2", password: defaultPassword },
    { label: "회원 - user3", username: "user3", password: defaultPassword },
    { label: "회원 - user4", username: "user4", password: defaultPassword },
    { label: "회원 - user5", username: "user5", password: defaultPassword },
    { label: "회원 - user6", username: "user6", password: defaultPassword },
    { label: "회원 - user7", username: "user7", password: defaultPassword },
    { label: "회원 - user8", username: "user8", password: defaultPassword },
    { label: "회원 - user9", username: "user9", password: defaultPassword },
    { label: "회원 - user10", username: "user10", password: defaultPassword },
  ];

  let selectedUsername = "";
  let formData = {
    username: "",
    password: "",
  };
  let loading = false;
  let loginError = "";

  function onAccountChange(username) {
    selectedUsername = username;
    loginError = "";
    const selected = testAccounts.find((account) => account.username === username);
    if (!selected) {
      formData = { username: "", password: "" };
      return;
    }
    formData = {
      username: selected.username,
      password: selected.password,
    };
  }

  async function submitLogin(e) {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      loginError = "테스트 계정을 선택해주세요.";
      return;
    }

    loading = true;
    loginError = "";

    try {
      const response = await fetch(buildApiUrl("/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        loginError = errorData?.message || "로그인에 실패했습니다.";
        loading = false;
        return;
      }

      const data = await response.json();
      auth.login(data);

      const isAdminAccount = formData.username.trim().toLowerCase() === "admin";
      const accountType = (data.accountType || "").trim().toUpperCase();

      if (accountType === "ADMIN" || isAdminAccount) {
        goto("/admin");
      } else if (accountType === "PARTNER") {
        goto("/partner");
      } else {
        goto("/");
      }
    } catch {
      loginError = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>테스트 로그인 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
  <SiteHeader title="테스트 로그인" hasNav={false} brandHref="/" />

  <main class="main">
    <div class="form-container">
      <form class="login-form" on:submit={submitLogin}>
        {#if loginError}
          <div class="login-error">{loginError}</div>
        {/if}

        <div class="form-group">
          <label for="test-account" class="label">테스트 계정 선택</label>
          <select
            id="test-account"
            class="input"
            bind:value={selectedUsername}
            on:change={(e) => onAccountChange(e.target.value)}
          >
            <option value="">계정을 선택하세요</option>
            {#each testAccounts as account}
              <option value={account.username}>{account.label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="username" class="label">아이디</label>
          <input id="username" class="input" type="text" bind:value={formData.username} readonly />
        </div>

        <div class="form-group">
          <label for="password" class="label">비밀번호</label>
          <input id="password" class="input" type="password" bind:value={formData.password} readonly />
        </div>

        <button type="submit" class="btn btn-primary" disabled={loading}>
          {loading ? "로그인 중..." : "선택 계정으로 로그인"}
        </button>
      </form>
    </div>
  </main>
</div>

<style>
  .page {
    min-height: 100dvh;
  }

  .main {
    display: flex;
    justify-content: center;
    padding: 32px 16px;
  }

  .form-container {
    width: min(480px, 100%);
  }

  .login-form {
    display: grid;
    gap: 14px;
    padding: 22px;
    border: 1px solid #dce3f1;
    border-radius: 14px;
    background: #fff;
  }

  .form-group {
    display: grid;
    gap: 6px;
  }

  .label {
    font-size: 14px;
    font-weight: 700;
    color: #2b3f5c;
  }

  .input {
    width: 100%;
    height: 42px;
    border: 1px solid #cad5ea;
    border-radius: 10px;
    padding: 0 12px;
    font-size: 14px;
    box-sizing: border-box;
  }

  .btn {
    border: 0;
    border-radius: 10px;
    height: 44px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-primary {
    background: #2b5fd8;
    color: #fff;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .login-error {
    border-radius: 10px;
    border: 1px solid #f1b4bd;
    background: #fff0f3;
    color: #a7223a;
    padding: 10px 12px;
    font-size: 14px;
  }
</style>
