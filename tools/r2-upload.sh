#!/bin/sh
# Mirror the production build (dist/, after `npm run build`: index.html, the bundles and every public file) into the R2 bucket named in ./api_key (gitignored: BUCKET_ACCESS_KEY = a Cloudflare account API token,
# BUCKET_SECRET_KEY = its S3 secret, BUCKET_URL = the account's R2 endpoint, BUCKET_NAME). R2's S3 access key ID is the
# token's own id, which Cloudflare's verify endpoint returns. Follows the symlinked asset libraries (trees, plants, rocks).
#   sh tools/r2-upload.sh [--dry-run]
set -e
cd "$(dirname "$0")/.."
set -a; . ./api_key; set +a
ACCT=$(echo "$BUCKET_URL" | sed -E 's#https?://([^.]+)\..*#\1#')
KID=$(curl -s -H "Authorization: Bearer $BUCKET_ACCESS_KEY" "https://api.cloudflare.com/client/v4/accounts/$ACCT/tokens/verify" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['id'])")
export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare RCLONE_CONFIG_R2_ACCESS_KEY_ID="$KID" \
  RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$BUCKET_SECRET_KEY" RCLONE_CONFIG_R2_ENDPOINT="$BUCKET_URL" RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
exec rclone copy "${R2_SRC:-dist}" "r2:$BUCKET_NAME" --copy-links --exclude '.DS_Store' --exclude '*.swp' \
  --checksum --transfers 32 --checkers 32 --fast-list --stats 30s --stats-one-line "$@"
