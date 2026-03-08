# Admin 사용자별 질문/응답 조회 이슈 조사 및 작업 계획

## 1) 현상 요약
- 관리자 화면(사용자별 질문·응답 조회)에서는 질문은 보이지만 응답이 `응답 없음`으로 표시되는 케이스가 발생한다.
- 사용자 본인 화면에서는 동일 데이터가 정상 매칭되어 보인다.

## 2) 코드 기반 조사 결과

### A. 관리자 응답 조회의 키 의존 구조
- 관리자 API `getUserAssignments`는 `/assignments/user/{userId}`의 path `userId`를 기준으로 할당을 조회한다.
- `includeResponses=true`일 때도 응답은 최종적으로 `contentId::userId` 복합키 형태로 매핑해 연결한다.
- 따라서 "할당을 조회한 userId"와 "응답을 저장한 userId"가 다르면 매칭 실패한다.

### B. 사용자 본인 화면은 claims.sub 단일 축으로 조회
- 사용자 API `getMyContents`/`getMyResponse`는 `event.requestContext.authorizer.claims.sub`를 기준으로 할당/응답을 조회한다.
- 응답 매핑 시 `contentId`, `assignmentId`, `sourceContentId`를 폭넓게 비교해 fallback 처리한다.
- 즉 사용자 본인 화면은 동일한 sub 축으로 조회되므로 매칭 성공 확률이 높다.

### C. 관리자 사용자 목록의 소스 제한
- 관리자 화면은 현재 프런트에서 `/quest/admin/users/premium`만 호출해 사용자 목록을 가져온다.
- `listPremiumUsers`는 `premium` 그룹 사용자만 반환한다.
- 목표(전체 사용자 조회)와 현재 구현(프리미엄 전용)이 불일치한다.

## 3) 가능한 근본 원인
1. **ID 축 불일치**: 할당/응답의 실제 PK는 `sub`인데 관리자에서 `username` 또는 다른 식별자로 path userId를 넣어 조회하는 경우.
2. **사용자 목록 데이터 누락**: Cognito 응답에서 `sub` 누락/오염 시 관리자 API가 fallback 후보를 충분히 못 받는 경우.
3. **응답 포맷 다양성**: 응답 JSON은 식별되지만, `responses` 중첩 포맷이 다양해 렌더링 정규화가 일부 케이스를 놓칠 수 있음.

## 4) 목표 달성을 위한 구현 계획

### Phase 1 — 조회 안정화(핵심)
1. **관리자 API에서 user identity 해석 강화**
   - 입력 식별자(`sub`, `username`, `email`)를 받아 실제 `sub`를 resolve하는 레이어를 추가.
   - 이후 할당/응답 조회는 가능한 한 `sub` 우선으로 고정.
2. **매칭 규칙 확장 + 진단 로그 강화**
   - `assignment.contentId`, `assignment.sourceContentId` vs `response.contentId|assignmentId|sourceContentId` 조합 매칭 유지.
   - 응답 미매칭 시 어떤 키가 비교됐는지(PII 제외) 디버그 필드 추가.
3. **API 응답에 진단 필드 제공(관리자 전용)**
   - `resolvedUserIds`, `responseCount`, `unmatchedAssignmentCount` 같은 메타를 반환해 원인 파악 가능하게 함.

### Phase 2 — 사용자 목록 범위 확장(목표 반영)
1. **신규 관리자 API: 전체 사용자 목록 조회**
   - `listUsers`(Cognito) 기반으로 전체 사용자 조회 Lambda 추가(페이지네이션 지원).
   - 각 사용자에 대해 `sub`, `username`, `email`, `name`을 정규화해 반환.
2. **기존 premium API는 필터 모드로 유지**
   - `/users/premium`은 유지하고, `/users`를 기본 목록으로 전환.
3. **관리자 UI에서 필터 토글 제공**
   - "전체 / premium" 토글 + 검색(이메일/이름/username) 지원.

### Phase 3 — 응답 렌더링 일관화(메인과 동일 경험)
1. **공용 정규화 유틸 도입**
   - 사용자 화면(`QuestDetail`)과 관리자 화면(`QuestResponsesByUser`)이 공통 `normalizeResponse` 유틸을 사용하도록 통합.
2. **응답 타입별 렌더 정책 통일**
   - 객관식: index/value 혼재 대응.
   - 주관식/구조화 JSON: 배열/객체/문자열 안전 출력.
3. **"응답 없음" 판정 기준 축소**
   - `read/watched/status` 등 비텍스트 응답도 유효 응답으로 판정.

## 5) 세부 작업 체크리스트
- [ ] 백엔드: 관리자 `getUserAssignments`에 identity resolve 계층 추가.
- [ ] 백엔드: 전체 사용자 조회 Lambda(`quest-admin/listUsers`) 추가.
- [ ] 백엔드: API Gateway 라우트/권한 연결.
- [ ] 프런트: 사용자 목록 API를 `/users`로 전환 + premium 필터 옵션 추가.
- [ ] 프런트: 응답 정규화 공용 유틸 분리 및 관리자/사용자 화면 공통 사용.
- [ ] QA: 샘플 사용자(응답 있음/없음, sub/username 혼재)로 회귀 테스트.

## 6) 검증 계획
1. 동일 사용자에 대해 다음 3개 식별자(`sub`, `username`, `email`)로 관리자 조회 호출 시 결과 동일성 확인.
2. 사용자 본인 화면과 관리자 화면의 질문-응답 매칭 결과를 assignment 단위로 diff 비교.
3. JSON/배열/객체/문자열 응답 포맷 각각에 대해 UI 출력 스냅샷 검증.

## 7) 롤아웃/리스크
- **리스크**: Cognito `ListUsers` 비용/페이지네이션 처리 미흡 시 관리자 목록 지연.
- **대응**: 서버 페이지네이션 + 프런트 검색 + 필요 시 최근 활성 사용자 우선 로딩.
- **리스크**: 기존 운영 데이터의 키 불일치가 심한 경우 즉시 100% 복구 어려움.
- **대응**: 진단 필드/로그로 케이스 수집 후 매칭 규칙을 점진 확장.
