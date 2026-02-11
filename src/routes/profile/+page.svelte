<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
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
        if (!user) {
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
            const res = await fetch("/api/v1/members/me", {
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
                name: profile.name || "",
                phoneNumber: profile.phoneNumber || "",
                nicName: profile.nicName || "",
                email: profile.email || "",
                sex: profile.sex || "",
                ageRange: profile.ageRange || "",
                location: profile.location || "",
                circleName: profile.circleName || "",
                gameLevel: profile.gameLevel || "입문",
                duprPoint: profile.duprPoint || "",
            };
        } catch (err) {
            error = "회원정보를 불러올 수 없습니다.";
        } finally {
            loading = false;
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!formData.name.trim() || !formData.phoneNumber.trim()) {
            error = "이름과 전화번호는 필수입니다.";
            return;
        }

        saving = true;
        error = "";
        successMsg = "";
        try {
            const res = await fetch("/api/v1/members/me", {
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
                auth.login({ ...user, name: profile.name });
            }

            successMsg = "회원정보가 수정되었습니다.";
            setTimeout(() => (successMsg = ""), 3000);
        } catch (err) {
            error = err.message || "수정 중 오류가 발생했습니다.";
        } finally {
            saving = false;
        }
    }

    function goHome() {
        goto("/");
    }

    function handleLogout() {
        auth.logout();
        goto("/login");
    }

    const gameLevels = ["입문", "초급", "중급", "중상급", "상급"];
</script>

<svelte:head>
    <title>회원정보 수정 - LESGO PiCKLE</title>
</svelte:head>

<div class="page">
    <header class="header">
        <div class="header-inner">
            <div class="header-content">
                <a href="/" class="brand-link">
                    <img src={logo} alt="LESGO PiCKLE" class="brand-logo" />
                    <h3 class="brand-title">회원정보 수정</h3>
                </a>
            </div>
            <div class="nav-links">
                <button class="nav-link logout-btn" on:click={handleLogout}
                    >로그아웃</button
                >
            </div>
        </div>
    </header>

    <main class="main">
        <button class="back-btn" on:click={goHome}>← 메인으로</button>

        {#if loading}
            <div class="loading">불러오는 중...</div>
        {:else if error && !profile}
            <div class="error-msg">⚠️ {error}</div>
        {:else if profile}
            <div class="form-container">
                <!-- 회원 상태 정보 -->
                <div class="info-banner">
                    <div class="info-item">
                        <span class="info-label">아이디</span>
                        <span class="info-value">{profile.username}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">등급</span>
                        <span class="badge">{profile.memberLevel}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">가입일</span>
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
                    <div class="form-grid">
                        <div class="field-group">
                            <label for="name" class="field-label"
                                >이름 <span class="required">*</span></label
                            >
                            <input
                                id="name"
                                type="text"
                                class="field-input"
                                bind:value={formData.name}
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
                            <label for="nicName" class="field-label"
                                >닉네임</label
                            >
                            <input
                                id="nicName"
                                type="text"
                                class="field-input"
                                bind:value={formData.nicName}
                            />
                        </div>

                        <div class="field-group">
                            <label for="email" class="field-label">이메일</label
                            >
                            <input
                                id="email"
                                type="email"
                                class="field-input"
                                bind:value={formData.email}
                            />
                        </div>

                        <div class="field-group">
                            <label for="sex" class="field-label">성별</label>
                            <select
                                id="sex"
                                class="field-input"
                                bind:value={formData.sex}
                            >
                                <option value="">선택</option>
                                <option value="남">남</option>
                                <option value="여">여</option>
                            </select>
                        </div>

                        <div class="field-group">
                            <label for="ageRange" class="field-label"
                                >연령대</label
                            >
                            <select
                                id="ageRange"
                                class="field-input"
                                bind:value={formData.ageRange}
                            >
                                <option value="">선택</option>
                                <option value="10대">10대</option>
                                <option value="20대">20대</option>
                                <option value="30대">30대</option>
                                <option value="40대">40대</option>
                                <option value="50대">50대</option>
                                <option value="60대 이상">60대 이상</option>
                            </select>
                        </div>

                        <div class="field-group">
                            <label for="location" class="field-label"
                                >지역</label
                            >
                            <input
                                id="location"
                                type="text"
                                class="field-input"
                                bind:value={formData.location}
                            />
                        </div>

                        <div class="field-group">
                            <label for="circleName" class="field-label"
                                >동호회</label
                            >
                            <input
                                id="circleName"
                                type="text"
                                class="field-input"
                                bind:value={formData.circleName}
                            />
                        </div>

                        <div class="field-group">
                            <label for="gameLevel" class="field-label"
                                >실력</label
                            >
                            <select
                                id="gameLevel"
                                class="field-input"
                                bind:value={formData.gameLevel}
                            >
                                {#each gameLevels as level}
                                    <option value={level}>{level}</option>
                                {/each}
                            </select>
                        </div>

                        <div class="field-group">
                            <label for="duprPoint" class="field-label"
                                >DUPR 점수</label
                            >
                            <input
                                id="duprPoint"
                                type="text"
                                class="field-input"
                                bind:value={formData.duprPoint}
                                placeholder="예: 3.5"
                            />
                        </div>
                    </div>

                    <div class="btn-row">
                        <button
                            type="button"
                            class="cancel-btn"
                            on:click={goHome}>취소</button
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
    .header {
        background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
        color: #fff;
        padding: 16px 20px;
    }
    .header-inner {
        max-width: 700px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
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
    .nav-links {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .nav-link {
        padding: 8px 18px;
        border-radius: 8px;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        transition: all 0.15s;
        text-decoration: none;
    }
    .logout-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        font-family: inherit;
    }
    .logout-btn:hover {
        background: rgba(229, 62, 62, 0.3);
        border-color: rgba(229, 62, 62, 0.5);
        transform: translateY(-1px);
    }

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
        background: #c6f6d5;
        color: #22543d;
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

    /* Form Grid */
    .edit-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
    }
    @media (max-width: 600px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
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
