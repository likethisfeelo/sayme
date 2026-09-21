# 프론트(Next.js 정적 export) → S3 app.spirit-lab.me → CloudFront 무효화 (Windows PowerShell 용)
#   실행: .\deploy-frontend.ps1   (실행 정책 오류 시: powershell -ExecutionPolicy Bypass -File .\deploy-frontend.ps1)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$Bucket = if ($env:BUCKET) { $env:BUCKET } else { 'app.spirit-lab.me' }
$DistId = if ($env:DIST_ID) { $env:DIST_ID } else { 'E10UMKWZ9X0NZ9' }
$Region = if ($env:REGION) { $env:REGION } else { 'ap-northeast-2' }

& npm ci;        if ($LASTEXITCODE -ne 0) { throw 'npm ci 실패' }
& npm run build; if ($LASTEXITCODE -ne 0) { throw 'next build 실패' }
& aws.exe s3 sync out/ "s3://$Bucket" --delete --region $Region
if ($LASTEXITCODE -ne 0) { throw 's3 sync 실패' }
& aws.exe cloudfront create-invalidation --distribution-id $DistId --paths '/*' | Out-Null
Write-Host "배포 완료 → https://$Bucket" -ForegroundColor Green
