<script>
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { auth } from "$lib/stores/auth.js";
    import { buildApiUrl } from "$lib/api.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";

    const isQuickLoginEnabled = import.meta.env.DEV;
    const quickPassword = "alswl1!314";
    let quickAccounts = [];

    const quickAccountsSorted = $derived(
        [...quickAccounts].sort((a, b) => a.username.localeCompare(b.username))
    );

    let formData = {
        username: "",
        password: "",
    };

    let selectedQuickAccount = "";

    let errors = {
        username: "",
        password: "",
    };

    let loginError = "";
    let loading = false;
    let showResetForm = false;
    let resetEmail = "";
    let resetLoading = false;
    let resetMessage = "";
    let resetError = "";

    onMount(() => {
        if (!isQuickLoginEnabled) {
            return;
        }

        fetchQuickAccounts();
    });

    async function fetchQuickAccounts() {
        try {
            const response = await fetch(buildApiUrl("/api/v1/auth/quick-accounts"));
            if (!response.ok) {
                return;
            }

            const accounts = await response.json();
            quickAccounts = Array.isArray(accounts)
                ? accounts.map((account) => ({
                      label: `${account.accountType || "USER"} - ${account.username}`,
                      username: account.username,
                  }))
                : [];
        } catch {
            quickAccounts = [];
        }
    }

    function validateForm() {
        let isValid = true;
        errors = { username: "", password: "" };
        loginError = "";

        if (!formData.username.trim()) {
            errors.username = "아이디를 입력해주세요";
            isValid = false;
        }

        if (!formData.password) {
            errors.password = "비밀번호를 입력해주세요";
            isValid = false;
        }

        return isValid;
    }

    function handleQuickAccountChange(username) {
        selectedQuickAccount = username;

        if (!username) {
            return;
        }

        formData = {
            ...formData,
            username,
            password: quickPassword,
        };
        errors = { ...errors, username: "", password: "" };
    }

    function handleManualInput() {
        if (selectedQuickAccount) {
            selectedQuickAccount = "";
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!validateForm()) return;

        loading = true;
        loginError = "";
        resetMessage = "";
        resetError = "";

        try {
            const response = await fetch(buildApiUrl("/api/v1/auth/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (errorData && errorData.message) {
                    loginError = errorData.message;
                } else if (response.status === 401) {
                    loginError = "아이디 또는 비밀번호가 올바르지 않습니다.";
                } else {
                    loginError =
                        "로그인 중 오류가 발생했습니다. 다시 시도해주세요.";
                }
                loading = false;
                return;
            }

            const data = await response.json();
            auth.login(data);

            const isAdminAccount = formData.username.trim().toLowerCase() === "admin";
            const accountType = (data.accountType || "").trim().toUpperCase();

            // 계정 타입 및 시스템 관리자 계정 강제 라우팅
            if (accountType === "ADMIN" || isAdminAccount) {
                goto("/admin");
            } else if (accountType === "PARTNER") {
                goto("/partner");
            } else if (accountType === "CIRCLE") {
                goto("/circle");
            } else {
                goto("/");
            }
        } catch (err) {
            loginError = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
            loading = false;
        }
    }

    function goBack() {
        goto("/");
    }

    function toggleResetForm() {
        showResetForm = !showResetForm;
        resetMessage = "";
        resetError = "";
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        resetMessage = "";
        resetError = "";

        const email = resetEmail.trim();
        if (!email) {
            resetError = "이메일을 입력해주세요.";
            return;
        }

        resetLoading = true;
        try {
            const response = await fetch(buildApiUrl("/api/v1/auth/password/reset"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (errorData?.message) {
                    resetError = errorData.message;
                } else {
                    resetError = "비밀번호 초기화 요청 중 오류가 발생했습니다.";
                }
                return;
            }

            const data = await response.json().catch(() => null);
            resetMessage = data?.message || "입력하신 이메일로 임시 비밀번호를 발송했습니다.";
        } catch (err) {
            resetError = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
        } finally {
            resetLoading = false;
        }
    }
</script>

<svelte:head>
    <title>로그인 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <!-- Header -->
    <SiteHeader
        title="패들들고 LesGO! - 로그인"
        hasNav={false}
        brandHref="/"
    />

    <!-- Main Content -->
    <main class="main">
        <div class="form-container">
            <form class="login-form" on:submit={handleSubmit}>
                {#if loginError}
                    <div class="login-error">
                        <span class="error-icon">⚠️</span>
                        {loginError}
                    </div>
                {/if}

                {#if isQuickLoginEnabled}
                    <div class="form-group">
                        <label for="quick-account" class="label">
                            개발용 계정 빠른 선택
                        </label>
                        <select
                            id="quick-account"
                            class="input"
                            bind:value={selectedQuickAccount}
                            on:change={(e) => handleQuickAccountChange(e.target.value)}
                        >
                            <option value="">선택 안함</option>
                            {#each quickAccountsSorted as account}
                                <option value={account.username}>
                                    {account.label}
                                </option>
                            {/each}
                        </select>
                    </div>
                    <p class="quick-helper">
                        시스템 관리자 계정은 <a href="/admin">관리자 로그인</a>에서 접속하세요.
                    </p>
                {/if}

                <!-- username -->
                <div class="form-group">
                    <label for="username" class="label">
                        아이디 <span class="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="username"
                        bind:value={formData.username}
                        class="input"
                        class:error={errors.username}
                        placeholder="로그인 ID를 입력하세요"
                        autocomplete="username"
                        on:input={handleManualInput}
                        on:keydown={(e) => e.key === 'Enter' && handleSubmit(e)}
                    />
                    {#if errors.username}
                        <span class="error-message">{errors.username}</span>
                    {/if}
                </div>

                <!-- password -->
                <div class="form-group">
                    <label for="password" class="label">
                        비밀번호 <span class="required">*</span>
                    </label>
                    <input
                        type="password"
                        id="password"
                        bind:value={formData.password}
                        class="input"
                        class:error={errors.password}
                        placeholder="비밀번호를 입력하세요"
                        autocomplete="current-password"
                        on:input={handleManualInput}
                        on:keydown={(e) => e.key === 'Enter' && handleSubmit(e)}
                    />
                    {#if errors.password}
                        <span class="error-message">{errors.password}</span>
                    {/if}
                </div>

                <div class="button-group">
                    <button
                        type="submit"
                        class="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? "로그인 중..." : "로그인"}
                    </button>
                    <button
                        type="button"
                        class="btn btn-secondary"
                        on:click={goBack}
                    >
                        취소
                    </button>
                </div>

                <div class="signup-prompt">
                    아직 회원이 아니신가요?
                    <a href="/signup" class="signup-anchor">회원가입</a>
                    {#if loginError}
                        <span class="prompt-divider">|</span>
                        <button
                            type="button"
                            class="forgot-anchor"
                            on:click={toggleResetForm}
                        >
                            {showResetForm ? "닫기" : "비밀번호 찾기"}
                        </button>
                    {/if}
                </div>

                {#if loginError && showResetForm}
                    <div class="reset-panel">
                        <label for="resetEmail" class="reset-label">등록된 이메일 입력</label>
                        <div class="reset-row">
                            <input
                                id="resetEmail"
                                type="email"
                                class="input reset-input"
                                bind:value={resetEmail}
                                placeholder="example@email.com"
                                autocomplete="email"
                            />
                            <button
                                type="button"
                                class="reset-btn"
                                on:click={handleResetPassword}
                                disabled={resetLoading}
                            >
                                {resetLoading ? "발송 중..." : "임시 비밀번호 발송"}
                            </button>
                        </div>
                        {#if resetMessage}
                            <div class="reset-success">✅ {resetMessage}</div>
                        {/if}
                        {#if resetError}
                            <div class="reset-error">⚠️ {resetError}</div>
                        {/if}
                    </div>
                {/if}

                <div class="signup-prompt">
                    테스트 계정 로그인이 필요하신가요?
                    <a href="/login/test" class="signup-anchor">테스트 로그인</a>
                </div>
            </form>
        </div>
    </main>
</div>

<style>
  .page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%);
  }

  .main {
    max-width: 600px;
    margin: 0 auto;
        padding: 48px 16px;
    }

    .form-container {
        background: #fff;
        border-radius: 14px;
        padding: 36px 32px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        animation: fadeIn 0.3s ease;
    }

    .login-form {
        display: flex;
        flex-direction: column;
        gap: 22px;
    }

    .login-error {
        padding: 14px 16px;
        background: #fff5f5;
        border: 1px solid #feb2b2;
        border-radius: 8px;
        color: #c53030;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .error-icon {
        font-size: 16px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .label {
        font-weight: 600;
        font-size: 14px;
        color: #1a365d;
    }

    .required {
        color: #e53e3e;
    }

    .input {
        padding: 14px 16px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: 15px;
        font-family: inherit;
        transition: all 0.15s;
        outline: none;
    }

    .input:focus {
        border-color: #1a365d;
        box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.1);
    }

    .input.error {
        border-color: #e53e3e;
    }

    .input.error:focus {
        box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
    }

    .error-message {
        color: #e53e3e;
        font-size: 12px;
        font-weight: 500;
        margin-top: -2px;
    }

    .button-group {
        display: flex;
        gap: 10px;
        margin-top: 4px;
    }

    .btn {
        flex: 1;
        padding: 14px 20px;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.15s;
        outline: none;
    }

    .btn-primary {
        background: linear-gradient(135deg, #1a365d 0%, #2a4a7f 100%);
        color: #fff;
    }

    .btn-primary:hover:not(:disabled) {
        background: linear-gradient(135deg, #152a49 0%, #23406b 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(26, 54, 93, 0.3);
    }

    .btn-primary:active:not(:disabled) {
        transform: translateY(0);
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-secondary {
        background: #fff;
        color: #1a365d;
        border: 1.5px solid #e2e8f0;
    }

    .btn-secondary:hover {
        background: #f7fafc;
        border-color: #cbd5e0;
    }

    .signup-prompt {
        text-align: center;
        font-size: 13px;
        color: #718096;
    }

    .quick-helper {
        margin: 6px 0 2px;
        font-size: 12px;
        color: #718096;
    }

    .quick-helper a {
        color: #1a365d;
        font-weight: 700;
        text-decoration: none;
    }

    .quick-helper a:hover {
        text-decoration: underline;
    }

    .signup-anchor {
        color: #1a365d;
        font-weight: 700;
        text-decoration: none;
        margin-left: 4px;
    }

    .prompt-divider {
        margin: 0 6px;
        color: #a0aec0;
    }

    .forgot-anchor {
        border: none;
        background: none;
        color: #1a365d;
        font-size: 13px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        text-decoration: none;
        padding: 0;
    }

    .forgot-anchor:hover {
        text-decoration: underline;
    }

    .reset-panel {
        margin-top: -8px;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .reset-label {
        font-size: 12px;
        color: #4a5568;
        font-weight: 600;
    }

    .reset-row {
        display: flex;
        gap: 8px;
    }

    .reset-input {
        flex: 1;
        padding: 11px 12px;
        font-size: 14px;
    }

    .reset-btn {
        white-space: nowrap;
        border: none;
        border-radius: 8px;
        background: #2b6cb0;
        color: #fff;
        font-weight: 700;
        font-size: 13px;
        padding: 0 14px;
        font-family: inherit;
        cursor: pointer;
    }

    .reset-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .reset-success,
    .reset-error {
        font-size: 12px;
        font-weight: 600;
    }

    .reset-success {
        color: #2f855a;
    }

    .reset-error {
        color: #c53030;
    }

    .signup-anchor:hover {
        text-decoration: underline;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(12px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 640px) {
        .form-container {
            padding: 28px 20px;
        }

        .button-group {
            flex-direction: column;
        }

        .reset-row {
            flex-direction: column;
        }

        .reset-btn {
            height: 40px;
        }
    }
</style>
