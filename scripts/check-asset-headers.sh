#!/usr/bin/env bash
# Usage:
#   ./scripts/check-asset-headers.sh http://localhost:3000 paths.txt
# If paths.txt omitted, uses a small default list of likely assets.

BASE_URL=${1:-http://localhost:3000}
PATHS_FILE=$2

if [ -n "$PATHS_FILE" ] && [ ! -f "$PATHS_FILE" ]; then
  echo "Paths file not found: $PATHS_FILE"
  exit 1
fi

if [ -n "$PATHS_FILE" ]; then
  mapfile -t PATHS < "$PATHS_FILE"
else
  PATHS=(
    "/_next/static/chunks/framework.js"
    "/_next/static/chunks/main.css"
    "/_next/static/chunks/pages/index.js"
    "/favicon.ico"
    "/robots.txt"
  )
fi

OUTPUT="["
first=true
for p in "${PATHS[@]}"; do
  url="$BASE_URL$p"
  # Perform HEAD-like request and capture headers
  headers=$(curl -sI -H "Cache-Control: no-cache" "$url" | sed ':a;N;$!ba;s/\n/\\n/g')
  status=$(echo "$headers" | sed -n '1p' | awk '{print $2}')
  contentType=$(echo "$headers" | tr '\r' '\n' | awk -F': ' '/^Content-Type:/ {print $2}' | tr -d '\n')
  setCookie=$(echo "$headers" | tr '\r' '\n' | awk -F': ' '/^Set-Cookie:/ {print $2}' | tr '\n' ';')

  if [ "$first" = true ]; then
    first=false
  else
     OUTPUT+=","
  fi

  # Escape double quotes to keep JSON valid
  escaped_path=$(printf '%s' "$p" | sed 's/"/\\\"/g')
  escaped_url=$(printf '%s' "$url" | sed 's/"/\\\"/g')
  escaped_status=$(printf '%s' "$status" | sed 's/"/\\\"/g')
  escaped_contentType=$(printf '%s' "$contentType" | sed 's/"/\\\"/g')
  escaped_setCookie=$(printf '%s' "$setCookie" | sed 's/"/\\\"/g')

  OUTPUT+=$'\n'
  OUTPUT+="  {\"path\": \"$escaped_path\", \"url\": \"$escaped_url\", \"status\": \"$escaped_status\", \"contentType\": \"$escaped_contentType\", \"setCookie\": \"$escaped_setCookie\" }"

done
OUTPUT+=$'\n]'

mkdir -p logs
echo -e "$OUTPUT" > "./logs/asset-check-$(date +%s).json"
echo "Wrote ./logs/asset-check-*.json"

exit 0
