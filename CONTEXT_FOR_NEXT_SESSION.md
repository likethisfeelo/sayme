# Sayme 프로젝트 - 다음 대화를 위한 컨텍스트

> 작성일: 2026-03-08

---

## 🏗️ 프로젝트 개요

**Sayme** - AWS 기반 Next.js + Lambda 풀스택 앱
코칭/멘토링 플랫폼으로 관리자가 사용자에게 퀘스트(질문지)를 할당하고, 응답을 관리·조회하는 서비스

### 스택
- **Frontend**: Next.js (App Router), Tailwind CSS → S3 + CloudFront 배포
- **Backend**: AWS Lambda (Node.js), API Gateway, DynamoDB, Cognito
- **리전**: ap-northeast-2 (서울)
- **API Base URL**: `https://h1l7cj53v9.execute-api.ap-northeast-2.amazonaws.com/dev`

---

## 📦 AWS 인프라 정보

| 서비스 | 값 |
|---|---|
| Cognito User Pool | `ap-northeast-2_egqvLgHX0` |
| Cognito Client ID | `4e5k8vs12cuudmka7m4mnjdkum` |
| DynamoDB 메인 테이블 | `sayme-users` |
| IAM Role | `sayme-lambda-execution-role` |

---

## 📁 프로젝트 구조 (주요 경로)

```
sayme/
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── page.jsx              # 어드민 메인 메뉴
│   │   │   ├── quest/
│   │   │   │   ├── page.js           # 퀘스트 관리 서브메뉴
│   │   │   │   ├── contents/         # 퀘스트 콘텐츠 CRUD
│   │   │   │   ├── assignments/      # 사용자별 할당 관리
│   │   │   │   └── responses/        # ⭐ 사용자 응답 조회 (핵심 기능)
│   │   │   ├── prequest/             # Prequest 관리
│   │   │   ├── goals/                # 사용자 목표 관리
│   │   │   ├── tickets/              # 티켓 부여
│   │   │   ├── consultation/         # 상담 요청 관리
│   │   │   └── premium-requests/     # 정회원 전환 신청 관리
│   │   ├── quest/                    # 사용자용 퀘스트 페이지
│   │   ├── prequest/                 # 사용자용 prequest 페이지
│   │   ├── me/                       # 마이페이지
│   │   └── ...
│   └── components/
│       └── admin/
│           └── quest/
│               ├── QuestResponsesByUser.js   # ⭐ 응답 조회 핵심 컴포넌트
│               ├── ContentList.js
│               ├── ContentForm.js
│               ├── AssignmentManager.js
│               └── UserAssignmentList.js
├── backend/
│   └── lambda/
│       ├── auth/             # signup, confirm, login, me, logout
│       ├── quest-admin/      # assignContent, createContent, deleteContent, getContent,
│       │                     # getContentStats, getUserAssignments, listContents,
│       │                     # listPremiumUsers, listUsers, unassignContent, updateContent
│       ├── quest-user/       # getContentDetail, getMyContents, getMyResponse,
│       │                     # saveResponse, listPremiumUsers, listUsers
│       ├── prequest-admin/   # Prequest 관리 Lambda들
│       ├── prequest-user/    # Prequest 사용자 Lambda들 (spl_prequest_*)
│       ├── consultation/     # 상담 관련
│       ├── ticket/           # 티켓 관련
│       ├── memo/             # 메모 관련
│       └── public-fortune/   # 포춘 메시지
└── lambda-temp/              # 임시 Lambda 스텁 (spl_prequest_*)
    ├── spl_prequest_createContent/
    ├── spl_prequest_deleteContent/
    ├── spl_prequest_getActivePrequests/
    ├── spl_prequest_getActiveQuestions/
    ├── spl_prequest_getContent/
    ├── spl_prequest_getMyResponses/
    ├── spl_prequest_listContents/
    ├── spl_prequest_saveResponse/
    ├── spl_prequest_setActiveQuestions/
    └── spl_prequest_updateContent/
```

---

## ✅ 완료된 작업 (Git 히스토리 기반)

### 어드민 Quest 응답 조회 기능 (PR #31~#38, 대규모 개선)

**핵심 문제**: 어드민이 사용자별 퀘스트 할당 질문과 응답을 매칭해서 보는 기능이 제대로 동작하지 않았음

**해결 과정**:

1. **PR #31** - `admin quest 응답 조회 안정화 및 JSON 내보내기 추가`
   - 초기 응답 조회 기능 구현

2. **PR #32** - `admin 응답 목록에 질문별 응답없음 표시 추가`
   - 질문 유형별 표시 (주관식/객관식) 개선

3. **PR #33** - `admin 응답 후보 선택 로직 보강으로 빈 응답 오탐 방지`

4. **PR #34** - `admin 응답 매핑 정규화로 응답없음 오탐 수정`

5. **PR #35** - `admin 응답 래퍼 객체 파싱 보강으로 매칭 누락 해결`
   - DynamoDB 중첩 JSON 구조 파싱 개선

6. **PR #36** - `admin 응답 JSON 문자열 표시 개선 및 컨테이너 재귀 파싱`

7. **PR #37** - `admin 질문-응답 매칭에 사용자 조회 방식 fallback 적용`

8. **PR #38** - `admin 조회 API 인증 재시도 및 401 메시지 개선`

9. **추가 커밋** (`b5e1a18`) - `feat(admin): 월간 질문·응답 일괄 조회 및 보고서 텍스트 복사 기능 추가`
   - 월 필터 드롭다운 추가
   - "전체 보기" / "한 건씩 보기" 토글
   - **보고서 텍스트 복사** 버튼 (클립보드에 텍스트 형식 보고서 복사)

10. **수정** (`53c62b2`) - `listUsers API에 Cognito sub(userId) 추가하여 어드민 응답 조회 버그 수정`
    - `listUsers` Lambda 반환값에 `userId`(Cognito sub) 누락 문제 수정

11. **수정** (`6dd93d5`) - `listUsers에서 email 없는 유저 처리 오류 수정`
    - email 없는 유저일 때 `undefined.split()` 오류 핫픽스

---

## 🔧 listUsers Lambda - 최종 코드

현재 브랜치(`claude/admin-bulk-export-questions-rJizN`)에서 수정한 **Lambda 함수 코드**:

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const result = await docClient.send(new ScanCommand({
      TableName: 'sayme-users'
    }));

    const users = (result.Items || []).map(user => ({
      sub: user.userId,           // ← Cognito sub (응답 조회 매칭에 필요)
      username: user.username,
      email: user.email,
      name: user.name || (user.email ? user.email.split('@')[0] : ''),  // ← email 없을 때 안전 처리
      nickname: user.nickname
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ users, count: users.length })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

> **배포 방법**: Lambda 콘솔 → 해당 함수 → 코드 탭 → index.js 교체 → Deploy

---

## 🎯 현재 브랜치 작업 태스크

**브랜치**: `claude/admin-bulk-export-questions-rJizN`
**태스크명**: Admin 일괄 질문 내보내기 (Bulk Export Questions)

### 현재 상태
- 브랜치가 최신 main(`6dd93d5`)과 동기화됨
- 커밋 3개가 이 브랜치에서 완료됨 (`b5e1a18`, `53c62b2`, `6dd93d5`)
- 아직 PR이 생성되지 않은 상태

### 구현된 기능 (QuestResponsesByUser.js)
- ✅ 사용자 선택 드롭다운 (premium 유저 목록)
- ✅ 월 필터 드롭다운
- ✅ 전체 보기 / 한 건씩 보기 토글
- ✅ 보고서 텍스트 복사 (클립보드)
- ✅ 개별 JSON 복사 / 다운로드
- ✅ 전체 JSON 다운로드
- ✅ 이 질문 응답 새로고침 버튼
- ✅ 질문-응답 매칭 (주관식/객관식, itemIndex 기반)
- ✅ 인증 재시도 (Bearer 토큰 fallback)
- ✅ 401 에러 메시지 개선

---

## ⚠️ 알려진 이슈 / 주의사항

1. **listUsers Lambda 배포 필요**: 코드는 이미 수정됐지만, AWS Lambda 콘솔에서 실제 배포(Deploy)를 해야 함. 로컬 파일 경로: `backend/lambda/quest-user/listUsers/` (현재 파일 없음 → Lambda 콘솔에서 직접 수정 필요)

2. **인증 방식**: `idToken`을 헤더에 직접 넣는 방식과 `Bearer {idToken}` 두 가지를 시도함 (fetchWithAuthRetry)

3. **응답 데이터 구조 복잡성**: DynamoDB에 저장된 응답 데이터가 중첩 JSON 문자열, 래퍼 객체 등 다양한 형태로 저장돼 있어 `normalizeResponses()` 함수가 여러 경우를 처리함

4. **사용자 ID 매칭**: `userId`(Cognito sub), `username`, `email` 세 가지 값을 모두 `extraUserIds`로 전달해 할당 데이터와 매칭

---

## 📝 다음에 할 일 (추정)

- [ ] 현재 브랜치의 PR 생성 및 main 머지
- [ ] 일괄 내보내기 기능 추가 개선 (있다면)
- [ ] Lambda 함수 AWS 콘솔 배포 확인
- [ ] 기타 미완성 기능 확인

---

## 🔗 주요 파일 경로

| 파일 | 역할 |
|---|---|
| `frontend/components/admin/quest/QuestResponsesByUser.js` | 어드민 응답 조회 핵심 컴포넌트 |
| `frontend/app/admin/quest/responses/page.js` | 응답 조회 페이지 라우트 |
| `frontend/app/admin/quest/page.js` | 퀘스트 관리 서브메뉴 |
| `frontend/app/admin/page.jsx` | 어드민 메인 메뉴 |
| `backend/lambda/quest-user/` | 사용자용 퀘스트 Lambda들 |
| `backend/lambda/quest-admin/` | 어드민용 퀘스트 Lambda들 |
| `lambda-temp/` | Prequest 임시 스텁 Lambda들 |
