<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.js";
    import logo from "$lib/assets/main_logo.png";

    let profile = null;
    let formData = {};
    let loading = true;
    let saving = false;
    let error = "";
    let successMsg = "";

    onMount(() => {
        auth.refresh();
        const user = getUser();
        if (!user || user.accountType !== "PARTNER") {
            goto("/login");
            return;
        }
        fetchProfile();
    });

    function getUser() {
        let user = null;
        const unsub = auth.subscribe((v) => (user = v));
        unsub();
        return user;
    }

    function getToken() {
        return getUser()?.accessToken;
    }

    async function fetchProfile() {
        loading = true;
        error = "";
        try {
            const res = await fetch("/api/v1/partner-manage/me", {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (res.status === 401 || res.status === 403) {
                auth.logout();
                goto("/login");
                return;
            }
            if (!res.ok) throw new Error("조회 실패");

            profile = await res.json();
            formData = {
                businessPartner: profile.businessPartner || "",
                owner: profile.owner || "",
                phoneNumber: profile.phoneNumber || "",
                partnerAddress: profile.partnerAddress || "",
                partnerEmail: profile.partnerEmail || "",
                partnerAccount: profile.partnerAccount || "",
                partnerBank: profile.partnerBank || "",
                howToPay: profile.howToPay || "",
            };
        } catch (err) {
            error = "사업장 정보를 불러올 수 없습니다.";
        } finally {
            loading = false;
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        if (
            !formData.businessPartner.trim() ||
            !formData.owner.trim() ||
            !formData.phoneNumber.trim() ||
            !formData.partnerAddress.trim() ||
            !formData.partnerEmail.trim()
        ) {
            error = "필수 항목을 모두 입력해주세요.";
            return;
        }

        saving = true;
        error = "";
        successMsg = "";
        try {
            const res = await fetch("/api/v1/partner-manage/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.message || "수정 실패");
            }

            profile = await res.json();

            // auth store 이름 동기화
            const user = getUser();
            if (user) {
                auth.login({ ...user, name: profile.owner });
            }

            successMsg = "사업장 정보가 수정되었습니다.";
            setTimeout(() => (successMsg = ""), 3000);
        } catch (err) {
            error = err.message || "수정 중 오류가 발생했습니다.";
        } finally {
            saving = false;
        }
    }

    function goBack() {
        goto("/partner");
    }

    function handleLogout() {
        auth.logout();
        goto("/login");
    }

    function levelLabel(level) {
        return level === "1" ? "승인완료" : "승인요청";
    }
</script>

<svelte:head>
    <title>사업장정보 수정 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <header class="pb-header header">
        <div class="pb-header-inner header-inner">
            <div class="header-content">
                <a href="/partner" class="pb-brand-link brand-link">
                    <img src={logo} alt="LESGO PiCKLE" class="pb-brand-logo brand-logo" />
                    <h3 class="pb-brand-title brand-title">사업장정보 수정</h3>
                </a>
            </div>
            <div class="pb-nav nav-links">
                <span class="pb-user-pill user-greeting">
                    <span class="user-icon">🏢</span>
                    <span class="user-name">{$auth?.name || $auth?.username || '사용자'}</span>님
                </span>
                <a
                    href="/partner/court"
                    class={`pb-btn-ghost nav-link court-link ${$page.url.pathname === '/partner/court' || $page.url.pathname.startsWith('/partner/court/') ? 'is-active' : ''}`}
                    >코트관리</a
                >
                <a
                    href="/partner/courtReservation"
                    class={`pb-btn-ghost nav-link court-link ${$page.url.pathname === '/partner/courtReservation' ? 'is-active' : ''}`}
                    >예약설정</a
                >
                <a
                    href="/partner/profile"
                    class={`pb-btn-ghost nav-link profile-link ${$page.url.pathname === '/partner/profile' ? 'is-active' : ''}`}
                    >사업장정보</a
                >
                <button class="pb-btn-ghost nav-link logout-btn" on:click={handleLogout}
                    >로그아웃</button
                >
            </div>
        </div>
    </header>

    <main class="main">
        <button class="back-btn" on:click={goBack}>← 메인으로</button>

        {#if loading}
            <div class="loading">불러오는 중...</div>
        {:else if error && !profile}
            <div class="error-msg">⚠️ {error}</div>
        {:else if profile}
            <div class="form-container">
                <!-- 상태 배너 -->
                <div class="info-banner">
                    <div class="info-item">
                        <span class="info-label">아이디</span>
                        <span class="info-value">{profile.username}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">승인상태</span>
                        <span
                            class="badge {profile.partnerLevel === '1'
                                ? 'badge-approved'
                                : 'badge-pending'}"
                        >
                            {levelLabel(profile.partnerLevel)}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">등록일</span>
                        <span class="info-value"
                            >{profile.registDate || "-"}</span
                        >
                    </div>
                </div>

                {#if successMsg}
                    <div class="success-msg">✅ {successMsg}</div>
                {/if}
                {#if error && profile}
                    <div class="error-msg">⚠️ {error}</div>
                {/if}

                <form class="edit-form" on:submit={handleSave}>
                    <div class="field-group">
                        <label for="businessPartner" class="field-label"
                            >사업장명 <span class="required">*</span></label
                        >
                        <input
                            id="businessPartner"
                            type="text"
                            class="field-input"
                            bind:value={formData.businessPartner}
                            required
                        />
                    </div>

                    <div class="field-group">
                        <label for="owner" class="field-label"
                            >대표자 <span class="required">*</span></label
                        >
                        <input
                            id="owner"
                            type="text"
                            class="field-input"
                            bind:value={formData.owner}
                            required
                        />
                    </div>

                    <div class="field-group">
                        <label for="phoneNumber" class="field-label"
                            >전화번호 <span class="required">*</span></label
                        >
                        <input
                            id="phoneNumber"
                            type="tel"
                            class="field-input"
                            bind:value={formData.phoneNumber}
                            required
                        />
                    </div>

                    <div class="field-group">
                        <label for="partnerAddress" class="field-label"
                            >주소 <span class="required">*</span></label
                        >
                        <input
                            id="partnerAddress"
                            type="text"
                            class="field-input"
                            bind:value={formData.partnerAddress}
                            required
                        />
                    </div>

                    <div class="field-group">
                        <label for="partnerEmail" class="field-label"
                            >이메일 <span class="required">*</span></label
                        >
                        <input
                            id="partnerEmail"
                            type="email"
                            class="field-input"
                            bind:value={formData.partnerEmail}
                            required
                        />
                    </div>

                    <div class="field-group">
                        <label for="partnerBank" class="field-label">은행</label
                        >
                        <input
                            id="partnerBank"
                            type="text"
                            class="field-input"
                            bind:value={formData.partnerBank}
                        />
                    </div>

                    <div class="field-group">
                        <label for="partnerAccount" class="field-label"
                            >계좌번호</label
                        >
                        <input
                            id="partnerAccount"
                            type="text"
                            class="field-input"
                            bind:value={formData.partnerAccount}
                        />
                    </div>

                    <div class="field-group">
                        <label for="howToPay" class="field-label"
                            >결제방식</label
                        >
                        <select
                            id="howToPay"
                            class="field-input"
                            bind:value={formData.howToPay}
                        >
                            <option value="">선택하세요</option>
                            <option value="0">예약건별 수수료</option>
                            <option value="1">월 구독</option>
                            <option value="2">년 구독</option>
                        </select>
                    </div>

                    <div class="btn-row">
                        <button
                            type="button"
                            class="cancel-btn"
                            on:click={goBack}>취소</button
                        >
                        <button
                            type="submit"
                            class="save-btn"
                            disabled={saving}
                        >
                            {saving ? "저장 중..." : "저장"}
                        </button>
                    </div>
                </form>
            </div>
        {/if}
    </main>
</div>

<style>
    .page {
        min-height: 100vh;
        background: #f7fafc;
    }
    .header { }
    .header-inner { }
    .header-content { }
    .brand-link { }
    .brand-logo { }
    .brand-title { }
    .header-content { }
    .user-greeting {
        white-space: nowrap;
    }
    .user-icon {
        font-size: 16px;
    }
    .user-name {
        color: #90cdf4;
        font-weight: 700;
    }
    .nav-link {
        padding: 8px 14px;
        border-radius: 8px;
        color: #2d3748;
        background: rgba(255, 255, 255, 0.16);
        text-decoration: none;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        transition: all 0.15s;
        border: 1px solid transparent;
    }
    .nav-link:hover {
        background: rgba(255, 255, 255, 0.3);
        color: #1a365d;
        border-color: rgba(255, 255, 255, 0.45);
        transform: translateY(-1px);
    }
    .nav-link.is-active {
        color: #1a365d;
        background: rgba(255, 255, 255, 0.34);
        border-color: rgba(255, 255, 255, 0.6);
        box-shadow: 0 8px 18px rgba(26, 54, 93, 0.14);
    }
    .court-link {
        color: #1a365d;
    }
    .profile-link {
        background: rgba(72, 187, 120, 0.2);
        border: 1.5px solid rgba(72, 187, 120, 0.4);
    }
    .profile-link:hover {
        background: rgba(72, 187, 120, 0.35);
        border-color: rgba(72, 187, 120, 0.6);
    }
    .logout-btn {
        font-family: inherit;
    }
    .nav-links { }
    .logout-btn { }

    .main {
        max-width: 700px;
        margin: 0 auto;
        padding: 24px 16px;
    }
    .back-btn {
        background: none;
        border: none;
        color: #2b6cb0;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        padding: 4px 0;
        margin-bottom: 16px;
        transition: color 0.15s;
    }
    .back-btn:hover {
        color: #1a365d;
    }

    .form-container {
        background: #fff;
        border-radius: 14px;
        padding: 28px 28px 32px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    /* Info Banner */
    .info-banner {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        padding: 16px 18px;
        background: #edf2f7;
        border-radius: 10px;
        margin-bottom: 24px;
    }
    .info-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .info-label {
        font-size: 12px;
        font-weight: 700;
        color: #718096;
    }
    .info-value {
        font-size: 14px;
        font-weight: 600;
        color: #2d3748;
    }
    .badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
    }
    .badge-approved {
        background: #c6f6d5;
        color: #22543d;
    }
    .badge-pending {
        background: #fefcbf;
        color: #975a16;
    }

    /* Messages */
    .success-msg {
        padding: 12px 16px;
        background: #f0fff4;
        border: 1px solid #c6f6d5;
        border-radius: 8px;
        color: #22543d;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 16px;
    }
    .error-msg {
        padding: 12px 16px;
        background: #fff5f5;
        border: 1px solid #feb2b2;
        border-radius: 8px;
        color: #c53030;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 16px;
    }

    /* Form */
    .edit-form {
        display: flex;
        flex-direction: column;
        gap: 18px;
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
    .required {
        color: #e53e3e;
    }
    .field-input {
        padding: 10px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        outline: none;
        transition:
            border-color 0.15s,
            box-shadow 0.15s;
        background: #fff;
    }
    .field-input:focus {
        border-color: #4299e1;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
    }

    /* Buttons */
    .btn-row {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 8px;
    }
    .cancel-btn {
        padding: 12px 28px;
        background: #edf2f7;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        color: #4a5568;
        transition: background 0.15s;
    }
    .cancel-btn:hover {
        background: #e2e8f0;
    }
    .save-btn {
        padding: 12px 32px;
        background: #2b6cb0;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.15s;
    }
    .save-btn:hover:not(:disabled) {
        background: #2c5282;
        transform: translateY(-1px);
    }
    .save-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .loading {
        text-align: center;
        padding: 48px 16px;
        color: #718096;
        font-size: 15px;
    }
</style>
