# sayme-analysis-request — 나의 만다라트 신청/보고서 서비스

사용자가 만다라트 2장(나를 완성시켜주는 것들 / 나를 괴롭히는 것들)을 입력하면
관리자가 확인 → 보고서(HTML) 작성 → 전송(이메일 알림) 하는 서비스의 백엔드 Lambda 입니다.

| 구분 | 내용 |
|---|---|
| Lambda | `sayme-analysis-request` (단일 함수, 내부 라우팅) · Node.js 18+ |
| DynamoDB | `sayme-analysis-requests` (PK `requestId`), GSI `userId-createdAt-index` |
| 알림 | 신규 접수 → Slack Incoming Webhook / 보고서 전송 → SES 이메일 |
| 프론트 | `/mandalart` (사용자), `/admin/mandalart` (관리자) |

## 1. 상태 흐름

`submitted`(접수 완료) → `confirmed`(관리자 확인) → `writing`(보고서 작성 중) → `sent`(보고서 전송 완료)

- 보고서 초안 저장 시 `submitted/confirmed` 이면 자동으로 `writing` 으로 올라갑니다.
- `sent` 는 `/send` 엔드포인트로만 전환되며, 이때 이메일이 발송됩니다.
- 사용자는 언제든 본인 입력값과 상태를 조회할 수 있고, `sent` 이후 보고서 HTML 을 볼 수 있습니다.

## 2. API

API Gateway (REST) 에 `/analysis-request` 리소스와 `/analysis-request/{proxy+}` 를 만들고
**ANY → Lambda 프록시 통합** 으로 연결합니다. (CORS 는 Lambda 가 직접 처리, OPTIONS 도 Lambda 로 전달)

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| POST | `/analysis-request` | 로그인 | 입력 제출 `{ name, phone, email?, answers, consent:true, source? }` → Slack 알림 |
| GET | `/analysis-request/mine` | 로그인 | 내 신청 목록 |
| GET | `/analysis-request/{id}` | 본인/관리자 | 신청 상세 (전송 후 `reportHtml` 포함) |
| GET | `/analysis-request/{id}/report?token=` | 없음 | 이메일 링크용 보고서 조회 (토큰) |
| GET | `/analysis-request/admin?status=` | Admins | 전체 목록 + 상태별 카운트 |
| GET | `/analysis-request/admin/export?status=` | Admins | CSV 다운로드 (UTF-8 BOM, answers 평탄화) |
| GET | `/analysis-request/admin/{id}` | Admins | 상세 (토큰·메모 포함) |
| PUT | `/analysis-request/admin/{id}/status` | Admins | `{ status, adminNote? }` · status 생략 시 메모만 저장 |
| PUT | `/analysis-request/admin/{id}/report` | Admins | `{ reportTitle, reportHtml }` 초안 저장 |
| POST | `/analysis-request/admin/{id}/send` | Admins | `{ reportHtml?, reportTitle?, email? }` 전송 + 이메일 |
| DELETE | `/analysis-request/admin/{id}` | Admins | 삭제 |

인증: `Authorization: Bearer <id 또는 access 토큰>` (aws-jwt-verify 로 검증).
API Gateway 에 Cognito Authorizer 를 붙인 경우 `requestContext.authorizer.claims` 를 우선 사용합니다.
관리자 판정은 `cognito:groups` 에 `Admins` 포함 여부입니다.

## 3. 환경변수

| 이름 | 필수 | 설명 |
|---|---|---|
| `COGNITO_USER_POOL_ID` | ✅ | 예: `ap-northeast-2_egqvLgHX0` |
| `COGNITO_CLIENT_ID` | ✅ | 예: `4e5k8vs12cuudmka7m4mnjdkum` |
| `ANALYSIS_REQUESTS_TABLE` | | 기본 `sayme-analysis-requests` |
| `ANALYSIS_REQUESTS_USER_INDEX` | | 기본 `userId-createdAt-index` |
| `DYNAMODB_USERS_TABLE` | | 기본 `sayme-users` (토큰에 이메일이 없을 때 조회) |
| `APP_BASE_URL` | ✅ | 프론트 주소. 이메일의 보고서 링크 `${APP_BASE_URL}/mandalart/report/?id=..&token=..` |
| `ADMIN_BASE_URL` | | Slack 버튼 링크용 (기본: APP_BASE_URL) |
| `SLACK_WEBHOOK_URL` | 알림용 | Slack Incoming Webhook URL. 없으면 Slack 알림 생략 |
| `SES_FROM_EMAIL` | 알림용 | SES 에서 검증된 발신 주소. 없으면 이메일 생략 |
| `SES_REPLY_TO` | | 회신 주소 |
| `SES_REGION` | | 기본 `AWS_REGION` |
| `SERVICE_NAME` | | 이메일 브랜드명 (기본 `Sayme`) |
| `ADMIN_GROUP` | | 기본 `Admins` |

## 4. 배포 절차

```bash
# 1) DynamoDB 테이블 + GSI
aws dynamodb create-table \
  --table-name sayme-analysis-requests \
  --attribute-definitions AttributeName=requestId,AttributeType=S AttributeName=userId,AttributeType=S AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=requestId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[{"IndexName":"userId-createdAt-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --region ap-northeast-2

# 2) IAM: 기존 sayme-lambda-execution-role 에 아래 권한 추가
#    dynamodb:PutItem/GetItem/Query/Scan/UpdateItem/DeleteItem  on  sayme-analysis-requests (+ /index/*)
#    dynamodb:GetItem  on  sayme-users
#    ses:SendEmail, ses:SendRawEmail

# 3) 패키징 & 함수 생성/업데이트
cd backend/lambda/analysis-request
npm ci --omit=dev
npm run zip                       # function.zip
aws lambda create-function --function-name sayme-analysis-request \
  --runtime nodejs20.x --handler index.handler --zip-file fileb://function.zip \
  --role arn:aws:iam::<ACCOUNT_ID>:role/sayme-lambda-execution-role --timeout 20 --region ap-northeast-2
# 이후 업데이트: aws lambda update-function-code --function-name sayme-analysis-request --zip-file fileb://function.zip

# 4) 환경변수
aws lambda update-function-configuration --function-name sayme-analysis-request --environment \
 "Variables={COGNITO_USER_POOL_ID=...,COGNITO_CLIENT_ID=...,APP_BASE_URL=https://<app-domain>,SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...,SES_FROM_EMAIL=noreply@<domain>}"

# 5) API Gateway (기존 h1l7cj53v9 / dev 스테이지)
#    - 리소스 /analysis-request 생성, ANY 메서드 → Lambda 프록시 통합
#    - 하위 리소스 /analysis-request/{proxy+} 생성, ANY 메서드 → Lambda 프록시 통합
#    - Lambda 에 API Gateway 호출 권한(add-permission) 부여 후 dev 스테이지 배포

# 6) SES: 발신 주소(또는 도메인) 검증. 샌드박스 상태라면 수신자도 검증 필요 → 프로덕션 액세스 요청
# 7) Slack: 채널에 Incoming Webhook 앱 추가 → URL 을 SLACK_WEBHOOK_URL 에 설정
```

## 5. 테스트

```bash
npm install
npm test          # 인메모리 DynamoDB 흉내로 전체 흐름 검증 (제출→확인→작성→전송, CSV, Slack, 이메일)
```

## 6. 데이터 항목 (sayme-analysis-requests)

`requestId, userId, username, name, email, phone, answers, consent, source, status, statusHistory[{status,at,by}],
adminNote, reportTitle, reportHtml, reportUpdatedAt, sentAt, emailSentAt, emailError, emailTo, viewToken, createdAt, updatedAt`

`answers` 구조 (프론트 `frontend/lib/mandalart.js` 참고):
```json
{
  "complete": { "title": "나를 완성시켜주는 것들", "subLabels": ["1년 뒤 계획","2년 뒤 계획","3년 뒤 계획"],
                "items": [ { "text": "가족", "subs": ["...", "...", "..."] }, "... x8" ] },
  "torment":  { "title": "나를 괴롭히는 것들", "subLabels": ["괴로운 이유","내가 느끼는 감정","괴롭지 않으려면"], "items": [ "... x8" ] }
}
```

보안 메모: 관리자가 작성한 보고서 HTML 은 저장 시 `<script>/<iframe>/on*` 속성/`javascript:` 를 제거합니다.
이메일 링크의 `viewToken` 은 24바이트 난수이며 관리자 API 응답에만 노출됩니다.
