# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(claude.ai/code)에게 제공되는 가이드입니다.

## 핵심 지침 (최우선 원칙)

- **오버엔지니어링 금지**: 이 프로젝트는 1인 개발·5일 MVP 제약(`docs/2-PRD.md`) 아래 있다. 현재 요구되지 않는 추상화, 확장 포인트, 미사용 필드, 범위 외 기능을 위한 구조를 미리 만들지 않는다. `docs/4-project-structure-principles.md`가 이미 이 원칙을 근거로 여러 설계를 단순화했으므로(예: ChatRoom 비테이블화), 같은 기준으로 판단한다.
- **모든 처리 결과에 대한 설명은 한국어로 작성한다.**

## 프로젝트 현황

Team CalTalk은 현재 **스펙/기획 단계**다. `frontend/`나 `backend/` 애플리케이션 코드는 아직 존재하지 않으며, 기획 문서와 OpenAPI 계약, 테스트용 목(mock) 서버만 있다. React 앱이나 Express API가 디스크에 이미 있다고 가정하지 말고 먼저 확인할 것. 실제 `frontend/`/`backend/` 앱을 만들 때는 새로 설계하지 말고 `docs/4-project-structure-principles.md`에 이미 확정된 구조와 결정(아래 "아키텍처" 참고)을 그대로 따라야 한다.

## 문서 체계 — 구현 전에 먼저 읽을 것

`docs/` 디렉터리는 ID로 서로 연결된 하나의 스펙 체인이며, 순서는 다음과 같다:

1. `docs/1-domain-definition.md` — 용어집(`TERM-xx`), 비즈니스 규칙(`BR-xx`), 데이터 제약(§8)
2. `docs/2-PRD.md` — 제품 요구사항(`FR-xx`, MoSCoW 우선순위), 비기능 요구사항
3. `docs/3-user-scenarios.md` — 정상 흐름 시나리오(`SC-xx`)와 예외 시나리오(`EX-xx`)
4. `docs/4-project-structure-principles.md` — 구속력 있는 아키텍처/디렉터리 구조/네이밍 결정 (아래 참고)
5. `docs/5-arch-diagram.md` — Mermaid 시스템/시퀀스/ER 다이어그램
6. `docs/6-execution-plan.md` — 레이어별 구현 Task(`DB-xx`, `BE-xx`, `FE-xx`), 각 Task마다 의존성과 검증 가능한 완료 조건 포함
7. `docs/8-wireframes.md` — 화면별 ASCII 와이어프레임(`WF-xx`)
8. `swagger/swagger.json` — 공식 REST API 계약(OpenAPI 3.0.3). 각 operation의 `description`에 위 ID들이 교차 인용되어 있음

#1 이후의 모든 문서는 `TERM-xx`/`BR-xx`/`UC-xx`로 거슬러 올라가며 이를 본문에 인용한다. 기능을 추가하거나 변경할 때는 먼저 관련 ID를 찾을 것 — 대부분의 결정은 이미 이 체인 어딘가에서 내려지고 근거가 남아 있으며, 이를 모르고 조용히 뒤집는 것(예: 명시적으로 범위 외로 규정된 것을 다시 넣는 것)은 수정이 아니라 회귀(regression)다.

## 이미 확정된 아키텍처 결정 (재논의하거나 어기지 말 것)

아래는 `docs/4-project-structure-principles.md`에서 온 것이며, 향후 구현 전체에 구속력을 가진다:

- **기술 스택**: React 프론트엔드(`frontend/`), Node.js + Express 백엔드(`backend/`), 단일 PostgreSQL 인스턴스. 외부 서비스 연동(Google Calendar, Slack 등) 없음 — 명시적으로 범위 외.
- **백엔드 레이어링**: `route → controller → service → model`, 리소스당 파일 하나(예: `schedules.service.js`). DDD/헥사고날 아키텍처 없음.
- **프론트엔드 의존 방향**: `pages → components → hooks → api client`, 전역 상태는 최소한의 `context/`만(현재 사용자, 현재 팀). Redux 없음 — 이 규모에서는 Context로 충분.
- **ChatRoom은 물리적 테이블이 아니다.** `chat_messages.team_id` + `chat_messages.chat_date`(일자 구분 기준 = 서버 UTC 자정) 조합으로만 존재한다. `chat_rooms` 테이블을 절대 추가하지 말 것.
- **ScheduleChangeRequest에는 상태 필드가 없다.** 승인/반려 워크플로 자체가 없다. 팀장은 일반적인 `PATCH /api/teams/{teamId}/schedules/{scheduleId}`로 일정을 직접 수정함으로써 요청을 "처리"하며, 요청 레코드 자체는 절대 변경되지 않는다. `status`/`approved`/`rejected` 필드나 승인용 엔드포인트를 추가하지 말 것.
- **동시성 처리는 예외 없이 Last-Write-Wins다.** 낙관적 잠금, 버전 컬럼, API 어디에도 `409` 응답 없음.
- **역할 모델**: 팀장/팀원 여부는 `users`나 `teams`가 아니라 `team_members.role`에만 존재한다. 한 사용자가 한 팀에서는 팀장, 다른 팀에서는 팀원일 수 있다.
- **API 필드명 vs DB 컬럼명**: 채팅 메시지의 "종류" 필드는 DB 컬럼명이 `chat_messages.message_type`임에도 API 레벨에서는 `type`(`general` | `change_request`)이다. 이 불일치는 의도된 것이며 `swagger.json`에 문서화되어 있다 — `docs/6-execution-plan.md`의 BE-06/07/09를 먼저 확인하지 않고 둘 중 하나를 임의로 "맞추지" 말 것.
- **범위 외** (만들지 말 것): 반복 일정, 푸시/이메일 알림, 네이티브 모바일 앱, 다국어(i18n), 접근성 대응, 여러 팀 일정을 병합한 캘린더 뷰(팀 전환만 지원), 외부 캘린더/채팅 연동.

## 명령어

아직 `frontend/`, `backend/`가 스캐폴딩되지 않았으므로 루트 레벨의 `package.json`, 빌드/린트/테스트 명령은 존재하지 않는다.

현재 실행 가능한 코드는 `mockup/`의 OpenAPI 목(mock) 서버뿐이다:

```bash
cd mockup
npm install                 # 최초 1회 실행됨; package.json 수정 후에는 재실행
node server.js              # 목 API는 :3000/api (../swagger/swagger.json 기반), Swagger UI는 :3000/docs
npx nodemon server.js       # 동일하되 자동 재시작 포함
```

`swagger/swagger.json` 수정 후 계약 유효성을 검증하려면:

```bash
node -e "JSON.parse(require('fs').readFileSync('swagger/swagger.json', 'utf8')); console.log('valid json')"
npx --yes @apidevtools/swagger-cli@latest validate swagger/swagger.json
```
