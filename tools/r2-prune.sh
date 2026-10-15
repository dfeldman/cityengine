#!/bin/sh
# Remove from the live bucket (the one tools/r2-upload.sh fills, named in ./api_key) every file the current build no
# longer has: tiles a re-bake dropped, the hashed bundles of old builds, assets that moved to the shared asset
# bucket. r2-upload.sh only adds and replaces, so without this the bucket grows with every build and bake.
# A dry run unless --yes.
#   sh tools/r2-prune.sh [--yes]
set -e
cd "$(dirname "$0")/.."
YES=0
while [ $# -gt 0 ]; do
  case "$1" in
    --yes) YES=1; shift ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
done
[ -d dist ] || { echo "no dist/: npm run build first (it is what the bucket is pruned against)" >&2; exit 1; }
set -a; . ./api_key; set +a
ACCT=$(echo "$BUCKET_URL" | sed -E 's#https?://([^.]+)\..*#\1#')
KID=$(curl -s -H "Authorization: Bearer $BUCKET_ACCESS_KEY" "https://api.cloudflare.com/client/v4/accounts/$ACCT/tokens/verify" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['id'])")
export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare RCLONE_CONFIG_R2_ACCESS_KEY_ID="$KID" \
  RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$BUCKET_SECRET_KEY" RCLONE_CONFIG_R2_ENDPOINT="$BUCKET_URL" RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
# (a content-hashed bundle uploaded in the last KEEP_DAYS stays: a tab still holding the previous index.html asks for
# the previous build's bundles, and deleting them broke it — 2026-10-14)
KEEP_DAYS=${KEEP_DAYS:-3}
rclone lsf "r2:$BUCKET_NAME" --files-only -R --fast-list --use-server-modtime --format "tp" --separator ";" 2>/dev/null \
  | python3 -c "
import sys, datetime
cut = datetime.datetime.now() - datetime.timedelta(days=$KEEP_DAYS)
for line in sys.stdin:
    t, p = line.rstrip('\\n').split(';', 1)
    if p.startswith('assets/') and datetime.datetime.strptime(t[:19], '%Y-%m-%d %H:%M:%S') > cut: continue
    print(p)" | sort > "$TMP/bucket"
(cd dist && find -L . -type f ! -name .DS_Store | sed 's#^\./##' | sort) > "$TMP/dist"
comm -23 "$TMP/bucket" "$TMP/dist" > "$TMP/go"
echo "bucket $(wc -l < "$TMP/bucket" | tr -d ' ') files, build $(wc -l < "$TMP/dist" | tr -d ' '), not in the build $(wc -l < "$TMP/go" | tr -d ' ')"
awk -F/ '{ print (NF > 2 ? $1 "/" $2 : $1) }' "$TMP/go" | sort | uniq -c | sort -rn | head -12
[ -s "$TMP/go" ] || exit 0
if [ "$YES" = 1 ]; then
  rclone delete "r2:$BUCKET_NAME" --files-from "$TMP/go" --stats-one-line -v 2>&1 | grep -v NOTICE | tail -3
else
  echo "(dry run: nothing deleted; run again with --yes to delete these)"
fi
