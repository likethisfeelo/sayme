<#
  Cognito 앱 클라이언트 토큰 유효기간 최대로 늘리기 + /auth/refresh API 연결
   - access / id 토큰 : 24시간 (Cognito 최대)
   - refresh 토큰     : 3650일 (약 10년, Cognito 최대)
   - ALLOW_REFRESH_TOKEN_AUTH 보장

  주의: update-user-pool-client 는 지정하지 않은 항목을 기본값으로 되돌리므로,
        describe 결과를 그대로 가져와 유효기간만 바꿔서 다시 넣습니다.

  실행: powershell -ExecutionPolicy Bypass -File .\cognito-token-validity.ps1
#>
param(
  [string]$Region = 'ap-northeast-2',
  [string]$UserPoolId = 'ap-northeast-2_egqvLgHX0',
  [string]$ClientId = '4e5k8vs12cuudmka7m4mnjdkum',
  [int]$AccessTokenHours = 24,
  [int]$IdTokenHours = 24,
  [int]$RefreshTokenDays = 3650,
  [string]$RestApiId = 'h1l7cj53v9',
  [string]$StageName = 'dev',
  [string]$RefreshFunctionName = 'sayme-auth-refresh',
  [switch]$SkipApi
)
$ErrorActionPreference = 'Stop'
function Invoke-Aws { $ErrorActionPreference = 'Continue'; $out = & aws.exe @args 2>&1; $text = (@($out) | ForEach-Object { if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message } else { "$_" } }) -join "`n"; if ($LASTEXITCODE -ne 0) { throw "aws $($args -join ' ')`n$text" }; return $text }
function Test-Aws { $ErrorActionPreference = 'Continue'; & aws.exe @args 2>&1 | Out-Null; return ($LASTEXITCODE -eq 0) }
function First-Id($Text) { $v = @("$Text" -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -ne 'None' }); if ($v.Count -gt 0) { $v[0] } else { $null } }

Write-Host "`n▶ 현재 앱 클라이언트 설정 읽기" -ForegroundColor Cyan
$desc = (Invoke-Aws cognito-idp describe-user-pool-client --user-pool-id $UserPoolId --client-id $ClientId --region $Region) | ConvertFrom-Json
$c = $desc.UserPoolClient
Write-Host ("기존: access {0} / id {1} / refresh {2} (단위 {3})" -f $c.AccessTokenValidity, $c.IdTokenValidity, $c.RefreshTokenValidity, ($c.TokenValidityUnits | ConvertTo-Json -Compress))

# 읽기 전용/응답 전용 필드 제거
$input = @{}
foreach ($prop in $c.PSObject.Properties) {
  if ($prop.Name -in @('ClientSecret','LastModifiedDate','CreationDate','UserPoolId','ClientId','ClientName')) { continue }
  if ($null -ne $prop.Value) { $input[$prop.Name] = $prop.Value }
}
$input['UserPoolId'] = $UserPoolId
$input['ClientId'] = $ClientId
$input['ClientName'] = $c.ClientName
$input['AccessTokenValidity'] = $AccessTokenHours
$input['IdTokenValidity'] = $IdTokenHours
$input['RefreshTokenValidity'] = $RefreshTokenDays
$input['TokenValidityUnits'] = @{ AccessToken = 'hours'; IdToken = 'hours'; RefreshToken = 'days' }
$flows = @($c.ExplicitAuthFlows)
if ($flows -notcontains 'ALLOW_REFRESH_TOKEN_AUTH') { $flows += 'ALLOW_REFRESH_TOKEN_AUTH' }
$input['ExplicitAuthFlows'] = $flows

$tmp = Join-Path $env:TEMP 'cognito-client.json'
($input | ConvertTo-Json -Depth 10) | Set-Content -Path $tmp -Encoding ascii

Write-Host "`n▶ 유효기간 변경 적용" -ForegroundColor Cyan
Invoke-Aws cognito-idp update-user-pool-client --region $Region --cli-input-json "file://$tmp" | Out-Null
$after = (Invoke-Aws cognito-idp describe-user-pool-client --user-pool-id $UserPoolId --client-id $ClientId --region $Region --query 'UserPoolClient.[AccessTokenValidity,IdTokenValidity,RefreshTokenValidity]' --output text)
Write-Host "변경 후 (access/id/refresh): $after"

if (-not $SkipApi) {
  Write-Host "`n▶ API Gateway /auth/refresh 연결" -ForegroundColor Cyan
  $AccountId = (Invoke-Aws sts get-caller-identity --query Account --output text).Trim()
  if (-not (Test-Aws lambda get-function --function-name $RefreshFunctionName --region $Region)) {
    Write-Host "Lambda $RefreshFunctionName 이 아직 없습니다. backend/lambda/auth/refresh/README.md 대로 먼저 만든 뒤 다시 실행하세요." -ForegroundColor Yellow
    exit 0
  }
  $LambdaArn = "arn:aws:lambda:${Region}:${AccountId}:function:${RefreshFunctionName}"
  $authId = First-Id (Invoke-Aws apigateway get-resources --rest-api-id $RestApiId --region $Region --limit 500 --query "items[?path=='/auth'].id | [0]" --output text)
  if (-not $authId) { throw '/auth 리소스를 찾지 못했습니다' }
  $refreshId = First-Id (Invoke-Aws apigateway get-resources --rest-api-id $RestApiId --region $Region --limit 500 --query "items[?path=='/auth/refresh'].id | [0]" --output text)
  if (-not $refreshId) { $refreshId = First-Id (Invoke-Aws apigateway create-resource --rest-api-id $RestApiId --region $Region --parent-id $authId --path-part refresh --query id --output text); Write-Host "리소스 생성 /auth/refresh ($refreshId)" }
  foreach ($m in 'POST','OPTIONS') {
    if (-not (Test-Aws apigateway get-method --rest-api-id $RestApiId --resource-id $refreshId --http-method $m --region $Region)) {
      Invoke-Aws apigateway put-method --rest-api-id $RestApiId --resource-id $refreshId --http-method $m --authorization-type NONE --region $Region | Out-Null
    }
    Invoke-Aws apigateway put-integration --rest-api-id $RestApiId --resource-id $refreshId --http-method $m --type AWS_PROXY --integration-http-method POST --region $Region --uri "arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations" | Out-Null
  }
  Test-Aws lambda add-permission --function-name $RefreshFunctionName --region $Region --statement-id "apigw-$RestApiId-auth-refresh" --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${RestApiId}/*/*/auth/refresh" | Out-Null
  Invoke-Aws apigateway create-deployment --rest-api-id $RestApiId --stage-name $StageName --region $Region --description "auth/refresh $(Get-Date -Format yyyy-MM-dd)" | Out-Null
  Write-Host "배포 완료: https://$RestApiId.execute-api.$Region.amazonaws.com/$StageName/auth/refresh"
}
