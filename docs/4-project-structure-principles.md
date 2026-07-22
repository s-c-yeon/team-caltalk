# Team CalTalk 프로젝트 구조 설계 원칙

## 0. 문서 메타데이터

| 항목 | 내용 |
|---|---|
| 문서명 | Team CalTalk 프로젝트 구조 설계 원칙 |
| 버전 | v0.1 |
| 상태 | Draft (초안) |
| 최종 수정일 | 2026-07-22 |
| 작성/관리 | Team CalTalk 아키텍처 담당 |
| 근거 문서 | `1-domain-definition.md` (도메인 정의서 v0.2), `2-PRD.md` (PRD v0.1), `3-user-scenarios.md` (사용자 시나리오 v0.1) |

### 0.1 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v0.1 | 2026-07-22 | 도메인 정의서 v0.2, PRD v0.1, 사용자 시나리오 v0.1을 근거로 최초 프로젝트 구조 설계 원칙 문서 작성. 최상위 공통 원칙, 의존성/레이어 원칙, 코드/네이밍 원칙, 테스트/품질 원칙, 설정/보안/운영 원칙, 프론트엔드/백엔드 디렉토리 구조 정의. |

> 본 문서는 선행 문서(도메인 정의서, PRD, 사용자 시나리오)에서 이미 확정한 용어(TERM-xx)·비즈니스 규칙(BR-xx)·기능요구사항(FR-xx)·시나리오(SC-xx/EX-xx)를 그대로 계승하며, 이와 상충되는 구조를 설계하지 않는다. 특히 PRD §3.2·§6·§7에서 확정한 기술 스택(React + Node.js/Express + PostgreSQL), 제약(1인 개발·5일 MVP·예산 최소화·웹 우선 반응형·외부 연동 없음·접근성 미고려)을 프로젝트 구조 결정의 최우선 전제로 삼는다.

---

## 1. 최상위 공통 원칙

### 1.1 왜 이런 원칙이 필요한가 — 제약의 재확인

이 프로젝트는 **1인 개발**, **5일 이내 MVP 완성**(PRD §2.1, §8), **예산 최소화**(PRD §6 가용성, §9.1 예산 제약)라는 세 가지 제약 아래 있다. 이 제약은 구조 설계의 모든 판단 기준이다.

- **낮은 인지 부하가 최우선이다.** 리뷰해 줄 동료가 없고(1인 개발), 코드를 다시 볼 시점에도 결국 본인 혼자다. 구조를 이해하는 데 드는 시간은 곧 기능을 구현할 시간을 깎아 먹는다. 따라서 "화려하지만 설명이 필요한 구조"보다 "한 번 보면 어디에 뭐가 있는지 예측 가능한 구조"를 택한다.
- **관례(convention) 기반의 단순 구조를 쓴다.** Express·React 생태계에서 널리 쓰이는 익숙한 폴더 이름(routes/controllers/services, components/hooks)을 그대로 사용한다. 프로젝트 고유의 새로운 아키텍처 용어나 레이어 이름을 창작하지 않는다 — 창작된 개념은 문서화·유지보수 비용을 늘린다.
- **조기 추상화를 금지한다.** 인터페이스, 추상 클래스, 플러그인 구조, DI 컨테이너 등은 "나중에 구현체가 여러 개 생길 때" 필요한 것이다. 이 프로젝트는 DB도 PostgreSQL 하나, 배포 대상도 단일 인스턴스 하나로 고정되어 있다(PRD §7). 지금 구현체가 하나뿐인 것에 대한 추상화는 만들지 않는다.
- **범위 외 항목을 위한 구조를 미리 만들지 않는다.** 도메인 정의서 §10.2 및 PRD §3.2에서 명시적으로 범위 외로 규정한 항목(외부 캘린더/메신저 연동, ScheduleChangeRequest 상태 전이 워크플로, 낙관적 잠금, 접근성, 다국어, 반복 일정 등)을 위한 어댑터 레이어, 확장 포인트, 미사용 상태 필드 등을 미리 만들지 않는다. 예: 외부 연동 어댑터 인터페이스를 미리 파 두지 않는다, ScheduleChangeRequest 테이블에 `status` 컬럼을 미리 추가하지 않는다(도메인 정의서 §1.2, TERM-08).
- **"막지 않는 설계"까지만 한다.** 단, PRD §6·§9가 요구하는 "3,000+ 팀 확장을 막지 않는" 최소한의 구조적 배려(예: 모든 팀 종속 테이블에 `team_id` 인덱스, 상태 비저장 서버)는 지금 시점에 비용이 거의 들지 않으므로 반영한다. 이것은 조기 추상화가 아니라, 나중에 구조를 갈아엎지 않기 위한 값싼 보험이다. 실제 부하 검증·캐싱·수평 확장 구현은 로드맵(PRD §9.2)으로 명확히 유보한다.

### 1.2 저장소 구조: 모노레포(단일 리포지토리, 폴더 분리)

**결정: 프론트엔드와 백엔드를 별도 저장소로 분리하지 않고, 하나의 Git 저장소 안에 `frontend/`와 `backend/` 폴더로 나눈다. Nx/Turborepo 같은 모노레포 전용 도구는 도입하지 않는다.**

근거:
- 1인 개발에서는 PR/이슈/브랜치를 두 저장소에 나눠 관리하는 것 자체가 조율 비용이다 — 조율할 다른 사람이 없으므로 그 비용은 순수 오버헤드다.
- 5일 MVP 동안 프론트엔드-백엔드 API 계약(예: FR-08의 메시지 유형 필드, FR-09의 ScheduleChangeRequest 응답 형태)이 자주 바뀔 수 있는데, 단일 저장소면 한 커밋으로 양쪽을 함께 수정하고 커밋 이력으로 변경을 추적할 수 있다. 별도 저장소였다면 버저닝·동기화 문제가 생긴다.
- 배포는 어차피 프론트엔드(정적 호스팅)와 백엔드(PaaS 인스턴스)가 독립적으로 이뤄지므로(§5.3 참고), 저장소를 합쳐도 배포 단위가 억지로 묶이지 않는다. 즉 모노레포의 단점(배포 결합)이 이 프로젝트에서는 발생하지 않는다.
- Nx/Turborepo 등 모노레포 도구는 다중 패키지 간 캐시·의존성 그래프 관리를 위한 것으로, 패키지가 2개(frontend, backend)뿐이고 서로 코드를 공유하지 않는 이 프로젝트에는 과설계다. `frontend/`, `backend/`가 각자 독립된 `package.json`을 갖는 **단순 폴더 분리**로 충분하다.

---

## 2. 의존성/레이어 원칙

### 2.1 공통 규칙

- **의존성은 항상 한 방향으로만 흐른다**: 상위 레이어(사용자 입력에 가까운 쪽)가 하위 레이어(데이터에 가까운 쪽)를 호출하며, 그 반대는 금지한다.
- **순환 의존을 금지한다.** 레이어 사이는 물론, 같은 레이어 내 도메인 모듈(예: `schedules.service.js`와 `chatMessages.service.js`) 사이에도 서로를 순환 참조하지 않는다. 한 도메인 서비스가 다른 도메인 서비스를 호출해야 한다면(예: 변경 요청 처리 시 일정 조회), 호출 방향을 한쪽으로 고정한다.
- **레이어를 건너뛰지 않는다.** 예를 들어 라우트가 데이터 접근 계층을 직접 호출하거나, React 컴포넌트가 API 클라이언트를 직접 호출하는 것은 금지한다 — 항상 바로 아래 레이어를 통해서만 접근한다. 이는 "레이어를 늘리자"가 아니라 "이미 나눈 레이어의 경계를 지키자"는 최소 규율이다.

### 2.2 백엔드(Express) 레이어링

과도한 DDD(도메인 주도 설계)나 헥사고날 아키텍처(포트/어댑터)는 5일 MVP·1인 개발에 맞지 않으므로 채택하지 않는다. 대신 Express 생태계에서 흔히 쓰이는 4단 레이어만 둔다.

```
route → controller → service → model(데이터 접근)
```

| 레이어 | 책임 | 하지 않는 것 |
|---|---|---|
| **route** | URL/HTTP 메서드와 controller를 연결. 미들웨어(인증·검증) 부착. | 비즈니스 로직, DB 접근 없음 |
| **controller** | HTTP 요청(req)에서 필요한 값을 꺼내 service에 전달하고, service 결과를 HTTP 응답(res)으로 변환. | 비즈니스 규칙 판단, SQL 없음 |
| **service** | 비즈니스 로직 수행 — **BR-xx 규칙이 실제로 구현되는 위치**. 여러 model 호출을 조합. | HTTP(req/res) 객체를 직접 다루지 않음 |
| **model** | PostgreSQL 쿼리 실행만 담당. | 비즈니스 규칙 판단 없음(단순 CRUD 쿼리) |

BR-xx/TERM-xx의 레이어 대응(추적성):

| ID | 규칙 | 대응 레이어 |
|---|---|---|
| BR-01 | 인증 필수 | `middlewares/auth.middleware.js` (라우트 진입 전 공통 적용) |
| BR-02 | 팀 소속 필수 | `middlewares/team-membership.middleware.js` |
| BR-03, BR-04 | 일정 CUD는 팀장 전용 / 팀원 조회만 | `middlewares/require-role.middleware.js` (라우트 선언) + `services/schedules.service.js` |
| BR-05 | 변경 요청은 명시적 액션으로만 생성 | `services/scheduleChangeRequests.service.js`, `services/chatMessages.service.js` |
| BR-06, BR-07 | 채팅 일자 이력, 캘린더-채팅 연동 조회 | `services/chatMessages.service.js` |
| BR-08 | 월/주/일 조회, 소속 팀 한정 | `services/schedules.service.js` + `middlewares/team-membership.middleware.js` |
| BR-09, BR-12 | 팀장 탈퇴 차단, 마지막 팀 탈퇴 시 계정 유지 | `services/teams.service.js` |
| BR-10 | 동시 수정 Last-Write-Wins | `models/schedule.model.js` (단순 UPDATE, 버전 체크 없음 — §10.2와 일치) |
| BR-11 | 다중 팀 소속 시 팀 전환 조회 | `services/teams.service.js`, `services/schedules.service.js` |
| §8 데이터 제약 | 제목/메시지 길이, 시작<종료 등 | `validators/*.validator.js` (route에서 controller 진입 전 호출) |

### 2.3 프론트엔드(React) 의존 방향

```
pages → components → hooks → api client
                         ↑
                    context/store (전역 상태, 최소 범위)
```

- **components**: 화면 요소. 데이터를 직접 fetch하지 않고, hooks가 반환한 데이터/함수만 사용한다.
- **hooks**: 도메인별 데이터 로딩·caching·mutation을 캡슐화(예: `useSchedules`, `useChatMessages`). api client를 호출하는 유일한 지점이다.
- **api client**: HTTP 요청만 담당하는 얇은 함수 모음. React를 알지 못한다(hook이나 컴포넌트를 import하지 않는다).
- **context/store**: 로그인 사용자, 현재 선택된 팀(BR-11) 등 여러 화면에 걸쳐 필요한 최소한의 전역 상태만 둔다. Redux 같은 별도 상태관리 라이브러리는 이 규모에서 불필요하므로 도입하지 않고 React Context로 충분히 처리한다.
- **pages**: 라우트 단위로 components/hooks를 "조립"만 한다. 비즈니스 로직을 pages에 직접 작성하지 않는다.

의존 방향 규칙: `components`는 `hooks`에만 의존하고 `api`를 직접 import하지 않는다. `hooks`는 `api`에 의존하고 `components`를 import하지 않는다(역방향 금지, 순환 금지).

---

## 3. 코드/네이밍 원칙

### 3.1 유비쿼터스 언어 ↔ 코드 매핑

도메인 정의서 §2의 용어집(TERM-01~09)이 DB 테이블명·타입명·폴더명에 그대로, 1:1로 반영되어야 한다. 번역이나 축약을 하지 않는다.

| TERM | 용어 | DB 테이블(snake_case, 복수형) | 코드 상 타입/모델명(PascalCase, 단수형) |
|---|---|---|---|
| TERM-01 | User | `users` | `User` |
| TERM-02 | Team | `teams` | `Team` |
| TERM-03/04 | 팀장/팀원(역할) | `team_members` (컬럼 `role`: `'leader' \| 'member'`) | `TeamMember`, `TeamRole` |
| TERM-05 | Schedule | `schedules` | `Schedule` |
| TERM-06 | ChatRoom | (물리적 테이블 없음 — 아래 3.1.1 참고) | (별도 타입 없음, `{ teamId, date }` 조합으로 표현) |
| TERM-07 | ChatMessage | `chat_messages` | `ChatMessage` |
| TERM-08 | ScheduleChangeRequest | `schedule_change_requests` | `ScheduleChangeRequest` |
| TERM-09 | ChatHistory | (물리적 테이블 없음, 조회 결과) | `ChatMessage[]` (날짜 범위 조회 결과) |

#### 3.1.1 ChatRoom을 물리적 테이블로 만들지 않는 이유

PRD §7은 `chat_rooms(team_id + date)` 테이블 또는 `date` 컬럼을 통한 논리적 구분 중 선택지를 열어 두었다. 도메인 정의서 §8은 "일자" 구분 기준을 서버 UTC 자정으로 이미 고정했고, ChatRoom 자체는 상태를 갖지 않는 순수한 식별 단위(팀 + 날짜)다. 상태도, CUD 대상도 아닌 개념을 위해 별도 테이블과 그에 딸린 FK/model 레이어를 만드는 것은 조기 추상화다. 따라서 **ChatRoom은 물리적 테이블을 만들지 않고, `chat_messages.team_id` + `chat_messages.chat_date` 조합으로 논리적으로만 표현**한다(1.1절 "조기 추상화 금지" 원칙 적용). 채팅 이력(TERM-09) 조회는 이 두 컬럼 기준 `WHERE` 조건으로 처리한다.

### 3.2 파일/폴더 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 백엔드 소스 파일 | `카멜케이스(리소스).역할.js` | `schedules.service.js`, `teamMembership.middleware.js` |
| 백엔드 폴더 | 소문자 복수형 | `routes/`, `services/`, `models/` |
| React 컴포넌트 파일 | PascalCase + `.jsx` | `ScheduleForm.jsx`, `ChatMessageInput.jsx` |
| React 훅 파일 | `use` + PascalCase + `.js` | `useSchedules.js`, `useChatMessages.js` |
| 프론트엔드 폴더 | 소문자, 도메인 단위 | `components/calendar/`, `components/chat/` |
| DB 테이블 | snake_case, 복수형 | `schedule_change_requests` |
| DB 컬럼 | snake_case | `team_id`, `is_change_request`, `created_at` |
| JS 변수/함수 | camelCase, 동사로 시작(함수) | `getSchedulesByTeam()`, `isTeamLeader` |
| 타입/클래스/모델 | PascalCase, 단수형 | `Schedule`, `ScheduleChangeRequest` |
| 상수/enum 값 | UPPER_SNAKE_CASE 또는 명시적 문자열 리터럴 | `'leader'`, `'member'`, `'GENERAL'`, `'CHANGE_REQUEST'` |

### 3.3 REST API 엔드포인트 네이밍 (리소스 기반)

- URL은 **명사(리소스)의 복수형**을 사용하고, 동사는 HTTP 메서드로 표현한다(`POST /schedules`이지 `POST /createSchedule`이 아니다).
- 팀에 종속된 리소스는 항상 `/teams/:teamId/...` 하위에 둔다 — 이는 BR-02(팀 소속 필수) 검증을 라우트 구조 자체로 드러내는 효과도 있다.
- 대표 엔드포인트(전수 목록이 아니라 규칙을 보여주는 예시):

| 메서드/경로 | 대응 FR | 비고 |
|---|---|---|
| `POST /api/auth/signup`, `POST /api/auth/login` | FR-01 | 팀에 종속되지 않는 유일한 예외 |
| `POST /api/teams`, `POST /api/teams/:teamId/members` (초대코드 가입) | FR-02 | |
| `GET /api/teams/:teamId/schedules?view=month&date=2026-07-01` | FR-03, BR-08 | 뷰 종류는 쿼리 파라미터 |
| `POST /api/teams/:teamId/schedules` | FR-04 | 팀장 전용(require-role 미들웨어) |
| `PATCH /api/teams/:teamId/schedules/:scheduleId`, `DELETE /api/teams/:teamId/schedules/:scheduleId` | FR-05 | |
| `GET /api/teams/:teamId/chat-messages?date=2026-07-01` | FR-07, TERM-09 | ChatRoom을 별도 리소스로 노출하지 않고 쿼리 파라미터로 표현(§3.1.1과 일치) |
| `POST /api/teams/:teamId/chat-messages` (body: `{ type: 'general'|'change_request', ... }`) | FR-08, FR-09 | 메시지 유형은 body 필드, URL을 분기하지 않음 |
| `GET /api/teams/:teamId/schedule-change-requests` | FR-10 | |
| `DELETE /api/teams/:teamId/members/me` | EX-01, EX-04 | 팀 탈퇴 |

---

## 4. 테스트/품질 원칙

### 4.1 테스트 범위 우선순위 — "전체 커버리지" 목표를 세우지 않는다

5일·1인 개발 제약(PRD §8, §9.1) 아래에서 커버리지 %를 목표로 잡는 것은 시간 대비 효용이 낮다. 대신 **"틀리면 도메인 규칙이 깨지는 지점"만 우선 테스트**한다.

**반드시 테스트한다 (자동화 우선순위 1):**
- BR-03/BR-04: 팀원이 일정 CUD API를 호출하면 403이 반환되는지 (`tests/routes/schedules.test.js`)
- BR-05: "일반 메시지"로 보낸 메시지에서는 ScheduleChangeRequest가 생성되지 않고, "변경 요청"으로 보낸 메시지에서만 1:1로 생성되는지 (`tests/services/scheduleChangeRequests.test.js`) — SC-06의 핵심 차별점이므로 최우선
- BR-01/BR-02: 미인증/미소속 요청이 차단되는지 (인증·팀 소속 미들웨어 통합 테스트)
- §8 데이터 제약: 제목 길이(1~100), 시작<종료, 메시지 길이(1~500), 대상 단일 선택 — `validators/*` 단위 테스트

**가능하면 테스트한다 (자동화 우선순위 2):**
- UC-01~07의 Happy Path 흐름을 각 1개씩 통합 테스트로 (SC-01~09 문서를 테스트 케이스의 원본으로 그대로 사용)
- BR-09/BR-11/BR-12(팀 라이프사이클 예외, EX-01/EX-04): 팀장 탈퇴 차단, 마지막 팀 탈퇴 후 계정 유지

**의도적으로 생략한다 (시간 부족 시 가장 먼저 포기):**
- UI 스냅샷/시각적 회귀 테스트
- EX-02(동시 수정 충돌·Last-Write-Wins)의 자동화된 동시성 테스트 — Day 5에 수동으로 1회 확인하는 것으로 대체
- 접근성 테스트, 다국어 테스트, 브라우저 호환성 매트릭스 — PRD §6에서 이미 범위 외로 규정된 항목이므로 테스트 대상도 아니다
- 성능/부하 테스트 — PRD §9.2 로드맵 항목

### 4.2 도구

- 백엔드: `node:test`(내장) 또는 Jest 중 택1 + `supertest`로 라우트 통합 테스트. 별도 테스트 DB는 로컬 PostgreSQL 스키마를 재사용하되 테스트 전용 시드/초기화 스크립트만 최소한으로 둔다.
- 프론트엔드: 자동화 테스트는 최소화한다. 시간이 남을 때만 `ChatMessageInput`(일반/변경요청 분기, BR-05)처럼 로직이 있는 컴포넌트에 한해 React Testing Library로 1~2개 케이스를 작성한다. 전체 컴포넌트에 대한 테스트 커버리지를 목표로 하지 않는다.
- Day 5(PRD §8)의 "통합 테스트" 시간은 자동화 테스트 작성보다 **SC-01~09 시나리오를 수동으로 순서대로 실행해보는 회귀 점검**에 우선 배정한다 — 자동화 인프라 구축 자체가 5일 예산을 잠식할 위험이 크기 때문이다.

### 4.3 최소 품질 도구

- ESLint + Prettier를 저장소 루트에 하나씩 두고 `frontend/`, `backend/`가 공유하거나 각자 최소 설정으로 상속한다. 규칙은 기본 권장 설정(`eslint:recommended`, React용 플러그인 정도) 이상으로 커스터마이징하지 않는다.
- pre-commit hook(예: husky)은 도입해도 되지만 필수는 아니다 — 1인 개발이므로 강제할 대상이 본인뿐이며, 도구 설정 자체가 5일 일정을 깎아먹지 않도록 시간이 남을 때만 추가한다.
- 커밋 전 최소 확인: 린트 통과, 방금 작업한 BR-xx 관련 테스트 통과. CI 파이프라인(GitHub Actions 등)은 있으면 좋지만 없어도 무방한 수준으로 둔다(예산 최소화 전제와 일치).

---

## 5. 설정/보안/운영 원칙

### 5.1 환경변수·시크릿 관리

- 모든 환경별 값(DB 접속 정보, JWT 시크릿, 포트 등)은 `.env` 파일로 관리하고 `dotenv`로 로드한다. `backend/.env.example`, `frontend/.env.example`을 커밋해 필요한 키 목록만 공유하고, 실제 `.env`는 `.gitignore`에 포함해 저장소에 올리지 않는다.
- 배포 환경(PaaS)의 시크릿은 코드에 하드코딩하지 않고 해당 플랫폼의 환경변수 설정 기능을 사용한다(PRD §7 "무료/저비용 티어" 전제와 일치). 별도의 시크릿 매니저(Vault 등) 도입은 이 규모에서 과설계이므로 도입하지 않는다.
- 환경변수 로딩·검증은 `backend/src/config/env.js` 한 곳에서만 수행하여, 필수 값 누락 시 서버 기동 시점에 즉시 실패하도록 한다(런타임 중간에 실패하는 것보다 안전).

### 5.2 보안 — 어느 레이어에서 무엇을 처리하는가

PRD §6(비기능요구사항)에서 요구한 보안 항목을 구조 관점에서 아래와 같이 배치한다.

| 보안 요구사항(PRD §6) | 구조상 위치 |
|---|---|
| 비밀번호 해시 저장 | `services/auth.service.js` (bcrypt 등으로 해시 후 `models/user.model.js`에 저장, 평문은 service 경계를 넘지 않음) |
| HTTPS | 애플리케이션 코드가 아니라 배포 플랫폼(PaaS)의 TLS 종단 기능에 위임 — 별도 코드 불필요 |
| 인증 토큰(JWT) 기반 접근 제어 (BR-01) | 발급: `services/auth.service.js` / 검증: `middlewares/auth.middleware.js`, 모든 보호된 라우트 앞단에서 공통 적용 |
| 팀 소속 검증 (BR-02) | `middlewares/team-membership.middleware.js`, `/teams/:teamId/...` 하위 라우트에 공통 적용. 라우트 URL 구조(3.3절)가 이 검증 지점을 그대로 드러낸다 |
| 팀장 전용 액션 제어 (BR-03/BR-04) | `middlewares/require-role.middleware.js`를 라우트 선언 시 명시적으로 부착. 이중 방어를 위한 서비스 레벨 재검증까지는 하지 않는다(단일 지점 검증으로 충분 — 조기 방어적 설계 금지) |

정교한 보안 감사·침투테스트는 PRD §6에서 이미 범위 외로 규정했으므로 구조에도 반영하지 않는다.

### 5.3 운영 — 로깅/에러 처리/배포

- **로깅**: `morgan` 같은 경량 HTTP 요청 로깅 미들웨어 + 에러 발생 시 콘솔 스택 트레이스 수준으로 한정한다. 별도 로그 수집·분석 인프라(ELK, Datadog 등)는 도입하지 않는다(가용성 요구사항 없음, PRD §6).
- **에러 처리**: `middlewares/error-handler.middleware.js` 하나로 모든 에러를 일관된 JSON 형식(`{ error: { message, code } }` 등)으로 응답한다. 도메인 규칙 위반(BR-03 위반, §8 검증 실패 등)과 서버 내부 오류를 구분해 적절한 HTTP 상태 코드로 매핑하되, 에러 클래스 계층을 과도하게 세분화하지 않는다.
- **배포**: 단일 인스턴스, PaaS형 무료/저비용 티어를 기본 가정으로 한다(PRD §7). 백엔드(Node.js 프로세스)와 프론트엔드(정적 빌드 산출물)는 독립적으로 배포되며, 저장소는 하나여도(§1.2) 배포 파이프라인은 `frontend/`, `backend/` 각 폴더를 대상으로 분리 실행한다. 이중화·오토스케일링·로드밸런서는 MVP 범위에 포함하지 않는다.
- **향후 확장(3,000+ 팀)을 가로막지 않는 최소 구조적 배려**: PRD §6·§9와 정합하도록 아래만 지금 반영하고, 나머지 스케일링 작업은 로드맵으로 유보한다.
  - `schedules`, `chat_messages`, `schedule_change_requests`, `team_members` 등 팀에 종속된 모든 테이블에 `team_id` 컬럼과 인덱스를 둔다(마이그레이션 설계 시점에 반영).
  - 백엔드 서버는 세션을 메모리에 들고 있지 않는 **상태 비저장(stateless) 구조**로 만든다(인증은 JWT로 처리해 서버 인스턴스 간 세션 공유 문제를 애초에 만들지 않음) — 이는 향후 수평 확장을 가로막지 않기 위한 선택이며, 지금 당장 여러 인스턴스를 운영한다는 뜻은 아니다.
  - DB 커넥션은 `pg`의 기본 `Pool`만 사용하고, 커넥션 풀 세부 튜닝·읽기 복제본·캐싱 레이어는 도입하지 않는다(PRD §9.2 로드맵).

---

## 6. 프론트엔드/백엔드 디렉토리 구조

### 6.1 저장소 최상위

```
team-caltalk/
├── frontend/              # React SPA (§1.2 근거: 모노레포, 폴더 분리)
├── backend/                # Node.js + Express REST API
├── docs/                   # 도메인 정의서, PRD, 사용자 시나리오, 본 문서 등
├── .gitignore
└── README.md
```

### 6.2 프론트엔드 (`frontend/`)

```
frontend/
├── public/
├── src/
│   ├── api/                              # API 클라이언트 — HTTP 요청만 담당(§2.3)
│   │   ├── client.js                      # 공통 fetch 래퍼(baseURL, JWT 헤더 부착)
│   │   ├── auth.api.js                    # TERM-01 User: 회원가입/로그인 (FR-01)
│   │   ├── teams.api.js                   # TERM-02 Team, TeamMember: 생성/가입/전환/탈퇴 (FR-02, BR-11, EX-01/04)
│   │   ├── schedules.api.js               # TERM-05 Schedule (FR-03~05)
│   │   ├── chatMessages.api.js            # TERM-06(논리적)/TERM-07/09: 채팅 이력·메시지 전송 (FR-07~09)
│   │   └── scheduleChangeRequests.api.js  # TERM-08 ScheduleChangeRequest (FR-10)
│   │
│   ├── hooks/                            # 도메인별 데이터 훅(§2.3) — api client의 유일한 호출자
│   │   ├── useAuth.js
│   │   ├── useTeams.js
│   │   ├── useSchedules.js                # BR-08 월/주/일 조회 상태 관리
│   │   ├── useChatMessages.js             # BR-06/07 날짜별 채팅 이력
│   │   └── useScheduleChangeRequests.js   # BR-05 관련 조회/생성
│   │
│   ├── components/
│   │   ├── calendar/                      # TERM-05 Schedule UI
│   │   │   ├── CalendarView.jsx            # 월/주/일 뷰 전환 컨테이너 (BR-08)
│   │   │   ├── MonthView.jsx
│   │   │   ├── WeekView.jsx
│   │   │   ├── DayView.jsx
│   │   │   └── ScheduleForm.jsx            # 팀장 전용 CUD 폼 (BR-03, §8 검증)
│   │   ├── chat/                          # TERM-06(논리적)/TERM-07 ChatMessage UI
│   │   │   ├── ChatPanel.jsx               # 캘린더-채팅 연동 패널 (BR-07)
│   │   │   ├── ChatMessageList.jsx         # TERM-09 채팅 이력 렌더링
│   │   │   ├── ChatMessageInput.jsx        # 일반/변경요청 명시적 선택 UI (BR-05, TERM-07/08)
│   │   │   └── ChangeRequestBadge.jsx      # 변경요청 메시지 시각적 구분
│   │   ├── change-requests/               # TERM-08 ScheduleChangeRequest UI (팀장 전용)
│   │   │   └── ChangeRequestList.jsx       # 미반영 요청 목록 (FR-10)
│   │   ├── teams/                         # TERM-02 Team UI
│   │   │   ├── TeamSwitcher.jsx            # 다중 팀 전환 (BR-11)
│   │   │   └── TeamSettings.jsx            # 팀 탈퇴 등 (EX-01, EX-04)
│   │   └── common/                        # 버튼/모달 등 범용 UI 요소
│   │
│   ├── pages/                            # 라우트 단위 조립(로직 없음, §2.3)
│   │   ├── LoginPage.jsx                   # SC-01
│   │   ├── CalendarPage.jsx                # SC-01~03, SC-08 (캘린더+채팅 연동 메인 화면)
│   │   └── TeamSettingsPage.jsx            # EX-01, EX-04
│   │
│   ├── context/                          # 전역 상태 최소 범위(§2.3)
│   │   ├── AuthContext.jsx                 # 로그인 사용자(TERM-01)
│   │   └── CurrentTeamContext.jsx          # 현재 선택된 팀(BR-11)
│   │
│   ├── utils/                            # 날짜 포맷 등 범용 유틸(도메인 로직 없음)
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
└── .env.example
```

### 6.3 백엔드 (`backend/`)

```
backend/
├── src/
│   ├── routes/                           # 리소스 기반 라우트(§3.3), controller로 위임만
│   │   ├── auth.routes.js                 # TERM-01 (FR-01)
│   │   ├── teams.routes.js                # TERM-02/TeamMember (FR-02, BR-09/11/12)
│   │   ├── schedules.routes.js            # TERM-05 (FR-03~05)
│   │   ├── chatMessages.routes.js         # TERM-06(논리적)/07 (FR-07~09)
│   │   └── scheduleChangeRequests.routes.js  # TERM-08 (FR-10)
│   │
│   ├── controllers/                      # req/res 변환만(§2.2)
│   │   ├── auth.controller.js
│   │   ├── teams.controller.js
│   │   ├── schedules.controller.js
│   │   ├── chatMessages.controller.js
│   │   └── scheduleChangeRequests.controller.js
│   │
│   ├── services/                         # 비즈니스 로직 — BR-xx 구현 위치(§2.2)
│   │   ├── auth.service.js                # BR-01, 비밀번호 해시(§5.2)
│   │   ├── teams.service.js               # BR-02, BR-09, BR-11, BR-12
│   │   ├── schedules.service.js           # BR-03, BR-04, BR-08
│   │   ├── chatMessages.service.js        # BR-06, BR-07
│   │   └── scheduleChangeRequests.service.js  # BR-05 (핵심 차별점, SC-06/07)
│   │
│   ├── models/                           # PostgreSQL 쿼리 전담(§2.2), BR-10은 여기서 단순 UPDATE
│   │   ├── user.model.js                  # users
│   │   ├── team.model.js                  # teams
│   │   ├── teamMember.model.js            # team_members
│   │   ├── schedule.model.js              # schedules
│   │   ├── chatMessage.model.js           # chat_messages
│   │   └── scheduleChangeRequest.model.js # schedule_change_requests
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js             # BR-01 JWT 검증
│   │   ├── teamMembership.middleware.js   # BR-02 팀 소속 검증
│   │   ├── requireRole.middleware.js      # BR-03/04 팀장 전용 액션 차단
│   │   └── errorHandler.middleware.js     # 공통 에러 응답(§5.3)
│   │
│   ├── validators/                       # §8 데이터 제약 검증
│   │   ├── schedule.validator.js          # 제목 1~100자, 시작<종료, 대상 단일 선택
│   │   └── chatMessage.validator.js       # 메시지 1~500자
│   │
│   ├── db/
│   │   ├── pool.js                        # pg Pool 초기화(§5.3, 튜닝 없음)
│   │   └── migrations/                    # PostgreSQL 마이그레이션(§3.1 테이블 정의)
│   │       ├── 001_create_users.sql
│   │       ├── 002_create_teams.sql
│   │       ├── 003_create_team_members.sql
│   │       ├── 004_create_schedules.sql
│   │       ├── 005_create_chat_messages.sql       # team_id, chat_date 컬럼 포함(§3.1.1)
│   │       └── 006_create_schedule_change_requests.sql  # chat_message_id 1:1 FK(§8)
│   │
│   ├── config/
│   │   └── env.js                         # 환경변수 로딩/검증(§5.1)
│   │
│   ├── app.js                             # Express 앱 조립(미들웨어·라우트 등록)
│   └── server.js                          # 진입점(listen)
│
├── tests/
│   ├── services/                         # BR-xx 단위 테스트(§4.1 우선순위 1)
│   └── routes/                           # 인증/권한 통합 테스트(supertest)
│
├── package.json
└── .env.example
```

---

## 7. 정합성 확인 체크리스트

- [x] 외부 연동(Google Calendar, Slack 등)을 위한 어댑터 레이어를 만들지 않음 (도메인 정의서 §10.2, PRD §3.2와 일치)
- [x] ScheduleChangeRequest 테이블/타입에 승인·반려 상태 필드를 두지 않음 (도메인 정의서 §1.2, TERM-08과 일치)
- [x] 접근성(A11y)·다국어 대응을 위한 별도 구조(예: i18n 폴더, ARIA 유틸)를 두지 않음 (PRD §6과 일치)
- [x] 낙관적 잠금 등 동시성 제어 구조를 두지 않고 BR-10(Last-Write-Wins)에 맞춰 단순 UPDATE로 처리 (도메인 정의서 §10.2와 일치)
- [x] ChatRoom을 위한 물리적 테이블/모델을 만들지 않고 팀+날짜 조합으로 논리적으로만 표현 (PRD §7의 선택지 중 단순한 쪽을 5일 제약에 맞게 채택)
- [x] 프론트엔드/백엔드를 별도 저장소로 분리하지 않고 단일 저장소 + 폴더 분리로 결정 (1인 개발·5일 MVP 근거 명시)
- [x] 테스트는 전체 커버리지가 아니라 BR-xx 핵심 규칙과 UC-xx Happy Path 중심으로 범위를 한정 (PRD §8·§9.1과 일치)
- [x] team_id 인덱싱, 상태 비저장 서버 등 "확장을 막지 않는" 최소한의 배려만 반영하고 실제 스케일 검증은 로드맵으로 유보 (PRD §6, §9.2와 일치)
