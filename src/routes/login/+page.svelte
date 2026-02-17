<script>
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";
    import { parseApiErrorResponse } from "$lib/utils/apiError.js";

    const quickAccounts = [
        { label: "파트너 - admin1", username: "admin1", role: "PARTNER" },
        { label: "파트너 - admin2", username: "admin2", role: "PARTNER" },
        { label: "파트너 - admin3", username: "admin3", role: "PARTNER" },
        { label: "회원 - user1", username: "user1", role: "MEMBER" },
        { label: "회원 - user2", username: "user2", role: "MEMBER" },
        { label: "회원 - user3", username: "user3", role: "MEMBER" },
        { label: "회원 - user4", username: "user4", role: "MEMBER" },
        { label: "회원 - user5", username: "user5", role: "MEMBER" },
        { label: "회원 - user6", username: "user6", role: "MEMBER" },
        { label: "회원 - user7", username: "user7", role: "MEMBER" },
        { label: "회원 - user8", username: "user8", role: "MEMBER" },
        { label: "회원 - user9", username: "user9", role: "MEMBER" },
        { label: "회원 - user10", username: "user10", role: "MEMBER" },
    ];

    const quickAccountsSorted = [...quickAccounts].sort((a, b) => {
        if (a.role === b.role) {
            return a.username.localeCompare(b.username);
        }

        const rolePriority = {
            PARTNER: 0,
            MEMBER: 1,
        };

        return rolePriority[a.role] - rolePriority[b.role];
    });
    const isQuickLoginEnabled = import.meta.env.DEV;
    const quickPassword = "alswl1!314";

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
    let loginErrorCode = "";
    let loading = false;
    let showFindIdModal = false;
    let showResetPasswordModal = false;
    let showResetLink = false;
    let modalLoading = false;
    let modalMessage = "";
    let modalError = "";
    let findIdEmail = "";
    let resetEmail = "";

    function validateForm() {
        let isValid = true;
        errors = { username: "", password: "" };
        loginError = "";
        loginErrorCode = "";

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
        loginErrorCode = "";

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
                const apiError = await parseApiErrorResponse(response);
                loginError = apiError.message || "로그인 중 오류가 발생했습니다. 다시 시도해주세요.";
                loginErrorCode = apiError.code || "";
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
            } else {
                goto("/");
            }
        } catch (err) {
            loginError = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
            loginErrorCode = "";
            loading = false;
        }
    }

    async function submitFindId() {
        modalLoading = true;
        modalMessage = "";
        modalError = "";

        try {
            const response = await fetch("/api/v1/auth/find-id", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: findIdEmail }),
            });

            if (!response.ok) {
                const apiError = await parseApiErrorResponse(response);
                modalError = apiError.message;
                return;
            }

            const data = await response.json();
            modalMessage = data?.message || "등록된 이메일로 아이디 안내 메일을 발송했습니다.";
        } catch (err) {
            modalError = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
        } finally {
            modalLoading = false;
        }
    }

    async function submitResetPassword() {
        modalLoading = true;
        modalMessage = "";
        modalError = "";

        try {
            const response = await fetch("/api/v1/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    email: resetEmail,
                }),
            });

            if (!response.ok) {
                const apiError = await parseApiErrorResponse(response);
                modalError = apiError.message;
                return;
            }

            const data = await response.json();
            modalMessage = data?.message || "등록된 이메일로 초기화된 비밀번호를 발송했습니다.";
        } catch (err) {
            modalError = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
        } finally {
            modalLoading = false;
        }
    }

    function openFindIdModal() {
        showFindIdModal = true;
        showResetPasswordModal = false;
        modalMessage = "";
        modalError = "";
    }

    function openResetPasswordModal() {
        showResetPasswordModal = true;
        showFindIdModal = false;
        modalMessage = "";
        modalError = "";
    }

    function closeModal() {
        showFindIdModal = false;
        showResetPasswordModal = false;
        modalMessage = "";
        modalError = "";
    }

    $: showResetLink = loginErrorCode === "LOGIN_HELP_SENT_PASSWORD";

    function goBack() {
        goto("/");
    }
</script>

<svelte:head>
    <title>로그인 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <!-- Header -->
    <SiteHeader
        title="라켓들고 LesGO! - 로그인"
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
                    <span class="link-divider">|</span>
                    <button type="button" class="inline-link" on:click={openFindIdModal}>ID 찾기</button>
                    {#if showResetLink}
                        <span class="link-divider">|</span>
                        <button
                            type="button"
                            class="inline-link"
                            on:click={openResetPasswordModal}
                        >
                            패스워드 초기화
                        </button>
                    {/if}
                </div>
            </form>
        </div>
    </main>
</div>

{#if showFindIdModal || showResetPasswordModal}
    <div
        class="modal-overlay"
        role="button"
        tabindex="0"
        on:click={closeModal}
        on:keydown={(e) => e.key === "Escape" && closeModal()}
    >
        <div
            class="simple-modal"
            role="dialog"
            aria-modal="true"
            tabindex="0"
            on:click|stopPropagation
            on:keydown|stopPropagation
        >
            <h3 class="modal-title">{showFindIdModal ? "ID 찾기" : "패스워드 초기화"}</h3>

            {#if showFindIdModal}
                <label class="label" for="find-id-email">가입 이메일</label>
                <input
                    id="find-id-email"
                    type="email"
                    class="input"
                    bind:value={findIdEmail}
                    placeholder="회원가입시 등록한 이메일을 입력하세요"
                />
            {:else}
                <label class="label" for="reset-username">아이디</label>
                <input
                    id="reset-username"
                    type="text"
                    class="input"
                    value={formData.username}
                    readonly
                />
                <label class="label" for="reset-email">가입 이메일</label>
                <input
                    id="reset-email"
                    type="email"
                    class="input"
                    bind:value={resetEmail}
                    placeholder="회원가입시 등록한 이메일을 입력하세요"
                />
            {/if}

            {#if modalError}
                <div class="login-error modal-msg">{modalError}</div>
            {/if}
            {#if modalMessage}
                <div class="modal-success modal-msg">{modalMessage}</div>
            {/if}

            <div class="button-group modal-actions">
                <button
                    type="button"
                    class="btn btn-primary"
                    on:click={showFindIdModal ? submitFindId : submitResetPassword}
                    disabled={modalLoading}
                >
                    {modalLoading ? "처리 중..." : "메일 발송"}
                </button>
                <button type="button" class="btn btn-secondary" on:click={closeModal}>닫기</button>
            </div>
        </div>
    </div>
{/if}

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

    .signup-anchor:hover {
        text-decoration: underline;
    }

    .link-divider {
        margin: 0 6px;
        color: #a0aec0;
    }

    .inline-link {
        border: 0;
        background: transparent;
        color: #1a365d;
        font-weight: 700;
        cursor: pointer;
        padding: 0;
        font-size: 13px;
    }

    .inline-link:hover {
        text-decoration: underline;
    }

    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 16px;
    }

    .simple-modal {
        width: min(480px, 100%);
        background: #fff;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 18px 32px rgba(15, 23, 42, 0.24);
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .modal-title {
        margin: 0 0 6px 0;
        color: #1a365d;
        font-size: 18px;
        font-weight: 800;
    }

    .modal-msg {
        margin-top: 2px;
    }

    .modal-success {
        padding: 14px 16px;
        border-radius: 8px;
        border: 1px solid #9ae6b4;
        background: #f0fff4;
        color: #276749;
        font-size: 14px;
        font-weight: 600;
    }

    .modal-actions {
        margin-top: 8px;
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
    }
</style>
