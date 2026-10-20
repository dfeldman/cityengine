#!/bin/sh
# Mirror the production build (dist/, after `npm run build`: index.html, the bundles and every public file) into the R2 bucket named in .env (DEPLOY_BUCKET) (gitignored: BUCKET_ACCESS_KEY = a Cloudflare account API token,
# BUCKET_SECRET_KEY = its S3 secret, BUCKET_URL = the account's R2 endpoint, BUCKET_NAME). R2's S3 access key ID is the
# token's own id, which Cloudflare's verify endpoint returns. Follows the symlinked asset libraries (trees, plants, rocks).
#   sh tools/r2-upload.sh [--dry-run]
set -e
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
# from .env (names in .env.example): DEPLOY_BUCKET, DEPLOY_ENDPOINT (the account's R2 S3 endpoint) and CLOUDFLARE_API_TOKEN,
# an account API token with R2 read & write. R2's S3 key id is the token's own id (from tokens/verify, below) and its
# secret the token's SHA-256 (Cloudflare's derivation).
BUCKET_NAME=$DEPLOY_BUCKET
BUCKET_URL=$DEPLOY_ENDPOINT
BUCKET_ACCESS_KEY=$CLOUDFLARE_API_TOKEN
BUCKET_SECRET_KEY=$(printf %s "$CLOUDFLARE_API_TOKEN" | shasum -a 256 | cut -d' ' -f1)
ACCT=$(echo "$BUCKET_URL" | sed -E 's#https?://([^.]+)\..*#\1#')
KID=$(curl -s -H "Authorization: Bearer $BUCKET_ACCESS_KEY" "https://api.cloudflare.com/client/v4/accounts/$ACCT/tokens/verify" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['id'])")
export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare RCLONE_CONFIG_R2_ACCESS_KEY_ID="$KID" \
  RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$BUCKET_SECRET_KEY" RCLONE_CONFIG_R2_ENDPOINT="$BUCKET_URL" RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
# index.html LAST and on its own (2026-10-14: a tab holding the previous index.html asked for bundles a prune had
# just deleted, 404): everything it points at is in place before it changes, and it goes up with `no-cache`, so a
# browser revalidates it every load instead of keeping it by heuristic (the bundles are content-hashed; the bake's
# files are stamped with its number — those may be kept for ever).
SRC="${R2_SRC:-dist}"
rclone copy "$SRC" "r2:$BUCKET_NAME" --copy-links --exclude '.DS_Store' --exclude '*.swp' --exclude '/index.html' \
  --checksum --transfers 32 --checkers 32 --fast-list --stats 30s --stats-one-line "$@"
exec rclone copyto "$SRC/index.html" "r2:$BUCKET_NAME/index.html" --header-upload "Cache-Control: no-cache" "$@"
