# Pickleball Reservation Frontend

## Project Overview
피클볼 게임 예약 시스템의 프론트엔드 프로젝트. SvelteKit + Svelte 5 기반 단일 페이지 애플리케이션.

## Tech Stack
- **Framework:** SvelteKit 2.15+ / Svelte 5 (Runes)
- **Build:** Vite 6
- **Adapter:** @sveltejs/adapter-auto
- **Language:** JavaScript (no TypeScript)
- **Font:** Noto Sans KR (Google Fonts)
- **Backend Proxy:** `/api` → `http://localhost:8080` (Vite dev server proxy)

## Commands
- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드
- `npm run preview` — 빌드 결과 미리보기

## Project Structure
```
src/
├── app.html                          # HTML shell (lang="ko")
├── routes/
│   ├── +layout.svelte                # Global layout (reset CSS, font)
│   └── +page.svelte                  # Main page (single page app)
└── lib/
    ├── stores/reservation.js         # Svelte stores (state management)
    ├── data/mock.js                  # Mock data & utility functions
    └── components/
        ├── Modal.svelte              # Reusable modal wrapper
        ├── PartnerSelector.svelte    # Step 1: 사업장 선택
        ├── DateSelector.svelte       # Step 2: 날짜 선택
        ├── CourtGrid.svelte          # Step 3: 시간대별 코트 현황
        ├── DetailModal.svelte        # Court detail + player list
        ├── ConfirmModal.svelte       # Reservation confirmation
        ├── SuccessToast.svelte       # Success notification toast
        ├── LevelBadge.svelte         # Level badge (초급/중급/상급)
        └── PlayerChip.svelte         # Player info chip
```

## Architecture & Conventions

### Svelte 5 Runes
- `$props()` for component props
- `$derived()` for reactive derived values
- `{#snippet}` / `{@render}` for snippet rendering
- `{@const}` for template-level constants

### State Management
- Svelte writable/derived stores in `$lib/stores/reservation.js`
- Key stores: `selectedPartner`, `selectedDate`, `modalOpen`, `modalData`, `confirmOpen`, `successOpen`
- `filteredCourts` is a derived store based on `selectedPartner`

### Styling
- Scoped CSS per component (no CSS framework)
- Color palette: Navy `#1a365d` primary, green/orange/red for status
- Animations: fadeIn, slideUp, pop keyframes
- Mobile-ready: horizontal scroll tables, sticky columns

### Data Flow
1. User selects partner → `selectedPartner` store updated
2. User selects date → `selectedDate` store updated
3. CourtGrid renders time slots × courts grid
4. Cell click → DetailModal → ConfirmModal → SuccessToast

### Current State
- All data is mock (hardcoded in `$lib/data/mock.js`)
- Reservation "confirm" only shows toast, no actual data mutation
- Vite proxy configured for future backend API integration at `/api`
