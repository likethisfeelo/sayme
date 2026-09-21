#!/usr/bin/env bash
# 프론트(Next.js 정적 export) → S3 app.spirit-lab.me → CloudFront 무효화
set -euo pipefail
cd "$(dirname "$0")"
BUCKET="${BUCKET:-app.spirit-lab.me}"
DIST_ID="${DIST_ID:-E10UMKWZ9X0NZ9}"
REGION="${REGION:-ap-northeast-2}"

npm ci
npm run build                                   # → out/
aws s3 sync out/ "s3://${BUCKET}" --delete --region "$REGION"
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" >/dev/null
echo "배포 완료 → https://${BUCKET}"
