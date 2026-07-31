#!/usr/bin/env bash
# Renders tools/og-image.html -> public/assets/og.jpg (1200x630) with headless Chrome.
# macOS only; no npm deps. Run from the repo root: npm run og
set -euo pipefail
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT_PNG="$(mktemp -t hubijas-og).png"
"$CHROME" --headless=new --disable-gpu --no-sandbox --allow-file-access-from-files \
  --hide-scrollbars --force-device-scale-factor=2 --window-size=1200,630 \
  --virtual-time-budget=4000 --screenshot="$OUT_PNG" tools/og-image.html >/dev/null 2>&1
sips -Z 1200 "$OUT_PNG" --out public/assets/og.jpg -s format jpeg -s formatOptions 88 >/dev/null
rm -f "$OUT_PNG"
echo "public/assets/og.jpg written"
