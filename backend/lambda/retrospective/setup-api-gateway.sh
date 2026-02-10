#!/bin/bash
# sayme-retrospective-2025 API Gateway 설정 스크립트
# 사용법: bash setup-api-gateway.sh
#
# 사전 조건:
# 1. AWS CLI 설정 완료 (aws configure)
# 2. Lambda 함수 배포 완료:
#    - sayme-retrospective-2025-save
#    - sayme-retrospective-2025-complete
# 3. DynamoDB 테이블 생성 완료:
#    - sayme-retrospective-2025 (PK: userId, SK: sessionId)

set -e

REGION="ap-northeast-2"
API_ID="h1l7cj53v9"
STAGE="dev"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=== sayme-retrospective-2025 API Gateway 설정 ==="
echo "API ID: $API_ID"
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo ""

# 1. /retrospective 리소스 찾기 또는 생성
echo "--- /retrospective 리소스 생성 ---"
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query 'items[?path==`/`].id' --output text)

RETRO_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query 'items[?path==`/retrospective`].id' --output text)

if [ -z "$RETRO_ID" ]; then
  RETRO_ID=$(aws apigateway create-resource --rest-api-id $API_ID --region $REGION \
    --parent-id $ROOT_ID --path-part "retrospective" \
    --query 'id' --output text)
  echo "Created /retrospective resource: $RETRO_ID"
else
  echo "Found /retrospective resource: $RETRO_ID"
fi

# 2. /retrospective/save 리소스
echo ""
echo "--- /retrospective/save 리소스 생성 ---"
SAVE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query 'items[?path==`/retrospective/save`].id' --output text)

if [ -z "$SAVE_ID" ]; then
  SAVE_ID=$(aws apigateway create-resource --rest-api-id $API_ID --region $REGION \
    --parent-id $RETRO_ID --path-part "save" \
    --query 'id' --output text)
  echo "Created /retrospective/save resource: $SAVE_ID"
else
  echo "Found /retrospective/save resource: $SAVE_ID"
fi

# 3. /retrospective/complete 리소스
echo ""
echo "--- /retrospective/complete 리소스 생성 ---"
COMPLETE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query 'items[?path==`/retrospective/complete`].id' --output text)

if [ -z "$COMPLETE_ID" ]; then
  COMPLETE_ID=$(aws apigateway create-resource --rest-api-id $API_ID --region $REGION \
    --parent-id $RETRO_ID --path-part "complete" \
    --query 'id' --output text)
  echo "Created /retrospective/complete resource: $COMPLETE_ID"
else
  echo "Found /retrospective/complete resource: $COMPLETE_ID"
fi

SAVE_LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:sayme-retrospective-2025-save"
COMPLETE_LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:sayme-retrospective-2025-complete"

# ===== /retrospective/save =====
echo ""
echo "--- PUT /retrospective/save 메서드 생성 ---"
aws apigateway put-method --rest-api-id $API_ID --region $REGION \
  --resource-id $SAVE_ID --http-method PUT \
  --authorization-type NONE 2>/dev/null || echo "PUT method already exists"

aws apigateway put-integration --rest-api-id $API_ID --region $REGION \
  --resource-id $SAVE_ID --http-method PUT \
  --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${SAVE_LAMBDA_ARN}/invocations"

echo "--- OPTIONS /retrospective/save 메서드 생성 ---"
aws apigateway put-method --rest-api-id $API_ID --region $REGION \
  --resource-id $SAVE_ID --http-method OPTIONS \
  --authorization-type NONE 2>/dev/null || echo "OPTIONS method already exists"

aws apigateway put-integration --rest-api-id $API_ID --region $REGION \
  --resource-id $SAVE_ID --http-method OPTIONS \
  --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${SAVE_LAMBDA_ARN}/invocations"

# Lambda 권한 추가 (API Gateway → Lambda 호출 허용)
aws lambda add-permission --function-name sayme-retrospective-2025-save \
  --statement-id apigateway-save-put --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/PUT/retrospective/save" \
  --region $REGION 2>/dev/null || echo "PUT permission already exists"

aws lambda add-permission --function-name sayme-retrospective-2025-save \
  --statement-id apigateway-save-options --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/OPTIONS/retrospective/save" \
  --region $REGION 2>/dev/null || echo "OPTIONS permission already exists"

# ===== /retrospective/complete =====
echo ""
echo "--- POST /retrospective/complete 메서드 생성 ---"
aws apigateway put-method --rest-api-id $API_ID --region $REGION \
  --resource-id $COMPLETE_ID --http-method POST \
  --authorization-type NONE 2>/dev/null || echo "POST method already exists"

aws apigateway put-integration --rest-api-id $API_ID --region $REGION \
  --resource-id $COMPLETE_ID --http-method POST \
  --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${COMPLETE_LAMBDA_ARN}/invocations"

echo "--- OPTIONS /retrospective/complete 메서드 생성 ---"
aws apigateway put-method --rest-api-id $API_ID --region $REGION \
  --resource-id $COMPLETE_ID --http-method OPTIONS \
  --authorization-type NONE 2>/dev/null || echo "OPTIONS method already exists"

aws apigateway put-integration --rest-api-id $API_ID --region $REGION \
  --resource-id $COMPLETE_ID --http-method OPTIONS \
  --type AWS_PROXY --integration-http-method POST \
  --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${COMPLETE_LAMBDA_ARN}/invocations"

# Lambda 권한 추가
aws lambda add-permission --function-name sayme-retrospective-2025-complete \
  --statement-id apigateway-complete-post --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/POST/retrospective/complete" \
  --region $REGION 2>/dev/null || echo "POST permission already exists"

aws lambda add-permission --function-name sayme-retrospective-2025-complete \
  --statement-id apigateway-complete-options --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/OPTIONS/retrospective/complete" \
  --region $REGION 2>/dev/null || echo "OPTIONS permission already exists"

# ===== 배포 =====
echo ""
echo "--- API Gateway 배포 (dev 스테이지) ---"
aws apigateway create-deployment --rest-api-id $API_ID --stage-name $STAGE --region $REGION

echo ""
echo "=== 완료! ==="
echo ""
echo "엔드포인트:"
echo "  PUT  https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}/retrospective/save"
echo "  POST https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}/retrospective/complete"
echo ""
echo "각 엔드포인트에 OPTIONS도 함께 설정됨 (CORS preflight)"
