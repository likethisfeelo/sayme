#!/usr/bin/env bash
# sayme-analysis-request 배포 스크립트 (AWS CLI v2 필요, Git Bash / WSL / macOS 에서 실행)
#
#   사용법:
#     cp .env.deploy.example .env.deploy   # 값 채우기
#     ./deploy.sh all        # 테이블 + Lambda + 환경변수 + API Gateway 전부
#     ./deploy.sh code       # 코드만 다시 올리기 (이후 반복 배포용)
#     ./deploy.sh env        # 환경변수만 갱신
#     ./deploy.sh api        # API Gateway 라우트만 연결
set -euo pipefail
cd "$(dirname "$0")"

# ---- 설정 (필요 시 수정) ----
REGION="${REGION:-ap-northeast-2}"
FUNCTION_NAME="${FUNCTION_NAME:-sayme-analysis-request}"
TABLE_NAME="${TABLE_NAME:-sayme-analysis-requests}"
ROLE_NAME="${ROLE_NAME:-sayme-auth-signup-role-2kzbkq9b}"   # 기존 Lambda 들이 쓰는 실행 역할
REST_API_ID="${REST_API_ID:-h1l7cj53v9}"
STAGE_NAME="${STAGE_NAME:-dev}"
RUNTIME="${RUNTIME:-nodejs20.x}"

[ -f .env.deploy ] && set -a && . ./.env.deploy && set +a

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query Role.Arn --output text)   # 경로(/service-role/) 포함
LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"
log() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }

step_table() {
  log "DynamoDB 테이블 ${TABLE_NAME}"
  if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" >/dev/null 2>&1; then
    echo "이미 존재함 - 건너뜀"
  else
    aws dynamodb create-table --region "$REGION" --table-name "$TABLE_NAME" \
      --attribute-definitions AttributeName=requestId,AttributeType=S AttributeName=userId,AttributeType=S AttributeName=createdAt,AttributeType=S \
      --key-schema AttributeName=requestId,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST \
      --global-secondary-indexes '[{"IndexName":"userId-createdAt-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' >/dev/null
    aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"
    echo "생성 완료"
  fi

  log "IAM 인라인 정책 (DynamoDB + SES) → ${ROLE_NAME}"
  cat > /tmp/sayme-analysis-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow",
      "Action": ["dynamodb:PutItem","dynamodb:GetItem","dynamodb:Query","dynamodb:Scan","dynamodb:UpdateItem","dynamodb:DeleteItem"],
      "Resource": ["arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${TABLE_NAME}","arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${TABLE_NAME}/index/*"] },
    { "Effect": "Allow", "Action": ["dynamodb:GetItem"], "Resource": "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/sayme-users" },
    { "Effect": "Allow", "Action": ["ses:SendEmail","ses:SendRawEmail"], "Resource": "*" }
  ]
}
JSON
  aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name sayme-analysis-request-access --policy-document file:///tmp/sayme-analysis-policy.json
  echo "정책 적용 완료"
}

step_code() {
  log "패키징"
  npm ci --omit=dev >/dev/null
  rm -f function.zip
  zip -qr function.zip index.js lib package.json node_modules
  echo "function.zip $(du -h function.zip | cut -f1)"

  if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
    log "Lambda 코드 업데이트"
    aws lambda update-function-code --function-name "$FUNCTION_NAME" --zip-file fileb://function.zip --region "$REGION" >/dev/null
  else
    log "Lambda 생성"
    aws lambda create-function --function-name "$FUNCTION_NAME" --runtime "$RUNTIME" --handler index.handler \
      --zip-file fileb://function.zip --role "$ROLE_ARN" --timeout 20 --memory-size 256 --region "$REGION" >/dev/null
  fi
  aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"
  echo "완료"
}

step_env() {
  log "환경변수"
  : "${COGNITO_USER_POOL_ID:?.env.deploy 에 COGNITO_USER_POOL_ID 필요}"
  : "${COGNITO_CLIENT_ID:?.env.deploy 에 COGNITO_CLIENT_ID 필요}"
  : "${APP_BASE_URL:?.env.deploy 에 APP_BASE_URL 필요}"
  VARS="COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID},COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID},APP_BASE_URL=${APP_BASE_URL},ANALYSIS_REQUESTS_TABLE=${TABLE_NAME}"
  [ -n "${SLACK_WEBHOOK_URL:-}" ] && VARS="${VARS},SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}"
  [ -n "${SES_FROM_EMAIL:-}" ]    && VARS="${VARS},SES_FROM_EMAIL=${SES_FROM_EMAIL}"
  [ -n "${SES_REPLY_TO:-}" ]      && VARS="${VARS},SES_REPLY_TO=${SES_REPLY_TO}"
  [ -n "${SERVICE_NAME:-}" ]      && VARS="${VARS},SERVICE_NAME=${SERVICE_NAME}"
  aws lambda update-function-configuration --function-name "$FUNCTION_NAME" --region "$REGION" \
    --environment "Variables={${VARS}}" >/dev/null
  aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"
  echo "완료 (Slack: ${SLACK_WEBHOOK_URL:+설정됨}${SLACK_WEBHOOK_URL:-미설정} / SES: ${SES_FROM_EMAIL:-미설정})"
}

# API Gateway REST: /analysis-request (ANY) + /analysis-request/{proxy+} (ANY) → Lambda 프록시
ensure_resource() { # $1 parent id, $2 pathPart → echo resource id
  local parent="$1" part="$2" id
  id=$(aws apigateway get-resources --rest-api-id "$REST_API_ID" --region "$REGION" --limit 500 \
        --query "items[?parentId=='${parent}' && pathPart=='${part}'].id | [0]" --output text)
  if [ -z "$id" ] || [ "$id" = "None" ]; then
    id=$(aws apigateway create-resource --rest-api-id "$REST_API_ID" --region "$REGION" --parent-id "$parent" --path-part "$part" --query id --output text)
  fi
  echo "$id"
}
ensure_any_proxy() { # $1 resource id
  local rid="$1"
  if ! aws apigateway get-method --rest-api-id "$REST_API_ID" --resource-id "$rid" --http-method ANY --region "$REGION" >/dev/null 2>&1; then
    aws apigateway put-method --rest-api-id "$REST_API_ID" --resource-id "$rid" --http-method ANY \
      --authorization-type NONE --region "$REGION" >/dev/null
  fi
  aws apigateway put-integration --rest-api-id "$REST_API_ID" --resource-id "$rid" --http-method ANY \
    --type AWS_PROXY --integration-http-method POST --region "$REGION" \
    --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" >/dev/null
}

step_api() {
  log "API Gateway ${REST_API_ID} 라우트"
  ROOT_ID=$(aws apigateway get-resources --rest-api-id "$REST_API_ID" --region "$REGION" --query "items[?path=='/'].id | [0]" --output text)
  BASE_ID=$(ensure_resource "$ROOT_ID" "analysis-request")
  PROXY_ID=$(ensure_resource "$BASE_ID" "{proxy+}")
  ensure_any_proxy "$BASE_ID"
  ensure_any_proxy "$PROXY_ID"

  aws lambda add-permission --function-name "$FUNCTION_NAME" --region "$REGION" \
    --statement-id "apigw-${REST_API_ID}-analysis-request" --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${REST_API_ID}/*/*/analysis-request*" >/dev/null 2>&1 || echo "(권한 이미 있음)"

  aws apigateway create-deployment --rest-api-id "$REST_API_ID" --stage-name "$STAGE_NAME" --region "$REGION" \
    --description "analysis-request $(date +%F)" >/dev/null
  echo "배포 완료: https://${REST_API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/analysis-request"
}

step_smoke() {
  log "스모크 테스트 (비로그인 → 401 기대)"
  curl -s -o /dev/null -w "GET /mine → HTTP %{http_code}\n" "https://${REST_API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/analysis-request/mine"
}

case "${1:-all}" in
  table) step_table ;;
  code)  step_code ;;
  env)   step_env ;;
  api)   step_api ;;
  smoke) step_smoke ;;
  all)   step_table; step_code; step_env; step_api; step_smoke ;;
  *) echo "사용법: $0 [all|table|code|env|api|smoke]"; exit 1 ;;
esac
