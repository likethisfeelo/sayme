# sayme-auth-refresh — 세션 연장 (리프레시 토큰)

프론트가 access/id 토큰 만료 전에 이 API 를 호출해 새 토큰을 받습니다. 리프레시 토큰이 유효한 동안(기본 30일,
아래 설정으로 최대 10년) 재로그인 없이 계속 사용할 수 있습니다.

## 배포 (PowerShell, 이 폴더에서)

```powershell
npm ci --omit=dev
Compress-Archive -Path index.js, package.json, node_modules -DestinationPath function.zip -Force
# 첫 배포: 기존 login 함수와 같은 역할/환경변수 사용
aws lambda create-function --function-name sayme-auth-refresh --runtime nodejs20.x --handler index.handler `
  --zip-file fileb://function.zip --role arn:aws:iam::119778517834:role/service-role/sayme-auth-signup-role-2kzbkq9b `
  --timeout 10 --region ap-northeast-2
aws lambda update-function-configuration --function-name sayme-auth-refresh --region ap-northeast-2 `
  --environment "Variables={COGNITO_CLIENT_ID=4e5k8vs12cuudmka7m4mnjdkum,COGNITO_CLIENT_SECRET=<login 함수와 같은 값>}"
# 이후 코드만: aws lambda update-function-code --function-name sayme-auth-refresh --zip-file fileb://function.zip --region ap-northeast-2
```

> Compress-Archive 는 하위 폴더가 없는 이 함수에서는 문제없이 동작합니다.

## API Gateway

`h1l7cj53v9` 의 `/auth` 아래에 리소스 `refresh` 를 만들고 **POST + OPTIONS** 를 Lambda 프록시 통합으로 연결한 뒤 `dev` 스테이지에 배포합니다.
(`backend/scripts/cognito-token-validity.ps1` 이 API 연결까지 함께 처리합니다.)

## Cognito 앱 클라이언트 설정

- 인증 흐름에 `ALLOW_REFRESH_TOKEN_AUTH` 가 켜져 있어야 합니다 (기본 켜짐).
- 토큰 유효기간: `backend/scripts/cognito-token-validity.ps1` 참고 (access/id 24시간, refresh 3650일).
