# Premium Registration / Admin List 배포 체크리스트

`/premium-registration`(기존) + `/premium-registration/admin`(신규 list-admin) 배포 시 필요한 설정 항목을 정리합니다.

## 1) Lambda 함수

### A. `sayme-premium-registration` (POST /premium-registration)
- 소스: `backend/lambda/premium-registration/index.js`
- 필요 환경변수
  - `AWS_REGION`
  - `COGNITO_USER_POOL_ID`
  - `COGNITO_CLIENT_ID`
  - `DYNAMODB_USERS_TABLE` (없으면 기본값 `sayme-users`)
- IAM 권한
  - `dynamodb:UpdateItem` on `DYNAMODB_USERS_TABLE`

### B. `sayme-premium-registration-list-admin` (GET /premium-registration/admin)
- 소스: `backend/lambda/premium-registration/list-admin/index.js`
- 필요 환경변수
  - `DYNAMODB_USERS_TABLE` (없으면 기본값 `sayme-users`)
- IAM 권한
  - `dynamodb:Scan` on `DYNAMODB_USERS_TABLE`
- 참고
  - 코드에서 리전은 현재 `ap-northeast-2` 하드코딩입니다.

---

## 2) API Gateway 라우팅

스테이지: `dev`

- `POST /premium-registration` → `sayme-premium-registration`
- `OPTIONS /premium-registration` → CORS 응답 (Lambda 또는 APIGW)
- `GET /premium-registration/admin` → `sayme-premium-registration-list-admin`
- `OPTIONS /premium-registration/admin` → CORS 응답 (Lambda 또는 APIGW)

### Authorizer 권장
- `/premium-registration`: Cognito Authorizer 적용 (로그인 사용자)
- `/premium-registration/admin`: Cognito Authorizer 적용 + Admins 그룹만 허용
  - 본 Lambda는 `cognito:groups`에 `Admins` 포함 여부를 검사합니다.

---

## 3) CORS 체크

두 Lambda 모두 아래 헤더를 반환하도록 구현되어 있습니다.

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Allow-Methods`
  - 등록: `POST, OPTIONS`
  - 관리자목록: `GET, OPTIONS`

API Gateway에서 별도 CORS 설정을 쓰는 경우, Lambda 응답 헤더와 충돌이 없는지 확인하세요.

---

## 4) 프론트 연동 확인 포인트

- 사용자 신청 API 호출
  - `frontend/lib/api/premium-registration.js`
  - `POST https://.../dev/premium-registration`
- 관리자 신청 목록 API 호출
  - `frontend/app/admin/premium-requests/page.jsx`
  - `GET https://.../dev/premium-registration/admin`

---

## 5) 배포 후 빠른 점검

1. 일반 사용자 토큰으로 `POST /premium-registration` 성공 확인
2. 일반 사용자 토큰으로 `GET /premium-registration/admin` 호출 시 `403` 확인
3. Admin 토큰으로 `GET /premium-registration/admin` 호출 시 `200` + 목록 응답 확인
4. 브라우저에서 `/admin/premium-requests` 접근 시 목록 렌더링 확인
5. CORS preflight(OPTIONS) 실패 없는지 확인

