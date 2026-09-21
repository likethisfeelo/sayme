# 나의 만다라트 서비스 (사용자 입력 → 관리자 분석 보고서)

## 화면
| 경로 | 대상 | 설명 |
|---|---|---|
| `/` `/trial-home` `/premium-home` `/premium-inactive-home` | 모두 | 상단 배너 (`MandalartBanner`) → 비로그인은 가입, 임시저장 있으면 이어서 작성 |
| `/mandalart` | 로그인 | 소개 + 내 신청 현황(상태 스텝) |
| `/mandalart/new` | 로그인 | 5단계 플로우: 완성 8칸 → 파고들기 → 괴롭힘 8칸 → 파고들기 → 확인·제출. 자동 저장(localStorage), Enter 로 다음 칸, 미입력 흔들림, 제출 시 confetti |
| `/mandalart/detail?id=` | 로그인 | 본인 입력값 조회 + 처리 상태(접수/관리자 확인/작성 중/전송 완료) + 보고서 열기 |
| `/mandalart/report?id=&token=` | 이메일 링크 | 로그인 없이 보고서 HTML 열람 (token 없으면 로그인 후 본인 것만) |
| `/admin/mandalart` | Admins | 목록·상태 필터·검색·CSV/JSON 다운로드 |
| `/admin/mandalart/detail?id=` | Admins | 입력 조회, 상태 변경, 메모, 보고서 HTML 편집/미리보기/템플릿, 전송(+이메일) |

## 알림
- 입력 제출 → Slack (Incoming Webhook, 어드민 상세 링크 버튼 포함)
- 보고서 전송 → SES 이메일 (보고서 열람 링크)

## 공통 정의
- `frontend/lib/mandalart.js` : 워크시트 문구/색상, 단계, 상태 라벨, 임시저장, 페이로드, 보고서 템플릿
- `frontend/lib/api/analysis.js` : API 클라이언트
- 백엔드/배포: `backend/lambda/analysis-request/README.md`
