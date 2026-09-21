<#
  sayme-analysis-request 배포 스크립트 (Windows PowerShell 용)
  요구: AWS CLI v2 (aws configure 완료), Node.js/npm

  사용법 (이 폴더에서):
    Copy-Item .env.deploy.example .env.deploy   # 값 채우기
    .\deploy.ps1 all      # 테이블 + Lambda + 환경변수 + API Gateway 전부
    .\deploy.ps1 code     # 코드만 다시 올리기
    .\deploy.ps1 env      # 환경변수만 갱신
    .\deploy.ps1 api      # API Gateway 라우트만 연결
    .\deploy.ps1 smoke    # 배포 확인 (401 이면 정상)

  실행 정책 오류가 나면:  powershell -ExecutionPolicy Bypass -File .\deploy.ps1 all
#>
param([ValidateSet('all','table','code','env','api','smoke')][string]$Step = 'all')

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# ---- 설정 ----
$Region       = if ($env:REGION) { $env:REGION } else { 'ap-northeast-2' }
$FunctionName = if ($env:FUNCTION_NAME) { $env:FUNCTION_NAME } else { 'sayme-analysis-request' }
$TableName    = if ($env:TABLE_NAME) { $env:TABLE_NAME } else { 'sayme-analysis-requests' }
$RoleName     = if ($env:ROLE_NAME) { $env:ROLE_NAME } else { 'sayme-lambda-execution-role' }
$RestApiId    = if ($env:REST_API_ID) { $env:REST_API_ID } else { 'h1l7cj53v9' }
$StageName    = if ($env:STAGE_NAME) { $env:STAGE_NAME } else { 'dev' }
$Runtime      = if ($env:RUNTIME) { $env:RUNTIME } else { 'nodejs20.x' }

# .env.deploy 읽기 (KEY=VALUE)
$Cfg = @{}
if (Test-Path .env.deploy) {
  Get-Content .env.deploy | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
      $k, $v = $line.Split('=', 2)
      $Cfg[$k.Trim()] = $v.Trim()
    }
  }
}

function Log($msg) { Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Aws { # aws CLI 호출 + 실패 시 중단
  $out = & aws @args 2>&1
  if ($LASTEXITCODE -ne 0) { throw "aws $($args -join ' ')`n$out" }
  return $out
}
function AwsQuiet { & aws @args 2>&1 | Out-Null; return ($LASTEXITCODE -eq 0) }

$AccountId = (Aws sts get-caller-identity --query Account --output text).Trim()
$RoleArn   = "arn:aws:iam::${AccountId}:role/${RoleName}"
$LambdaArn = "arn:aws:lambda:${Region}:${AccountId}:function:${FunctionName}"
$Tmp = Join-Path $env:TEMP 'sayme-deploy'
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null

function Step-Table {
  Log "DynamoDB 테이블 $TableName"
  if (AwsQuiet dynamodb describe-table --table-name $TableName --region $Region) {
    Write-Host '이미 존재함 - 건너뜀'
  } else {
    $gsi = '[{"IndexName":"userId-createdAt-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]'
    $gsiFile = Join-Path $Tmp 'gsi.json'; Set-Content -Path $gsiFile -Value $gsi -Encoding ascii
    Aws dynamodb create-table --region $Region --table-name $TableName `
      --attribute-definitions AttributeName=requestId,AttributeType=S AttributeName=userId,AttributeType=S AttributeName=createdAt,AttributeType=S `
      --key-schema AttributeName=requestId,KeyType=HASH `
      --billing-mode PAY_PER_REQUEST `
      --global-secondary-indexes "file://$gsiFile" | Out-Null
    Aws dynamodb wait table-exists --table-name $TableName --region $Region | Out-Null
    Write-Host '생성 완료'
  }

  Log "IAM 인라인 정책 (DynamoDB + SES) → $RoleName"
  $policy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow",
      "Action": ["dynamodb:PutItem","dynamodb:GetItem","dynamodb:Query","dynamodb:Scan","dynamodb:UpdateItem","dynamodb:DeleteItem"],
      "Resource": ["arn:aws:dynamodb:${Region}:${AccountId}:table/${TableName}","arn:aws:dynamodb:${Region}:${AccountId}:table/${TableName}/index/*"] },
    { "Effect": "Allow", "Action": ["dynamodb:GetItem"], "Resource": "arn:aws:dynamodb:${Region}:${AccountId}:table/sayme-users" },
    { "Effect": "Allow", "Action": ["ses:SendEmail","ses:SendRawEmail"], "Resource": "*" }
  ]
}
"@
  $policyFile = Join-Path $Tmp 'policy.json'; Set-Content -Path $policyFile -Value $policy -Encoding ascii
  Aws iam put-role-policy --role-name $RoleName --policy-name sayme-analysis-request-access --policy-document "file://$policyFile" | Out-Null
  Write-Host '정책 적용 완료'
}

function Step-Code {
  Log '패키징'
  & npm ci --omit=dev | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'npm ci 실패' }
  if (Test-Path function.zip) { Remove-Item function.zip }
  Compress-Archive -Path index.js, lib, package.json, node_modules -DestinationPath function.zip -CompressionLevel Optimal
  Write-Host ("function.zip {0:N1} MB" -f ((Get-Item function.zip).Length / 1MB))

  if (AwsQuiet lambda get-function --function-name $FunctionName --region $Region) {
    Log 'Lambda 코드 업데이트'
    Aws lambda update-function-code --function-name $FunctionName --zip-file fileb://function.zip --region $Region | Out-Null
  } else {
    Log 'Lambda 생성'
    Aws lambda create-function --function-name $FunctionName --runtime $Runtime --handler index.handler `
      --zip-file fileb://function.zip --role $RoleArn --timeout 20 --memory-size 256 --region $Region | Out-Null
  }
  Aws lambda wait function-updated --function-name $FunctionName --region $Region | Out-Null
  Write-Host '완료'
}

function Step-Env {
  Log '환경변수'
  foreach ($k in 'COGNITO_USER_POOL_ID','COGNITO_CLIENT_ID','APP_BASE_URL') {
    if (-not $Cfg[$k]) { throw ".env.deploy 에 $k 값이 필요합니다" }
  }
  $vars = @{
    COGNITO_USER_POOL_ID    = $Cfg['COGNITO_USER_POOL_ID']
    COGNITO_CLIENT_ID       = $Cfg['COGNITO_CLIENT_ID']
    APP_BASE_URL            = $Cfg['APP_BASE_URL']
    ANALYSIS_REQUESTS_TABLE = $TableName
  }
  foreach ($k in 'SLACK_WEBHOOK_URL','SES_FROM_EMAIL','SES_REPLY_TO','SERVICE_NAME') {
    if ($Cfg[$k]) { $vars[$k] = $Cfg[$k] }
  }
  $envFile = Join-Path $Tmp 'env.json'
  (@{ Variables = $vars } | ConvertTo-Json -Compress) | Set-Content -Path $envFile -Encoding ascii
  Aws lambda update-function-configuration --function-name $FunctionName --region $Region --environment "file://$envFile" | Out-Null
  Aws lambda wait function-updated --function-name $FunctionName --region $Region | Out-Null
  $slack = if ($vars.SLACK_WEBHOOK_URL) { '설정됨' } else { '미설정' }
  $ses   = if ($vars.SES_FROM_EMAIL) { $vars.SES_FROM_EMAIL } else { '미설정' }
  Write-Host "완료 (Slack: $slack / SES: $ses)"
}

function Ensure-Resource($ParentId, $PathPart) {
  $id = (Aws apigateway get-resources --rest-api-id $RestApiId --region $Region --limit 500 `
          --query "items[?parentId=='$ParentId' && pathPart=='$PathPart'].id | [0]" --output text).Trim()
  if (-not $id -or $id -eq 'None') {
    $id = (Aws apigateway create-resource --rest-api-id $RestApiId --region $Region --parent-id $ParentId --path-part $PathPart --query id --output text).Trim()
  }
  return $id
}
function Ensure-AnyProxy($ResourceId) {
  if (-not (AwsQuiet apigateway get-method --rest-api-id $RestApiId --resource-id $ResourceId --http-method ANY --region $Region)) {
    Aws apigateway put-method --rest-api-id $RestApiId --resource-id $ResourceId --http-method ANY --authorization-type NONE --region $Region | Out-Null
  }
  Aws apigateway put-integration --rest-api-id $RestApiId --resource-id $ResourceId --http-method ANY `
    --type AWS_PROXY --integration-http-method POST --region $Region `
    --uri "arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations" | Out-Null
}

function Step-Api {
  Log "API Gateway $RestApiId 라우트"
  $rootId  = (Aws apigateway get-resources --rest-api-id $RestApiId --region $Region --query "items[?path=='/'].id | [0]" --output text).Trim()
  $baseId  = Ensure-Resource $rootId 'analysis-request'
  $proxyId = Ensure-Resource $baseId '{proxy+}'
  Ensure-AnyProxy $baseId
  Ensure-AnyProxy $proxyId

  $ok = AwsQuiet lambda add-permission --function-name $FunctionName --region $Region `
    --statement-id "apigw-$RestApiId-analysis-request" --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${RestApiId}/*/*/analysis-request*"
  if (-not $ok) { Write-Host '(호출 권한 이미 있음)' }

  Aws apigateway create-deployment --rest-api-id $RestApiId --stage-name $StageName --region $Region --description "analysis-request $(Get-Date -Format yyyy-MM-dd)" | Out-Null
  Write-Host "배포 완료: https://$RestApiId.execute-api.$Region.amazonaws.com/$StageName/analysis-request"
}

function Step-Smoke {
  Log '스모크 테스트 (비로그인 → 401 기대)'
  try {
    Invoke-WebRequest -Uri "https://$RestApiId.execute-api.$Region.amazonaws.com/$StageName/analysis-request/mine" -UseBasicParsing | Out-Null
    Write-Host 'HTTP 200 (예상과 다름 - 인증이 비어 있는지 확인)'
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "GET /mine → HTTP $code $(if ($code -eq 401) { '(정상)' } else { '(확인 필요)' })"
  }
}

switch ($Step) {
  'table' { Step-Table }
  'code'  { Step-Code }
  'env'   { Step-Env }
  'api'   { Step-Api }
  'smoke' { Step-Smoke }
  'all'   { Step-Table; Step-Code; Step-Env; Step-Api; Step-Smoke }
}
