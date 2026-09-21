<#
  sayme-auth-refresh 배포 (Windows PowerShell)
   - node_modules 불필요: AWS SDK v3 는 Lambda nodejs20.x 런타임에 내장
   - COGNITO_CLIENT_ID / COGNITO_CLIENT_SECRET 은 기존 sayme-auth-login 함수 설정에서 그대로 복사
   - 이어서 ..\..\..\scripts\cognito-token-validity.ps1 로 API 연결 + 토큰 유효기간 변경

  실행 (이 폴더에서):  powershell -ExecutionPolicy Bypass -File .\deploy.ps1
#>
param(
  [string]$Region = 'ap-northeast-2',
  [string]$FunctionName = 'sayme-auth-refresh',
  [string]$SourceFunction = 'sayme-auth-login',
  [string]$RoleArn = ''
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
function Invoke-Aws { $ErrorActionPreference = 'Continue'; $out = & aws.exe @args 2>&1; $text = (@($out) | ForEach-Object { if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message } else { "$_" } }) -join "`n"; if ($LASTEXITCODE -ne 0) { throw "aws $($args -join ' ')`n$text" }; return $text }
function Test-Aws { $ErrorActionPreference = 'Continue'; & aws.exe @args 2>&1 | Out-Null; return ($LASTEXITCODE -eq 0) }

Write-Host "`n▶ login 함수 설정 읽기 ($SourceFunction)" -ForegroundColor Cyan
$src = (Invoke-Aws lambda get-function-configuration --function-name $SourceFunction --region $Region) | ConvertFrom-Json
$clientId = $src.Environment.Variables.COGNITO_CLIENT_ID
$clientSecret = $src.Environment.Variables.COGNITO_CLIENT_SECRET
if (-not $RoleArn) { $RoleArn = $src.Role }
if (-not $clientId -or -not $clientSecret) { throw "$SourceFunction 에 COGNITO_CLIENT_ID / COGNITO_CLIENT_SECRET 환경변수가 없습니다" }
Write-Host "역할 $RoleArn / 클라이언트 $clientId / 시크릿 ****$($clientSecret.Substring($clientSecret.Length - 4))"

Write-Host "`n▶ 패키징 (index.js, package.json)" -ForegroundColor Cyan
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$zipPath = Join-Path $PSScriptRoot 'function.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath }
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
  foreach ($f in 'index.js', 'package.json') {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $PSScriptRoot $f), $f, 'Optimal') | Out-Null
  }
} finally { $zip.Dispose() }

if (Test-Aws lambda get-function --function-name $FunctionName --region $Region) {
  Write-Host "`n▶ Lambda 코드 업데이트" -ForegroundColor Cyan
  Invoke-Aws lambda update-function-code --function-name $FunctionName --zip-file fileb://function.zip --region $Region | Out-Null
} else {
  Write-Host "`n▶ Lambda 생성" -ForegroundColor Cyan
  Invoke-Aws lambda create-function --function-name $FunctionName --runtime nodejs20.x --handler index.handler `
    --zip-file fileb://function.zip --role $RoleArn --timeout 10 --memory-size 256 --region $Region | Out-Null
}
Invoke-Aws lambda wait function-updated --function-name $FunctionName --region $Region | Out-Null

Write-Host "`n▶ 환경변수" -ForegroundColor Cyan
$envFile = Join-Path $env:TEMP 'sayme-refresh-env.json'
(@{ Variables = @{ COGNITO_CLIENT_ID = $clientId; COGNITO_CLIENT_SECRET = $clientSecret } } | ConvertTo-Json -Compress) | Set-Content -Path $envFile -Encoding ascii
Invoke-Aws lambda update-function-configuration --function-name $FunctionName --region $Region --environment "file://$envFile" | Out-Null
Invoke-Aws lambda wait function-updated --function-name $FunctionName --region $Region | Out-Null
Remove-Item $envFile -ErrorAction SilentlyContinue
Write-Host "완료: $FunctionName"

$validity = Join-Path $PSScriptRoot '..\..\..\scripts\cognito-token-validity.ps1'
if (Test-Path $validity) {
  Write-Host "`n▶ Cognito 유효기간 + API Gateway /auth/refresh 연결" -ForegroundColor Cyan
  & $validity -Region $Region -RefreshFunctionName $FunctionName
}
