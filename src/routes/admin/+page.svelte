<script>
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth.js";
    import logo from "$lib/assets/main_logo.png";

    let formData = {
        username: "",
        password: "",
    };

    let errors = { username: "", password: "" };
    let loginError = "";
    let loading = false;

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

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateForm()) return;

        loading = true;
        loginError = "";

        try {
            const response = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (response.status === 401) {
                    loginError = "아이디 또는 비밀번호가 일치하지 않습니다.";
                } else {
                    loginError = errorData?.message || "로그인에 실패했습니다.";
                }
                loading = false;
                return;
            }

            const data = await response.json();

            // ADMIN 계정인지 확인
            if (data.accountType !== "ADMIN") {
                loginError = "관리자 계정만 접근할 수 있습니다.";
                loading = false;
                return;
            }

            auth.login(data);
            goto("/admin/partners");
        } catch (err) {
            loginError = "서버에 연결할 수 없습니다.";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>관리자 로그인 - LESGO PiCKLE</title>
</svelte:head>

<div class="page">
    <header class="header">
        <div class="header-inner">
            <div class="header-content">
                <a href="/admin" class="brand-link">
                    <img src={logo} alt="LESGO PiCKLE" class="brand-logo" />
                    <h3 class="brand-title">시스템 관리자</h3>
                </a>
            </div>
        </div>
    </header>

    <main class="main">
        <div class="form-container">
            <form class="login-form" on:submit={handleSubmit}>
                {#if loginError}
                    <div class="login-error">
                        <span class="error-icon">⚠️</span>
                        {loginError}
                    </div>
                {/if}

                <div class="field-group">
                    <label for="username" class="field-label">아이디</label>
                    <input
                        id="username"
                        type="text"
                        class="field-input"
                        class:error={errors.username}
                        bind:value={formData.username}
                        placeholder="관리자 아이디"
                    />
                    {#if errors.username}
                        <span class="field-error">{errors.username}</span>
                    {/if}
                </div>

                <div class="field-group">
                    <label for="password" class="field-label">비밀번호</label>
                    <input
                        id="password"
                        type="password"
                        class="field-input"
                        class:error={errors.password}
                        bind:value={formData.password}
                        placeholder="비밀번호"
                    />
                    {#if errors.password}
                        <span class="field-error">{errors.password}</span>
                    {/if}
                </div>

                <button type="submit" class="submit-btn" disabled={loading}>
                    {#if loading}
                        로그인 중...
                    {:else}
                        관리자 로그인
                    {/if}
                </button>
            </form>
        </div>
    </main>
</div>

<style>
    .page {
        min-height: 100vh;
        background: #f7fafc;
    }
    .header {
        background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
        color: #fff;
        padding: 16px 20px;
    }
    .header-inner {
        max-width: 600px;
        margin: 0 auto;
    }
    .header-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .brand-link {
        display: flex;
        align-items: center;
        text-decoration: none;
        gap: 12px;
        transition: opacity 0.2s;
    }
    .brand-link:hover {
        opacity: 0.8;
    }
    .brand-logo {
        height: 70px;
        width: auto;
        display: block;
    }
    .brand-title {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.5px;
        white-space: nowrap;
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
    .field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .field-label {
        font-size: 13px;
        font-weight: 700;
        color: #2d3748;
    }
    .field-input {
        padding: 12px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: 15px;
        font-family: inherit;
        outline: none;
        transition:
            border-color 0.15s,
            box-shadow 0.15s;
    }
    .field-input:focus {
        border-color: #4299e1;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
    }
    .field-input.error {
        border-color: #fc8181;
    }
    .field-error {
        font-size: 12px;
        color: #e53e3e;
        font-weight: 500;
    }
    .submit-btn {
        padding: 14px;
        background: linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%);
        color: #fff;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s;
    }
    .submit-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(26, 54, 93, 0.3);
    }
    .submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>
