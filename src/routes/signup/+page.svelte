<script>
    import { goto } from "$app/navigation";
    import { auth } from "$lib/stores/auth.js";
    import { buildApiUrl } from "$lib/api.js";
    import SiteHeader from "$lib/components/SiteHeader.svelte";
    import Modal from "$lib/components/Modal.svelte";
    import { TERMS_CONTENT } from "$lib/data/terms.js";

    // 회원 유형: MEMBER(일반유저) / CIRCLE(동호회) / PARTNER(사설클럽)
    let accountType = "MEMBER";

    // 통합 폼 데이터 (모든 필드 포함)
    let formData = {
        // 공통
        username: "",
        password: "",
        confirmPassword: "",
        name: "",
        phoneNumber: "",
        // 일반유저 전용
        nicName: "",
        ageRange: "",
        location: "",
        circleName: "",
        gameLevel: "입문",
        duprPoint: "",
        email: "",
        sex: "",
        // 사업장 전용
        businessPartner: "",
        owner: "",
        partnerAddress: "",
        partnerEmail: "",
        partnerAccount: "",
        partnerBank: "",
        howToPay: "",
    };

    let errors = {};
    let submitted = false;
    let showConfirmModal = false;
    let signupError = "";

    let usernameCheck = {
        status: "idle", // idle | checking | available | taken | invalid | error
        checkedValue: "",
        message: "",
    };

    let agreements = {
        all: false,
        service: false,
        privacy: false,
        marketing: false,
    };

    let termsModalOpen = false;
    let termsModalKey = "service";

    function openTerms(key) {
        termsModalKey = key;
        termsModalOpen = true;
    }

    function toggleAllAgreements() {
        const next = !agreements.all;
        agreements = {
            all: next,
            service: next,
            privacy: next,
            marketing: next,
        };
    }

    function toggleAgreement(key) {
        const next = { ...agreements, [key]: !agreements[key] };
        next.all = next.service && next.privacy && next.marketing;
        agreements = next;
    }

    function switchType(type) {
        accountType = type;
        errors = {};
        signupError = "";
    }

    function resetUsernameCheck(nextMessage = "") {
        usernameCheck = {
            status: "idle",
            checkedValue: "",
            message: nextMessage,
        };
    }

    function handleUsernameInput() {
        const current = formData.username.trim();
        if (usernameCheck.checkedValue && usernameCheck.checkedValue !== current) {
            resetUsernameCheck(
                "아이디를 변경하셨습니다. 중복체크를 다시 진행해주세요."
            );
        }
    }

    async function checkUsernameDuplicate() {
        const value = formData.username.trim();
        signupError = "";

        if (!value) {
            errors = { ...errors, username: "사용자 ID를 입력해주세요" };
            usernameCheck = {
                status: "invalid",
                checkedValue: "",
                message: "아이디를 입력한 뒤 중복체크를 눌러주세요.",
            };
            return;
        }

        if (value.length < 4) {
            errors = { ...errors, username: "사용자 ID는 4자 이상이어야 합니다" };
            usernameCheck = {
                status: "invalid",
                checkedValue: "",
                message: "아이디 형식을 확인해주세요.",
            };
            return;
        }

        if (value.length > 20) {
            errors = { ...errors, username: "사용자 ID는 20자 이하여야 합니다" };
            usernameCheck = {
                status: "invalid",
                checkedValue: "",
                message: "아이디 형식을 확인해주세요.",
            };
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            errors = {
                ...errors,
                username: "사용자 ID는 영문, 숫자, 언더스코어만 사용 가능합니다",
            };
            usernameCheck = {
                status: "invalid",
                checkedValue: "",
                message: "아이디 형식을 확인해주세요.",
            };
            return;
        }

        if (errors.username) {
            const next = { ...errors };
            delete next.username;
            errors = next;
        }

        usernameCheck = {
            status: "checking",
            checkedValue: "",
            message: "확인 중...",
        };

        try {
            const response = await fetch(
                buildApiUrl(
                    `/api/v1/auth/username/check?username=${encodeURIComponent(value)}`
                ),
                { method: "GET" }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const validationMsg =
                    errorData?.errors?.username ||
                    errorData?.message ||
                    "아이디를 다시 확인해주세요.";
                usernameCheck = {
                    status: "error",
                    checkedValue: "",
                    message: validationMsg,
                };
                return;
            }

            const data = await response.json();
            usernameCheck = {
                status: data.available ? "available" : "taken",
                checkedValue: value,
                message:
                    data.message ||
                    (data.available
                        ? "사용 가능한 아이디입니다"
                        : "이미 사용 중인 아이디입니다"),
            };
        } catch (err) {
            usernameCheck = {
                status: "error",
                checkedValue: "",
                message: "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.",
            };
        }
    }

    function validateForm() {
        let isValid = true;
        errors = {};

        // 공통 검증
        if (!formData.username.trim()) {
            errors.username = "사용자 ID를 입력해주세요";
            isValid = false;
        } else if (formData.username.length < 4) {
            errors.username = "사용자 ID는 4자 이상이어야 합니다";
            isValid = false;
        } else if (formData.username.length > 20) {
            errors.username = "사용자 ID는 20자 이하여야 합니다";
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            errors.username =
                "사용자 ID는 영문, 숫자, 언더스코어만 사용 가능합니다";
            isValid = false;
        }

        const currentUsername = formData.username.trim();
        const usernameCheckOk =
            usernameCheck.status === "available" &&
            usernameCheck.checkedValue === currentUsername;

        if (currentUsername && !errors.username && !usernameCheckOk) {
            errors.usernameCheck =
                usernameCheck.status === "taken"
                    ? "이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요."
                    : "아이디 중복체크를 진행해주세요.";
            isValid = false;
        }

        if (!formData.password) {
            errors.password = "비밀번호를 입력해주세요";
            isValid = false;
        } else if (formData.password.length < 6) {
            errors.password = "비밀번호는 6자 이상이어야 합니다";
            isValid = false;
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = "비밀번호 확인을 입력해주세요";
            isValid = false;
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "비밀번호가 일치하지 않습니다";
            isValid = false;
        }

        if (!formData.name.trim()) {
            errors.name = "성명을 입력해주세요";
            isValid = false;
        } else if (formData.name.length < 2) {
            errors.name = "성명은 2자 이상이어야 합니다";
            isValid = false;
        }

        if (!formData.phoneNumber.trim()) {
            errors.phoneNumber = "전화번호를 입력해주세요";
            isValid = false;
        }

        // 일반유저 전용 검증
        if (accountType === "MEMBER") {
            if (!formData.gameLevel) {
                errors.gameLevel = "게임등급을 선택해주세요";
                isValid = false;
            }
            if (!formData.sex) {
                errors.sex = "성별을 선택해주세요";
                isValid = false;
            }
        }

        // 약관 검증 (일반/파트너 공통)
        if (!agreements.service || !agreements.privacy) {
            errors.agreements = "필수 약관에 동의해주세요";
            isValid = false;
        }

        // 사설클럽 전용 검증
        if (accountType === "PARTNER" || accountType === "CIRCLE") {
            if (!formData.businessPartner.trim()) {
                errors.businessPartner =
                    accountType === "CIRCLE"
                        ? "동호회명을 입력해주세요"
                        : "사설클럽명을 입력해주세요";
                isValid = false;
            }
            if (!formData.owner.trim()) {
                errors.owner =
                    accountType === "CIRCLE"
                        ? "회장명을 입력해주세요"
                        : "대표자명을 입력해주세요";
                isValid = false;
            }
            if (!formData.partnerAddress.trim()) {
                errors.partnerAddress =
                    accountType === "CIRCLE"
                        ? "활동지역을 입력해주세요"
                        : "사설클럽 주소를 입력해주세요";
                isValid = false;
            }
            if (!formData.partnerEmail.trim()) {
                errors.partnerEmail = "이메일을 입력해주세요";
                isValid = false;
            }
        }

        return isValid;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (validateForm()) {
            showConfirmModal = true;
        }
    }

    async function confirmSignup() {
        submitted = true;
        signupError = "";

        let url, payload;

        if (accountType === "MEMBER") {
            url = "/api/v1/auth/signup";
            payload = {
                username: formData.username,
                password: formData.password,
                name: formData.name,
                phoneNumber: formData.phoneNumber,
                nicName: formData.nicName || null,
                ageRange: formData.ageRange || null,
                location: formData.location || null,
                circleName: formData.circleName || null,
                gameLevel: formData.gameLevel,
                duprPoint: formData.duprPoint || null,
                email: formData.email || null,
                sex: formData.sex,
                agreeService: agreements.service,
                agreePrivacy: agreements.privacy,
                agreeMarketing: agreements.marketing,
                agreeAll: agreements.all,
            };
        } else if (accountType === "PARTNER") {
            url = "/api/v1/auth/signup/partner";
            payload = {
                username: formData.username,
                password: formData.password,
                name: formData.name,
                businessPartner: formData.businessPartner,
                owner: formData.owner,
                phoneNumber: formData.phoneNumber,
                partnerAddress: formData.partnerAddress,
                partnerEmail: formData.partnerEmail,
                partnerAccount: formData.partnerAccount || null,
                partnerBank: formData.partnerBank || null,
                howToPay: formData.howToPay || null,
                agreeService: agreements.service,
                agreePrivacy: agreements.privacy,
                agreeMarketing: agreements.marketing,
                agreeAll: agreements.all,
            };
        } else {
            url = "/api/v1/auth/signup/circle";
            payload = {
                username: formData.username,
                password: formData.password,
                name: formData.name,
                businessPartner: formData.businessPartner,
                owner: formData.owner,
                phoneNumber: formData.phoneNumber,
                partnerAddress: formData.partnerAddress,
                partnerEmail: formData.partnerEmail,
                partnerAccount: formData.partnerAccount || null,
                partnerBank: formData.partnerBank || null,
                howToPay: formData.howToPay || null,
                agreeService: agreements.service,
                agreePrivacy: agreements.privacy,
                agreeMarketing: agreements.marketing,
                agreeAll: agreements.all,
            };
        }

        try {
            const response = await fetch(buildApiUrl(url), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (
                    response.status === 409 ||
                    (errorData &&
                        errorData.message &&
                        errorData.message.includes("이미"))
                ) {
                    signupError =
                        "이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.";
                } else if (response.status === 400) {
                    signupError =
                        errorData?.message || "입력 정보를 다시 확인해주세요.";
                } else {
                    signupError =
                        "회원가입 중 오류가 발생했습니다. 다시 시도해주세요.";
                }
                submitted = false;
                showConfirmModal = false;
                return;
            }

            const data = await response.json();
            auth.login(data);
            alert("회원가입이 완료되었습니다! 자동 로그인되었습니다.");
            if (accountType === "PARTNER") {
                goto("/partner");
            } else {
                goto("/");
            }
        } catch (err) {
            signupError = "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
            submitted = false;
            showConfirmModal = false;
        }
    }

    function cancelConfirm() {
        showConfirmModal = false;
    }

    function goBack() {
        goto("/");
    }
</script>

<svelte:head>
    <title>회원가입 - LESGO PiCKLE</title>
</svelte:head>

<div class="page">
    <!-- Header -->
   <SiteHeader
      title="패들들고 LesGO! - 회원가입"
     hasNav={false}
     brandHref="/"
   />

    <!-- Main Content -->
    <main class="main">
        <div class="form-container">
            <!-- 회원 유형 선택 -->
            <div class="type-selector">
                <button
                    class="type-btn"
                    class:active={accountType === "MEMBER"}
                    on:click={() => switchType("MEMBER")}
                >
                    <span class="type-icon">👤</span>
                    <span class="type-label">일반 회원</span>
                    <span class="type-desc">게임 예약 및 참여</span>
                </button>
                <button
                    class="type-btn"
                    class:active={accountType === "CIRCLE"}
                    on:click={() => switchType("CIRCLE")}
                >
                    <span class="type-icon">👥</span>
                    <span class="type-label">동호회</span>
                    <span class="type-desc">모임 운영 및 활동</span>
                </button>
                <button
                    class="type-btn"
                    class:active={accountType === "PARTNER"}
                    on:click={() => switchType("PARTNER")}
                >
                    <span class="type-icon">🏢</span>
                     <span class="type-label">사설클럽</span>
                     <span class="type-desc">코트 운영 및 관리</span>
                </button>
            </div>

            <form class="signup-form" on:submit={handleSubmit}>
                {#if signupError}
                    <div class="signup-error">
                        <span class="error-icon">⚠️</span>
                        {signupError}
                    </div>
                {/if}

                {#if accountType === "MEMBER" || accountType === "PARTNER" || accountType === "CIRCLE"}
                    <div class="pb-card agreements-card">
                        <div class="agreements-title">가입 약관 동의</div>

                        <div class="agreement-row all">
                            <label class="agreement-left">
                                <input
                                    type="checkbox"
                                    checked={agreements.all}
                                    on:change={toggleAllAgreements}
                                />
                                <span class="agreement-text">모든 약관에 동의합니다.</span>
                            </label>
                        </div>

                        <div class="agreement-row">
                            <label class="agreement-left">
                                <input
                                    type="checkbox"
                                    checked={agreements.service}
                                    on:change={() => toggleAgreement("service")}
                                />
                                <span class="agreement-text">
                                    {TERMS_CONTENT.service.title}
                                    <span class="required">(필수)</span>
                                </span>
                            </label>
                            <button
                                type="button"
                                class="pb-btn-ghost agreement-detail"
                                on:click={() => openTerms("service")}
                            >
                                상세 보기
                            </button>
                        </div>

                        <div class="agreement-row">
                            <label class="agreement-left">
                                <input
                                    type="checkbox"
                                    checked={agreements.privacy}
                                    on:change={() => toggleAgreement("privacy")}
                                />
                                <span class="agreement-text">
                                    {TERMS_CONTENT.privacy.title}
                                    <span class="required">(필수)</span>
                                </span>
                            </label>
                            <button
                                type="button"
                                class="pb-btn-ghost agreement-detail"
                                on:click={() => openTerms("privacy")}
                            >
                                상세 보기
                            </button>
                        </div>

                        <div class="agreement-row">
                            <label class="agreement-left">
                                <input
                                    type="checkbox"
                                    checked={agreements.marketing}
                                    on:change={() => toggleAgreement("marketing")}
                                />
                                <span class="agreement-text">
                                    {TERMS_CONTENT.marketing.title}
                                    <span class="optional">(선택)</span>
                                </span>
                            </label>
                            <button
                                type="button"
                                class="pb-btn-ghost agreement-detail"
                                on:click={() => openTerms("marketing")}
                            >
                                상세 보기
                            </button>
                        </div>

                        <div class="agreement-note">
                            *14세 미만은 회원 가입이 제한됩니다.
                        </div>

                        {#if errors.agreements}
                            <div class="field-error">{errors.agreements}</div>
                        {/if}
                    </div>
                {/if}

                <div class="section-title">
                    <span class="section-icon">🔐</span> 계정 정보
                </div>

                <!-- username -->
                <div class="form-group">
                    <label for="username" class="label">
                        로그인 ID <span class="required">*</span>
                    </label>
                    <div class="username-row">
                        <input
                            type="text"
                            id="username"
                            bind:value={formData.username}
                            class="input"
                            class:error={errors.username}
                            maxlength="20"
                            placeholder="영문, 숫자, _ 사용 (4~20자)"
                            on:input={handleUsernameInput}
                        />
                        <button
                            type="button"
                            class="username-check-btn"
                            on:click={checkUsernameDuplicate}
                            disabled={
                                submitted ||
                                usernameCheck.status === "checking" ||
                                !formData.username.trim()
                            }
                        >
                            {usernameCheck.status === "checking"
                                ? "확인중..."
                                : "중복체크"}
                        </button>
                    </div>
                    {#if errors.username}
                        <span class="error-message">{errors.username}</span>
                    {/if}
                    {#if usernameCheck.message}
                        <div
                            class="username-check-message"
                            class:ok={usernameCheck.status === "available"}
                            class:bad={usernameCheck.status === "taken"}
                        >
                            {#if usernameCheck.status === "available"}
                                <span class="username-check-badge">중복 확인 완료</span>
                            {/if}
                            <span>{usernameCheck.message}</span>
                        </div>
                    {/if}
                    {#if errors.usernameCheck}
                        <span class="error-message">{errors.usernameCheck}</span>
                    {/if}
                </div>

                <!-- password -->
                <div class="form-row">
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
                            placeholder="6자 이상"
                        />
                        {#if errors.password}
                            <span class="error-message">{errors.password}</span>
                        {/if}
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword" class="label">
                            비밀번호 확인 <span class="required">*</span>
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            bind:value={formData.confirmPassword}
                            class="input"
                            class:error={errors.confirmPassword}
                            placeholder="비밀번호 재입력"
                        />
                        {#if errors.confirmPassword}
                            <span class="error-message"
                                >{errors.confirmPassword}</span
                            >
                        {/if}
                    </div>
                </div>

                <!-- name + phone -->
                <div class="form-row">
                    <div class="form-group">
                        <label for="name" class="label">
                            성명 <span class="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            bind:value={formData.name}
                            class="input"
                            class:error={errors.name}
                            maxlength="50"
                            placeholder="실명을 입력하세요"
                        />
                        {#if errors.name}
                            <span class="error-message">{errors.name}</span>
                        {/if}
                    </div>
                    <div class="form-group">
                        <label for="phoneNumber" class="label">
                            전화번호 <span class="required">*</span>
                        </label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            bind:value={formData.phoneNumber}
                            class="input"
                            class:error={errors.phoneNumber}
                            maxlength="20"
                            placeholder="010-1234-5678"
                        />
                        {#if errors.phoneNumber}
                            <span class="error-message"
                                >{errors.phoneNumber}</span
                            >
                        {/if}
                    </div>
                </div>

                <!-- ===== 일반유저 전용 필드 ===== -->
                {#if accountType === "MEMBER"}
                    <div class="section-title">
                        <span class="section-icon">🏓</span> 플레이어 정보
                    </div>

                    <div class="form-group">
                        <label for="nicName" class="label">
                            닉네임 <span class="optional">(선택)</span>
                        </label>
                        <input
                            type="text"
                            id="nicName"
                            bind:value={formData.nicName}
                            class="input"
                            maxlength="100"
                            placeholder="게임에서 사용할 닉네임"
                        />
                    </div>

                    <div class="form-group">
                        <label for="email" class="label">
                            이메일 <span class="optional">(선택)</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            bind:value={formData.email}
                            class="input"
                            maxlength="50"
                            placeholder="example@email.com"
                        />
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="ageRange" class="label">
                                나이대 <span class="optional">(선택)</span>
                            </label>
                            <select
                                id="ageRange"
                                bind:value={formData.ageRange}
                                class="input select"
                            >
                                <option value="">선택하세요</option>
                                <option value="10대">10대</option>
                                <option value="20대">20대</option>
                                <option value="30대">30대</option>
                                <option value="40대">40대</option>
                                <option value="50대">50대</option>
                                <option value="60대 이상">60대 이상</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="sex" class="label">
                                성별 <span class="required">*</span>
                            </label>
                            <select
                                id="sex"
                                bind:value={formData.sex}
                                class="input select"
                                class:error={errors.sex}
                            >
                                <option value="">선택하세요</option>
                                <option value="남성">남성</option>
                                <option value="여성">여성</option>
                            </select>
                            {#if errors.sex}
                                <span class="error-message">{errors.sex}</span>
                            {/if}
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="location" class="label">
                            소속지역 <span class="optional">(선택)</span>
                        </label>
                        <input
                            type="text"
                            id="location"
                            bind:value={formData.location}
                            class="input"
                            maxlength="20"
                            placeholder="예: 서울 강남구"
                        />
                    </div>

                    <div class="form-group">
                        <label for="circleName" class="label">
                            소속 동호회명 <span class="optional">(선택)</span>
                        </label>
                        <input
                            type="text"
                            id="circleName"
                            bind:value={formData.circleName}
                            class="input"
                            maxlength="50"
                            placeholder="동호회 이름을 입력하세요"
                        />
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="gameLevel" class="label">
                                게임등급 <span class="required">*</span>
                            </label>
                            <select
                                id="gameLevel"
                                bind:value={formData.gameLevel}
                                class="input select"
                                class:error={errors.gameLevel}
                            >
                                <option value="입문">입문</option>
                                <option value="초급">초급</option>
                                <option value="초중급">초중급</option>
                                <option value="중급">중급</option>
                                <option value="중상급">중상급</option>
                                <option value="상급">상급</option>
                                <option value="전문가">전문가</option>
                            </select>
                            {#if errors.gameLevel}
                                <span class="error-message"
                                    >{errors.gameLevel}</span
                                >
                            {/if}
                        </div>
                        <div class="form-group">
                            <label for="duprPoint" class="label">
                                DUPR등급 <span class="optional">(선택)</span>
                            </label>
                            <input
                                type="text"
                                id="duprPoint"
                                bind:value={formData.duprPoint}
                                class="input"
                                maxlength="10"
                                placeholder="예: 4.5"
                            />
                        </div>
                    </div>

                    <!-- ===== 사설클럽 전용 필드 ===== -->
                 {:else}
                     <div class="section-title">
                         <span class="section-icon">{accountType === "CIRCLE" ? "👥" : "🏢"}</span>
                         {accountType === "CIRCLE" ? "동호회 정보" : "사설클럽 정보"}
                     </div>

                     <div class="form-group">
                         <label for="businessPartner" class="label">
                             {accountType === "CIRCLE" ? "동호회명" : "사설클럽명"} <span class="required">*</span>
                          </label>
                         <input
                             type="text"
                             id="businessPartner"
                             bind:value={formData.businessPartner}
                             class="input"
                             class:error={errors.businessPartner}
                             maxlength="100"
                              placeholder={accountType === "CIRCLE" ? "동호회 이름을 입력하세요" : "사설클럽 이름을 입력하세요"}
                          />
                        {#if errors.businessPartner}
                            <span class="error-message"
                                >{errors.businessPartner}</span
                            >
                        {/if}
                    </div>

                    <div class="form-group">
                        <label for="owner" class="label">
                            {accountType === "CIRCLE" ? "회장명" : "대표자명"} <span class="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="owner"
                            bind:value={formData.owner}
                            class="input"
                            class:error={errors.owner}
                            maxlength="100"
                            placeholder={accountType === "CIRCLE" ? "회장 이름을 입력하세요" : "대표자 이름을 입력하세요"}
                        />
                        {#if errors.owner}
                            <span class="error-message">{errors.owner}</span>
                        {/if}
                    </div>

                    <div class="form-group">
                         <label for="partnerAddress" class="label">
                              {accountType === "CIRCLE" ? "활동지역" : "사설클럽 주소"} <span class="required">*</span>
                          </label>
                         <input
                             type="text"
                             id="partnerAddress"
                             bind:value={formData.partnerAddress}
                             class="input"
                             class:error={errors.partnerAddress}
                             maxlength="200"
                              placeholder={accountType === "CIRCLE" ? "주요 활동지역을 입력하세요" : "사설클럽 주소를 입력하세요"}
                          />
                        {#if errors.partnerAddress}
                            <span class="error-message"
                                >{errors.partnerAddress}</span
                            >
                        {/if}
                    </div>

                    <div class="form-group">
                        <label for="partnerEmail" class="label">
                            이메일 <span class="required">*</span>
                        </label>
                        <input
                            type="email"
                            id="partnerEmail"
                            bind:value={formData.partnerEmail}
                            class="input"
                            class:error={errors.partnerEmail}
                            maxlength="100"
                            placeholder="business@email.com"
                        />
                        {#if errors.partnerEmail}
                            <span class="error-message"
                                >{errors.partnerEmail}</span
                            >
                        {/if}
                    </div>

                    <div class="section-title">
                        <span class="section-icon">💳</span> 정산 정보
                        <span class="optional">(선택)</span>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="partnerBank" class="label">
                                은행명 <span class="optional">(선택)</span>
                            </label>
                            <input
                                type="text"
                                id="partnerBank"
                                bind:value={formData.partnerBank}
                                class="input"
                                maxlength="100"
                                placeholder="예: 국민은행"
                            />
                        </div>
                        <div class="form-group">
                            <label for="partnerAccount" class="label">
                                계좌번호 <span class="optional">(선택)</span>
                            </label>
                            <input
                                type="text"
                                id="partnerAccount"
                                bind:value={formData.partnerAccount}
                                class="input"
                                maxlength="50"
                                placeholder="계좌번호를 입력하세요"
                            />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="howToPay" class="label">
                            결제 방식 <span class="optional">(선택)</span>
                        </label>
                        <select
                            id="howToPay"
                            bind:value={formData.howToPay}
                            class="input select"
                        >
                            <option value="">선택하세요</option>
                            <option value="0">예약건별 수수료</option>
                            <option value="1">월 구독</option>
                            <option value="2">년 구독</option>
                        </select>
                    </div>
                {/if}

                <div class="button-group">
                    <button
                        type="submit"
                        class="btn btn-primary"
                        disabled={submitted}
                    >
                        {submitted ? "처리 중..." : "회원가입"}
                    </button>
                    <button
                        type="button"
                        class="btn btn-secondary"
                        on:click={goBack}
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    </main>

    <!-- Confirmation Modal -->
    {#if showConfirmModal}
        <div
            class="modal-overlay"
            role="button"
            tabindex="0"
            on:click={cancelConfirm}
            on:keydown={(e) => e.key === "Escape" && cancelConfirm()}
        >
            <div
                class="modal-content"
                role="dialog"
                tabindex="-1"
                aria-labelledby="modal-title"
                on:click={(e) => e.stopPropagation()}
                on:keydown={(e) => e.stopPropagation()}
            >
                <div class="modal-header">
                    <h2 id="modal-title" class="modal-title">
                        입력하신 정보를 확인해주세요
                    </h2>
                    <span
                        class="modal-badge"
                        class:partner={accountType === "PARTNER" || accountType === "CIRCLE"}
                    >
                        {accountType === "MEMBER"
                             ? "👤 일반 회원"
                             : accountType === "CIRCLE"
                               ? "👥 동호회"
                               : "🏢 사설클럽"}
                    </span>
                </div>

                <div class="modal-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">로그인 ID:</span>
                            <span class="info-value">{formData.username}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">성명:</span>
                            <span class="info-value">{formData.name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">전화번호:</span>
                            <span class="info-value"
                                >{formData.phoneNumber}</span
                            >
                        </div>

                        {#if accountType === "MEMBER"}
                            {#if formData.nicName}
                                <div class="info-item">
                                    <span class="info-label">닉네임:</span>
                                    <span class="info-value"
                                        >{formData.nicName}</span
                                    >
                                </div>
                            {/if}
                            {#if formData.email}
                                <div class="info-item">
                                    <span class="info-label">이메일:</span>
                                    <span class="info-value"
                                        >{formData.email}</span
                                    >
                                </div>
                            {/if}
                            <div class="info-item">
                                <span class="info-label">성별:</span>
                                <span class="info-value">{formData.sex}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">게임등급:</span>
                                <span class="info-value"
                                    >{formData.gameLevel}</span
                                >
                            </div>
                            {#if formData.duprPoint}
                                <div class="info-item">
                                    <span class="info-label">DUPR등급:</span>
                                    <span class="info-value"
                                        >{formData.duprPoint}</span
                                    >
                                </div>
                            {/if}
                        {:else}
                            <div class="info-item">
                                 <span class="info-label">{accountType === "CIRCLE" ? "동호회명" : "사설클럽명"}:</span>
                                 <span class="info-value"
                                     >{formData.businessPartner}</span
                                 >
                             </div>
                            <div class="info-item">
                                <span class="info-label">{accountType === "CIRCLE" ? "회장" : "대표자"}:</span>
                                <span class="info-value">{formData.owner}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">{accountType === "CIRCLE" ? "활동지역" : "주소"}:</span>
                                <span class="info-value"
                                    >{formData.partnerAddress}</span
                                >
                            </div>
                            <div class="info-item">
                                <span class="info-label">이메일:</span>
                                <span class="info-value"
                                    >{formData.partnerEmail}</span
                                >
                            </div>
                            {#if formData.howToPay}
                                <div class="info-item">
                                    <span class="info-label">결제 방식:</span>
                                    <span class="info-value">
                                        {formData.howToPay === "0"
                                            ? "예약건별 수수료"
                                            : formData.howToPay === "1"
                                              ? "월 구독"
                                              : "연 구독"}
                                    </span>
                                </div>
                            {/if}
                        {/if}
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" on:click={cancelConfirm}>
                        수정하기
                    </button>
                    <button
                        class="btn btn-primary"
                        on:click={confirmSignup}
                        disabled={submitted}
                    >
                        {submitted ? "처리 중..." : "회원가입 완료"}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <Modal open={termsModalOpen} onclose={() => (termsModalOpen = false)}>
        {#snippet children()}
            <div class="terms-modal">
                <div class="terms-modal-hd">
                    <div class="terms-modal-title">
                        {TERMS_CONTENT[termsModalKey]?.title || "약관"}
                    </div>
                </div>
                <div class="terms-modal-body">
                    <pre class="terms-modal-text">
{TERMS_CONTENT[termsModalKey]?.body || ""}</pre
                    >
                </div>
                <div class="terms-modal-actions">
                    <button
                        type="button"
                        class="pb-btn-primary"
                        on:click={() => (termsModalOpen = false)}
                    >
                        확인
                    </button>
                </div>
            </div>
        {/snippet}
    </Modal>
</div>

<style>
  .page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%);
  }

  .main {
    max-width: 640px;
        margin: 0 auto;
        padding: 32px 16px;
    }

    .form-container {
        background: #fff;
        border-radius: 14px;
        padding: 32px 28px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        animation: fadeIn 0.3s ease;
    }

    /* Type Selector */
    .type-selector {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
        margin-bottom: 28px;
    }
    .type-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 18px 16px;
        border-radius: 12px;
        border: 2px solid #e2e8f0;
        background: #fff;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
    }
    .type-btn:hover {
        border-color: #bee3f8;
        background: #f7fafc;
    }
    .type-btn.active {
        border-color: #2b6cb0;
        background: #ebf8ff;
        box-shadow: 0 2px 12px rgba(43, 108, 176, 0.15);
    }
    .type-icon {
        font-size: 28px;
    }
    .type-label {
        font-weight: 700;
        font-size: 15px;
        color: #1a365d;
    }
    .type-desc {
        font-size: 11px;
        color: #718096;
    }
    .type-btn.active .type-label {
        color: #2b6cb0;
    }

    /* Section Title */
    .section-title {
        font-weight: 700;
        font-size: 14px;
        color: #2d3748;
        padding: 10px 0 4px;
        border-bottom: 1px solid #edf2f7;
        margin-bottom: -4px;
    }
    .section-icon {
        margin-right: 4px;
    }

    .signup-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .signup-error {
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
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }

    .label {
        font-weight: 600;
        font-size: 14px;
        color: #1a365d;
    }
    .required {
        color: #e53e3e;
    }
    .optional {
        font-weight: 400;
        color: #718096;
        font-size: 12px;
    }

    .input {
        padding: 12px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.15s;
        outline: none;
    }

    .username-row {
        display: grid;
        grid-template-columns: 1fr 130px;
        gap: 10px;
        align-items: center;
    }

    .username-check-btn {
        padding: 12px 14px;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        background: #fff;
        color: #1a365d;
        font-size: 13px;
        font-weight: 800;
    }

    .username-check-btn:hover:not(:disabled) {
        background: #f7fafc;
        border-color: #cbd5e0;
    }

    .username-check-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .username-check-message {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        background: #f7fafc;
        color: #4a5568;
        font-size: 12px;
        font-weight: 700;
    }

    .username-check-message.ok {
        border-color: rgba(47, 133, 90, 0.35);
        background: rgba(240, 255, 244, 0.7);
        color: #22543d;
    }

    .username-check-message.bad {
        border-color: rgba(197, 48, 48, 0.28);
        background: rgba(255, 245, 245, 0.7);
        color: #742a2a;
    }

    .username-check-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(47, 133, 90, 0.12);
        border: 1px solid rgba(47, 133, 90, 0.28);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: -0.01em;
        color: #22543d;
        white-space: nowrap;
    }
    .select {
        cursor: pointer;
        background-color: #fff;
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
        margin-top: 8px;
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

    /* Agreements */
    .agreements-card {
        padding: 18px;
        margin-top: 16px;
        margin-bottom: 10px;
    }
    .agreements-title {
        font-size: 15px;
        font-weight: 800;
        color: #1a365d;
        margin-bottom: 12px;
    }
    .agreement-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        background: #f7fafc;
        border-radius: 12px;
        margin-bottom: 10px;
    }
    .agreement-row.all {
        background: #fff;
    }
    .agreement-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        cursor: pointer;
        user-select: none;
    }
    .agreement-left input {
        width: 18px;
        height: 18px;
        accent-color: #1a365d;
    }
    .agreement-text {
        font-size: 13px;
        font-weight: 700;
        color: #2d3748;
        line-height: 1.3;
    }
    .required {
        color: #c53030;
        font-weight: 800;
        margin-left: 6px;
        font-size: 12px;
    }
    .optional {
        color: #718096;
        font-weight: 800;
        margin-left: 6px;
        font-size: 12px;
    }
    .agreement-detail {
        padding: 10px 12px;
        font-size: 12px;
        white-space: nowrap;
    }
    .agreement-note {
        font-size: 12px;
        font-weight: 700;
        color: #718096;
        margin: 2px 2px 10px;
    }
    .field-error {
        margin-top: 8px;
        color: #e53e3e;
        font-size: 12px;
        font-weight: 700;
    }

    /* Terms modal */
    .terms-modal-title {
        font-size: 16px;
        font-weight: 900;
        color: #1a365d;
        margin-bottom: 10px;
    }
    .terms-modal-text {
        background: #f7fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px;
        font-size: 12px;
        line-height: 1.7;
        color: #2d3748;
        max-height: 52vh;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    .terms-modal-actions {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
    }
    .terms-modal-actions button {
        min-width: 120px;
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
            padding: 24px 20px;
        }
        .form-row {
            grid-template-columns: 1fr;
        }
        .username-row {
            grid-template-columns: 1fr;
        }
        .button-group {
            flex-direction: column;
        }
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease;
    }
    .modal-content {
        background: #fff;
        border-radius: 14px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.3s ease;
    }
    .modal-header {
        padding: 24px 28px 16px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }
    .modal-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1a365d;
    }
    .modal-badge {
        font-size: 12px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 20px;
        background: #ebf8ff;
        color: #2b6cb0;
        white-space: nowrap;
    }
    .modal-badge.partner {
        background: #fef3cd;
        color: #856404;
    }
    .modal-body {
        padding: 24px 28px;
    }
    .info-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 10px 14px;
        background: #f7fafc;
        border-radius: 8px;
        border-left: 3px solid #1a365d;
    }
    .info-label {
        font-size: 13px;
        font-weight: 600;
        color: #4a5568;
        min-width: 100px;
    }
    .info-value {
        font-size: 14px;
        font-weight: 500;
        color: #1a365d;
        text-align: right;
        word-break: break-word;
    }
    .modal-footer {
        padding: 16px 28px 24px;
        display: flex;
        gap: 10px;
        border-top: 1px solid #e2e8f0;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 640px) {
        .modal-content {
            width: 95%;
            max-height: 90vh;
        }
        .modal-header,
        .modal-body,
        .modal-footer {
            padding-left: 20px;
            padding-right: 20px;
        }
        .info-item {
            flex-direction: column;
            gap: 4px;
        }
        .info-label {
            min-width: auto;
        }
        .info-value {
            text-align: left;
        }
    }
</style>
