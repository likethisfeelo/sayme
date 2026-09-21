# sayme-auth-refresh — 세션 연장 (리프레시 토큰)

프론트가 access/id 토큰 만료 전에 이 API 를 호출해 새 토큰을 받습니다. 리프레시 토큰이 유효한 동안(설정값, 기본 7일) 재로그인 없이 계속 사용할 수 있습니다.

## 배포 (PowerShell, 이 폴더에서)

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```

스크립트가 하는 일:
1. 기존 `sayme-auth-login` 함수 설정에서 역할 ARN, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET` 을 읽어옴 (시크릿을 손으로 다룰 필요 없음)
2. `index.js`, `package.json` 만 zip (AWS SDK v3 는 Lambda 런타임 내장이라 `node_modules` 불필요)
3. `sayme-auth-refresh` 생성 또는 코드 업데이트, 환경변수 설정
4. `backend/scripts/cognito-token-validity.ps1` 을 이어서 실행해 토큰 유효기간 변경 + API Gateway `/auth/refresh` 연결

## API Gateway

`h1l7cj53v9` 의 `/auth` 아래에 리소스 `refresh` 를 만들고 **POST + OPTIONS** 를 Lambda 프록시 통합으로 연결한 뒤 `dev` 스테이지에 배포합니다.
(`backend/scripts/cognito-token-validity.ps1` 이 API 연결까지 함께 처리합니다.)

## Cognito 앱 클라이언트 설정

- 인증 흐름에 `ALLOW_REFRESH_TOKEN_AUTH` 가 켜져 있어야 합니다 (기본 켜짐).
- 토큰 유효기간: `backend/scripts/cognito-token-validity.ps1` 참고 (access/id 24시간, refresh 기본 7일 = 로그인 유지 기간). 바꾸려면 `.\deploy.ps1 -RefreshTokenDays 30` 처럼 실행.
