<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";

    let partner = null;
    let formData = {};
    let loading = true;
    let saving = false;
    let error = "";
    let successMsg = "";

    $: partnerId = $page.params.id;

    onMount(() => {
        auth.refresh();
        const user = getUser();
        if (!user || user.accountType !== "ADMIN") {
            goto("/admin");
            return;
        }
        fetchPartner();
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

    async function fetchPartner() {
        loading = true;
        error = "";
        try {
            const res = await fetch(`/api/v1/admin/partners/${partnerId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            if (res.status === 401 || res.status === 403) {
                auth.logout();
                goto("/admin");
                return;
            }
            if (!res.ok) throw new Error("조회 실패");

            partner = await res.json();
            formData = {
                businessPartner: partner.businessPartner || "",
                owner: partner.owner || "",
                phoneNumber: partner.phoneNumber || "",
                partnerAddress: partner.partnerAddress || "",
                partnerEmail: partner.partnerEmail || "",
                partnerAccount: partner.partnerAccount || "",
                partnerBank: partner.partnerBank || "",
                howToPay: partner.howToPay || "",
            };
        } catch (err) {
            error = "사업장 정보를 불러올 수 없습니다.";
        } finally {
            loading = false;
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        saving = true;
        error = "";
        successMsg = "";
        try {
            const res = await fetch(`/api/v1/admin/partners/${partnerId}`, {
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

            partner = await res.json();
            successMsg = "저장되었습니다.";
            setTimeout(() => (successMsg = ""), 3000);
        } catch (err) {
            error = err.message || "수정 중 오류가 발생했습니다.";
        } finally {
            saving = false;
        }
    }

    async function handleApprove() {
        if (!confirm("이 사업장을 승인하시겠습니까?")) return;

        saving = true;
        error = "";
        successMsg = "";
        try {
            const res = await fetch(
                `/api/v1/admin/partners/${partnerId}/approve`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${getToken()}` },
                },
            );

            if (!res.ok) throw new Error("승인 실패");

            partner = await res.json();
            successMsg = "승인 완료되었습니다.";
            setTimeout(() => (successMsg = ""), 3000);
        } catch (err) {
            error = "승인 처리 중 오류가 발생했습니다.";
        } finally {
            saving = false;
        }
    }

    function goBack() {
        goto("/admin/partners");
    }

    function handleLogout() {
        auth.logout();
        goto("/admin");
    }
</script>

<svelte:head>
    <title>사업장 상세 - LESGO PiCKLE</title>
</svelte:head>

<div class="pb-shell page">
    <SiteHeader title="사업장관리" brandHref="/admin/partners" hasNav={true}>
        <button class="pb-btn-ghost nav-link logout-btn" on:click={handleLogout}>
          로그아웃
        </button>
    </SiteHeader>

    <main class="main">
        <button class="back-btn" on:click={goBack}>← 목록으로</button>

        {#if loading}
            <div class="loading">불러오는 중...</div>
        {:else if error && !partner}
            <div class="error-msg">⚠️ {error}</div>
        {:else if partner}
            <div class="form-container">
                <!-- 승인 상태 배너 -->
                <div
                    class="status-banner {partner.partnerLevel === '1'
                        ? 'approved'
                        : 'pending'}"
                >
                    <span class="status-label">
                        {partner.partnerLevel === "1"
                            ? "✅ 승인완료"
                            : "⏳ 승인요청"}
                    </span>
                    {#if partner.partnerLevel !== "1"}
                        <button
                            class="approve-btn"
                            on:click={handleApprove}
                            disabled={saving}
                        >
                            승인하기
                        </button>
                    {/if}
                </div>

                {#if successMsg}
                    <div class="success-msg">✅ {successMsg}</div>
                {/if}
                {#if error && partner}
                    <div class="error-msg">⚠️ {error}</div>
                {/if}

                <form class="detail-form" on:submit={handleSave}>
                    <div class="info-row">
                        <span class="info-label">등록일</span>
                        <span class="info-value"
                            >{partner.registDate || "-"}</span
                        >
                    </div>

                    <div class="field-group">
                        <label for="businessPartner" class="field-label"
                            >사업장명</label
                        >
                        <input
                            id="businessPartner"
                            type="text"
                            class="field-input"
                            bind:value={formData.businessPartner}
                        />
                    </div>

                    <div class="field-group">
                        <label for="owner" class="field-label">대표자</label>
                        <input
                            id="owner"
                            type="text"
                            class="field-input"
                            bind:value={formData.owner}
                        />
                    </div>

                    <div class="field-group">
                        <label for="phoneNumber" class="field-label"
                            >전화번호</label
                        >
                        <input
                            id="phoneNumber"
                            type="text"
                            class="field-input"
                            bind:value={formData.phoneNumber}
                        />
                    </div>

                    <div class="field-group">
                        <label for="partnerAddress" class="field-label"
                            >주소</label
                        >
                        <input
                            id="partnerAddress"
                            type="text"
                            class="field-input"
                            bind:value={formData.partnerAddress}
                        />
                    </div>

                    <div class="field-group">
                        <label for="partnerEmail" class="field-label"
                            >이메일</label
                        >
                        <input
                            id="partnerEmail"
                            type="email"
                            class="field-input"
                            bind:value={formData.partnerEmail}
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
                        <input
                            id="howToPay"
                            type="text"
                            class="field-input"
                            bind:value={formData.howToPay}
                        />
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
    .nav-link { }

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

    /* Status Banner */
    .status-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-radius: 10px;
        margin-bottom: 24px;
    }
    .status-banner.approved {
        background: #f0fff4;
        border: 1.5px solid #c6f6d5;
    }
    .status-banner.pending {
        background: #fffff0;
        border: 1.5px solid #fefcbf;
    }
    .status-label {
        font-size: 15px;
        font-weight: 700;
        color: #2d3748;
    }
    .approve-btn {
        padding: 8px 20px;
        background: #38a169;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.15s;
    }
    .approve-btn:hover:not(:disabled) {
        background: #2f855a;
        transform: translateY(-1px);
    }
    .approve-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
    .detail-form {
        display: flex;
        flex-direction: column;
        gap: 18px;
    }
    .info-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid #edf2f7;
    }
    .info-label {
        font-size: 13px;
        font-weight: 700;
        color: #718096;
        min-width: 60px;
    }
    .info-value {
        font-size: 14px;
        color: #2d3748;
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
        padding: 10px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
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
