# Team CalTalk 앱 스타일 가이드 (Tailwind CSS)

## 0. 문서 메타데이터

| 항목 | 내용 |
|---|---|
| 문서명 | Team CalTalk 앱 스타일 가이드 |
| 버전 | v0.1 |
| 근거 | 참조 이미지(네이버 캘린더 UI 스크린샷), `docs/8-wireframes.md`(WF-01~09, 컴포넌트 목록), `docs/4-project-structure-principles.md`(기술 스택: React + Tailwind CSS) |
| 목적 | `frontend/` 구현 시 색상·타이포그래피·간격·컴포넌트 스타일을 매번 새로 정하지 않도록 참조 이미지의 시각적 톤을 Tailwind 토큰으로 정리 |

> 본 문서는 **시각 스타일(색상/타이포/간격/컴포넌트 외형)만** 다룬다. 화면 구조·정보 배치는 이미 `docs/8-wireframes.md`가 확정했으므로 이 문서와 충돌하는 레이아웃을 새로 만들지 않는다. 다크 모드, 테마 커스터마이징, 디자인 토큰 관리 도구(Style Dictionary 등)는 5일 MVP 범위 밖이므로 다루지 않는다.

---

## 1. 디자인 톤

참조 이미지(캘린더 앱)에서 가져오는 톤은 다음과 같다.

- **밀도 높은 정보형 UI**: 여백보다 정보 배치가 우선. 폰트 크기는 작게(12~14px), 라인 높이는 타이트하게.
- **흰 배경 + 얇은 회색 경계선**: 그림자보다 `border`로 영역을 구분한다.
- **의미 기반 색상 사용**: 색은 장식이 아니라 상태 전달 용도로만 쓴다 — 파랑(선택/주요 액션), 빨강(휴일/일요일/경고), 회색(비활성/보조 텍스트).
- **탭형 전환 컨트롤**: "월간/주간/일간"처럼 세그먼트 버튼 그룹으로 뷰를 전환한다(WF-02·03의 `[월*][주][일]`).
- **좌측 사이드바 + 우측 메인**의 2단 골격이나, Team CalTalk에서는 이 골격을 그대로 쓰지 않고 WF 문서의 **캘린더(좌) + 채팅(우)** 2단 골격에 이 톤(색/타이포/컴포넌트 외형)만 적용한다.

---

## 2. 색상 팔레트

### 2.1 Tailwind `theme.extend.colors` 설정

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef3ff',
          100: '#dce6ff',
          200: '#b6c9ff',
          300: '#8aa6ff',
          400: '#5c7cff',
          500: '#3358f4',   // 기본 브랜드 색 — 주요 버튼, 선택 상태, 링크
          600: '#2545d6',   // hover
          700: '#1c36ac',   // active/pressed
          800: '#182d87',
          900: '#16276b',
        },
        danger: {
          50:  '#fdecec',
          400: '#f0605c',
          500: '#e0332e',   // 일요일/공휴일 표기, 삭제·경고 액션
          600: '#c22824',
        },
        accent: {
          purple: '#8b6fd6', // 종일/기간 일정 바(예: WF-02 하이라이트 일정)
        },
        neutral: {
          0:   '#ffffff',
          50:  '#f7f8fa',   // 페이지 배경
          100: '#eef0f3',   // 카드/패널 배경(비활성 영역), 구분선 배경
          200: '#e2e5ea',   // 기본 border
          300: '#cdd2da',
          400: '#9aa1ac',   // placeholder, 비활성 텍스트
          500: '#767d8a',   // 보조 텍스트
          600: '#565d68',
          700: '#3d434c',
          800: '#282c33',
          900: '#16181c',   // 기본 본문 텍스트
        },
      },
    },
  },
}
```

### 2.2 시맨틱 매핑 (어디에 어떤 색을 쓰는가)

| 용도 | 토큰 | 비고 |
|---|---|---|
| 주요 버튼 배경(`일정 추가`, `전송`, `저장`) | `bg-primary-500`, hover `bg-primary-600` | WF-04 `[저장]`, WF-05 `[전송]` |
| 선택된 날짜 / 선택된 탭 | `bg-primary-500 text-white` 또는 `text-primary-600 border-primary-500` | WF-02 `[22*]`, `[월*]` |
| 오늘 날짜 강조 | `text-primary-600 font-semibold` | 날짜 셀 숫자만 강조, 배경은 채우지 않음 |
| 일요일/공휴일 텍스트 | `text-danger-500` | 참조 이미지의 빨간 날짜 표기 |
| 토요일 텍스트 | `text-primary-500` (파랑, danger와 구분) | |
| 종일/기간 일정 바 | `bg-accent-purple text-white` | 이미지의 보라색 가로 바 |
| 삭제/위험 액션(WF-04 `[삭제]`) | `text-danger-500 border-danger-500`, hover `bg-danger-50` | outline 스타일 유지, 채움은 hover에서만 |
| `ChangeRequestBadge`("변경 요청" 표시) | `bg-danger-50 text-danger-600 border border-danger-400` | 일반 메시지와 명확히 구분되는 경고성 배지 (§5.5) |
| 카드/패널 기본 테두리 | `border-neutral-200` | |
| 페이지 배경 | `bg-neutral-50` | |
| 패널/카드 배경 | `bg-white` | |
| 본문 텍스트 | `text-neutral-900` | |
| 보조/캡션 텍스트(날짜 제약 안내 등, WF-04 `※` 문구) | `text-neutral-500 text-xs` | |
| 비활성 버튼/입력 | `bg-neutral-100 text-neutral-400 cursor-not-allowed` | WF-08 "탈퇴" 비활성화 상태 |

---

## 3. 타이포그래피

Tailwind 기본 스케일을 그대로 쓰되, 사용 범위를 아래로 제한한다(임의로 더 큰 크기를 추가하지 않는다).

| 요소 | 클래스 | 예시 위치 |
|---|---|---|
| 앱 타이틀/로고 | `text-lg font-bold text-neutral-900` | 헤더 "Team CalTalk" |
| 화면/패널 제목 | `text-base font-semibold text-neutral-900` | WF-04 "일정 생성" |
| 본문/기본 텍스트 | `text-sm text-neutral-900` | 폼 라벨, 목록 항목 |
| 캘린더 날짜 숫자 | `text-sm text-neutral-700`, 오늘/선택 시 `font-semibold` | 날짜 셀 |
| 일정 항목(이벤트 칩) | `text-xs font-medium` | `[팀회의 14:00]` |
| 채팅 메시지 본문 | `text-sm text-neutral-800` | `ChatMessageList` |
| 채팅 타임스탬프/발신자 | `text-xs text-neutral-500` | `09:20 팀원A` |
| 보조 설명·유효성 안내 | `text-xs text-neutral-500` | WF-04 `※ 1~100자...` |
| 버튼 텍스트 | `text-sm font-medium` | |

폰트 패밀리는 시스템 기본 sans-serif 스택을 사용한다(별도 웹폰트 로딩은 5일 MVP 범위 밖):

```js
fontFamily: {
  sans: ['Pretendard', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
}
```

> `Pretendard`가 번들에 없다면 `system-ui` 이하로 자연 폴백되므로, 웹폰트 도입은 선택 사항이지 필수 작업이 아니다.

---

## 4. 레이아웃 · 간격 · 형태

### 4.1 간격 스케일

Tailwind 기본 spacing(`4px` 단위)을 그대로 쓴다. 컴포넌트 내부는 `p-3`~`p-4`, 컴포넌트 사이 간격은 `gap-4`~`gap-6` 범위로 통일한다.

### 4.2 모서리 · 테두리 · 그림자

| 요소 | 클래스 |
|---|---|
| 카드/패널(캘린더 영역, 채팅 패널, 폼) | `rounded-lg border border-neutral-200 bg-white` |
| 버튼 | `rounded-md` |
| 입력 필드 | `rounded-md border border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500` |
| 배지(`ChangeRequestBadge`) | `rounded-full` |
| 그림자 | 기본적으로 사용하지 않음. 모달(WF-04)에만 `shadow-lg` | 참조 이미지도 그림자보다 테두리 위주 |

### 4.3 헤더 (전역 상단바)

WF-02~08 공통 상단바(`Team CalTalk / 팀 선택 / 사용자`)에 적용:

```html
<header class="flex items-center justify-between h-14 px-4 border-b border-neutral-200 bg-white">
  <div class="flex items-center gap-4">
    <span class="text-lg font-bold text-primary-600">Team CalTalk</span>
    <!-- TeamSwitcher -->
    <button class="flex items-center gap-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md px-2 py-1">
      개발1팀 <span class="text-neutral-400">▾</span>
    </button>
  </div>
  <button class="flex items-center gap-1 text-sm text-neutral-700">
    <span class="px-1.5 py-0.5 text-xs rounded bg-primary-50 text-primary-600 font-medium">팀장</span>
    홍길동 ▾
  </button>
</header>
```

### 4.4 캘린더 + 채팅 2단 그리드 (WF-02/03)

```html
<div class="grid grid-cols-[1fr_360px] gap-4 p-4 h-[calc(100vh-56px)]">
  <section class="rounded-lg border border-neutral-200 bg-white overflow-hidden"><!-- CalendarView --></section>
  <aside class="rounded-lg border border-neutral-200 bg-white flex flex-col"><!-- ChatPanel --></aside>
</div>
```

- 데스크톱: `grid-cols-[1fr_360px]` 고정.
- 모바일(WF-09, `< md`): `grid-cols-1`로 전환하고 상단 세그먼트 탭(§5.2)으로 캘린더/채팅을 토글한다. 두 패널을 동시에 렌더링하지 않는다(불필요한 DOM 유지 금지).

---

## 5. 컴포넌트 스타일

### 5.1 버튼

```html
<!-- Primary: 일정 추가, 저장, 전송, 로그인 -->
<button class="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 active:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400">
  + 일정 추가
</button>

<!-- Secondary: 취소 -->
<button class="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50">
  취소
</button>

<!-- Danger outline: 삭제, 탈퇴 -->
<button class="px-3 py-1.5 text-sm font-medium text-danger-500 border border-danger-500 rounded-md hover:bg-danger-50">
  삭제
</button>
```

### 5.2 세그먼트 탭 (월/주/일, 모바일 캘린더/채팅 탭)

```html
<div class="inline-flex rounded-md border border-neutral-200 overflow-hidden">
  <button class="px-3 py-1.5 text-sm font-medium bg-primary-500 text-white">월</button>
  <button class="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 border-l border-neutral-200">주</button>
  <button class="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 border-l border-neutral-200">일</button>
</div>
```

### 5.3 캘린더 날짜 셀

```html
<!-- 기본 -->
<div class="h-24 p-1.5 border-t border-r border-neutral-200 text-sm text-neutral-700">21</div>

<!-- 일요일/공휴일 -->
<div class="... text-danger-500">6 <span class="block text-[10px] truncate">추석연휴</span></div>

<!-- 오늘 -->
<div class="... text-primary-600 font-semibold">23</div>

<!-- 선택된 날짜 -->
<div class="... bg-primary-50 ring-1 ring-inset ring-primary-500">22</div>
```

### 5.4 일정 칩(이벤트 항목)

```html
<!-- 시간 일정 -->
<div class="mt-0.5 px-1.5 py-0.5 text-xs font-medium text-primary-700 bg-primary-50 rounded truncate cursor-pointer hover:bg-primary-100">
  팀회의 14:00
</div>

<!-- 종일/기간 일정 바 -->
<div class="mt-0.5 px-1.5 py-0.5 text-xs font-medium text-white bg-accent-purple rounded truncate">
  [오후 04:00] 테스트 일정
</div>
```

### 5.5 채팅 메시지 (`ChatMessageList`, `ChangeRequestBadge`)

```html
<!-- 일반 메시지 -->
<div class="flex gap-2 py-1.5">
  <span class="text-xs text-neutral-400 w-10 shrink-0">09:15</span>
  <span class="text-xs font-medium text-neutral-600 shrink-0">팀원A</span>
  <p class="text-sm text-neutral-800">저도 그날 참석 가능합니다</p>
</div>

<!-- 변경 요청 메시지 -->
<div class="flex gap-2 py-1.5 items-start">
  <span class="text-xs text-neutral-400 w-10 shrink-0">09:20</span>
  <div class="flex-1">
    <div class="flex items-center gap-2">
      <span class="text-xs font-medium text-neutral-600">팀원A</span>
      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-danger-50 text-danger-600 border border-danger-400">
        변경 요청
      </span>
    </div>
    <p class="text-sm text-neutral-800 mt-0.5">다음 주 화요일 회의를 3시로 옮겼으면 합니다</p>
  </div>
</div>
```

### 5.6 채팅 입력 (`ChatMessageInput`) — 라디오 전환

```html
<div class="border-t border-neutral-200 p-3">
  <div class="flex gap-4 text-sm mb-2">
    <label class="flex items-center gap-1.5 text-neutral-700">
      <input type="radio" name="msgType" class="accent-primary-500" checked /> 일반 메시지
    </label>
    <label class="flex items-center gap-1.5 text-neutral-700">
      <input type="radio" name="msgType" class="accent-primary-500" /> 변경 요청
    </label>
  </div>
  <div class="flex gap-2">
    <input class="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" placeholder="메시지를 입력하세요" />
    <button class="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600">전송</button>
  </div>
</div>
```

`ChatMessageInput`의 라디오 선택에 따라 색이 바뀌지 않도록 주의한다 — "변경 요청" 선택은 전송 *전* 입력 상태일 뿐이고, 실제 변경 요청 여부를 색으로 표시하는 것은 전송 후 `ChangeRequestBadge`(§5.5)의 역할이다.

### 5.7 폼 (`ScheduleForm`, WF-04)

```html
<div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
  <div class="w-[420px] rounded-lg bg-white shadow-lg border border-neutral-200">
    <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
      <h2 class="text-base font-semibold text-neutral-900">일정 생성</h2>
      <button class="text-neutral-400 hover:text-neutral-600">✕</button>
    </div>
    <div class="p-4 space-y-4">
      <div>
        <label class="text-sm font-medium text-neutral-700">제목</label>
        <input class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
        <p class="mt-1 text-xs text-neutral-500">1~100자, 공백만으로는 입력 불가</p>
      </div>
    </div>
    <div class="flex justify-end gap-2 px-4 py-3 border-t border-neutral-200">
      <button class="px-3 py-1.5 text-sm text-neutral-700 border border-neutral-300 rounded-md hover:bg-neutral-50">취소</button>
      <button class="px-3 py-1.5 text-sm text-danger-500 border border-danger-500 rounded-md hover:bg-danger-50">삭제</button>
      <button class="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600">저장</button>
    </div>
  </div>
</div>
```

### 5.8 `TeamSwitcher` 드롭다운

```html
<div class="absolute mt-1 w-48 rounded-md border border-neutral-200 bg-white shadow-lg py-1">
  <button class="w-full flex items-center justify-between px-3 py-1.5 text-sm text-left hover:bg-neutral-50">
    <span class="text-neutral-900">팀 A</span>
    <span class="text-xs text-neutral-400">팀원</span>
  </button>
  <button class="w-full flex items-center justify-between px-3 py-1.5 text-sm text-left bg-primary-50 text-primary-700">
    <span>팀 B</span>
    <span class="text-xs text-primary-500">팀장</span>
  </button>
</div>
```

---

## 6. 상태 스타일 규칙

| 상태 | 규칙 |
|---|---|
| hover | 배경 한 단계 어둡게(`neutral-50`/`primary-600`) — 그림자 추가 금지 |
| focus(입력 필드) | `focus:border-primary-500 focus:ring-1 focus:ring-primary-500` 통일 |
| disabled | `opacity-100` 유지하되 `bg-neutral-100 text-neutral-400 cursor-not-allowed` — 흐림 처리(`opacity-50`)는 텍스트 대비를 해치므로 지양 |
| 읽기 전용(팀원 뷰, WF-03) | 버튼 자체를 렌더링하지 않음(disabled 상태로 보여주지 않음) — BR-04에 따라 팀원에게는 CUD 진입점이 아예 존재하지 않아야 하므로 |
| 삭제/경고 확인 다이얼로그 | `bg-danger-50 border border-danger-400 text-danger-600` 배너 + `border` 강조, WF-08 차단 메시지와 동일 톤 |

---

## 7. 반응형 브레이크포인트

Tailwind 기본값을 그대로 사용한다(커스텀 브레이크포인트 추가 금지).

| 브레이크포인트 | 기준 | 적용 |
|---|---|---|
| `< md` (< 768px) | 모바일 | WF-09: 캘린더/채팅 좌우 2단 → 상단 탭 전환, `grid-cols-1` |
| `>= md` | 데스크톱 | WF-02/03/05 등 좌우 2단 그리드(§4.4) 유지 |

---

## 8. 체크리스트 (구현 시 확인)

- [ ] 색상은 §2.1의 `primary`/`danger`/`accent`/`neutral` 토큰만 사용하고 임의의 hex 값을 인라인으로 넣지 않는다.
- [ ] 승인/반려 개념이 없으므로(`docs/4-project-structure-principles.md`) `ChangeRequestBadge`에 "승인됨/반려됨" 등의 색상 상태를 추가하지 않는다 — "변경 요청"이라는 단일 라벨만 존재.
- [ ] 그림자는 모달(WF-04)에만 사용하고, 카드/패널은 `border`로만 구분한다.
- [ ] 다크 모드, 테마 전환 UI를 추가하지 않는다(범위 외).
