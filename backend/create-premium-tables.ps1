# Spirit Lab Premium Home - DynamoDB 테이블 생성 스크립트
# 실행 전 AWS CLI 설정 확인: aws configure

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Spirit Lab Premium Tables 생성 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$region = "ap-northeast-2"

# 1. sayme-user-goals
Write-Host "`n[1/4] sayme-user-goals 생성 중..." -ForegroundColor Yellow
aws dynamodb create-table `
  --table-name sayme-user-goals `
  --attribute-definitions `
    AttributeName=userId,AttributeType=S `
    AttributeName=month,AttributeType=S `
  --key-schema `
    AttributeName=userId,KeyType=HASH `
    AttributeName=month,KeyType=RANGE `
  --billing-mode PAY_PER_REQUEST `
  --region $region `
  --tags Key=Environment,Value=Production Key=Service,Value=SpiritLab

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ sayme-user-goals 생성 완료" -ForegroundColor Green
} else {
  Write-Host "❌ sayme-user-goals 생성 실패" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# 2. sayme-monthly-reports
Write-Host "`n[2/4] sayme-monthly-reports 생성 중..." -ForegroundColor Yellow
aws dynamodb create-table `
  --table-name sayme-monthly-reports `
  --attribute-definitions `
    AttributeName=userId,AttributeType=S `
    AttributeName=month,AttributeType=S `
  --key-schema `
    AttributeName=userId,KeyType=HASH `
    AttributeName=month,KeyType=RANGE `
  --billing-mode PAY_PER_REQUEST `
  --region $region `
  --tags Key=Environment,Value=Production Key=Service,Value=SpiritLab

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ sayme-monthly-reports 생성 완료" -ForegroundColor Green
} else {
  Write-Host "❌ sayme-monthly-reports 생성 실패" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# 3. sayme-events
Write-Host "`n[3/4] sayme-events 생성 중..." -ForegroundColor Yellow
aws dynamodb create-table `
  --table-name sayme-events `
  --attribute-definitions `
    AttributeName=eventId,AttributeType=S `
    AttributeName=userId,AttributeType=S `
    AttributeName=createdAt,AttributeType=S `
  --key-schema `
    AttributeName=eventId,KeyType=HASH `
    AttributeName=userId,KeyType=RANGE `
  --global-secondary-indexes `
    "[{\"IndexName\":\"userId-createdAt-index\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" `
  --billing-mode PAY_PER_REQUEST `
  --region $region `
  --tags Key=Environment,Value=Production Key=Service,Value=SpiritLab

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ sayme-events 생성 완료" -ForegroundColor Green
} else {
  Write-Host "❌ sayme-events 생성 실패" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# 4. sayme-admin-feedback
Write-Host "`n[4/4] sayme-admin-feedback 생성 중..." -ForegroundColor Yellow
aws dynamodb create-table `
  --table-name sayme-admin-feedback `
  --attribute-definitions `
    AttributeName=questionId,AttributeType=S `
    AttributeName=userId,AttributeType=S `
  --key-schema `
    AttributeName=questionId,KeyType=HASH `
    AttributeName=userId,KeyType=RANGE `
  --billing-mode PAY_PER_REQUEST `
  --region $region `
  --tags Key=Environment,Value=Production Key=Service,Value=SpiritLab

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ sayme-admin-feedback 생성 완료" -ForegroundColor Green
} else {
  Write-Host "❌ sayme-admin-feedback 생성 실패" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "모든 테이블 생성 작업 완료!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 생성된 테이블 목록 확인
Write-Host "`n생성된 테이블 목록:" -ForegroundColor Yellow
aws dynamodb list-tables --region $region --query "TableNames[?starts_with(@, 'sayme-')]" --output table