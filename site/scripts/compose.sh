#!/usr/bin/env bash
# Usage: site/scripts/compose.sh --polygon DIR --docs DIR --out DIR [--open-frames]
#
# Lays out admin.simai.io as one folder (owner C423, 2026-11-23: the
# documentation at the root, the live admin -- the polygon -- at /demo/). The
# deploy (deploy/simai-server/assemble.sh) and the local review host
# (scripts/publish-local.sh) both compose with this script, so the two cannot
# drift apart.
#
#   --polygon DIR  a built polygon of this repository (npm run build: dist/).
#                  Its index.html becomes /demo/index.html, its links to "/"
#                  become "/demo/", and everything else keeps its root path
#                  (/assets/, /distr/, /distr-pro/, /distr-admin/, /data/, the
#                  other pages), which the Docara build does not use (Docara
#                  writes under /_docara/, /ru/, /en/). A path present in both
#                  stops the compose.
#   --docs DIR     the Docara build (site/scripts/build.sh: build_production).
#   --out DIR      the folder to write; it must not exist or be empty.
#   --open-frames  for a local host only: drop the example frames' sandbox.
#                  The live examples run in sandboxed srcdoc frames
#                  (sandbox="allow-scripts"), whose origin is opaque, and
#                  Chromium's Local Network Access blocks every request from an
#                  opaque-origin frame to a loopback or private address, so on
#                  a local host the frame never loads SIMAI Framework or the set.
#                  A public host keeps the sandbox; its server answers every
#                  file with Access-Control-Allow-Origin: * (server.js, cors()).
#
# The home page's live example loses its code tabs, and the hero's effect gets
# a mask under its text (scripts/landing-transform.mjs), after verify-static
# has checked the build.
set -euo pipefail

SITE="$(cd "$(dirname "$0")/.." && pwd)"
POLYGON=""
DOCS=""
OUT=""
OPEN_FRAMES=0
while [ $# -gt 0 ]; do
  case "$1" in
    --polygon) POLYGON="$2"; shift 2 ;;
    --docs) DOCS="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --open-frames) OPEN_FRAMES=1; shift ;;
    *) echo "unknown argument $1" >&2; exit 2 ;;
  esac
done

[ -n "$DOCS" ] && [ -f "$DOCS/index.html" ] || { echo "--docs DIR: a Docara build with index.html (run scripts/build.sh)" >&2; exit 1; }
[ -n "$POLYGON" ] && [ -f "$POLYGON/index.html" ] && [ -d "$POLYGON/distr" ] || { echo "--polygon DIR: a built polygon with index.html and distr/" >&2; exit 1; }
[ -n "$OUT" ] || { echo "--out DIR is required" >&2; exit 1; }
if [ -e "$OUT" ] && [ -n "$(ls -A "$OUT")" ]; then echo "$OUT is not empty" >&2; exit 1; fi
POLYGON="$(cd "$POLYGON" && pwd)"
DOCS="$(cd "$DOCS" && pwd)"

# The two trees must not share a path, apart from the polygon's index.html
# that moves to /demo/.
clash=$(cd "$DOCS" && find . -mindepth 1 -maxdepth 1 | sed 's#^\./##' | while read -r entry; do
  [ "$entry" = "index.html" ] && continue
  [ -e "$POLYGON/$entry" ] && echo "$entry"
done || true)
[ -z "$clash" ] || { echo "the build and the polygon share: $clash" >&2; exit 1; }
if [ -e "$POLYGON/demo/index.html" ]; then echo "the polygon has demo/index.html already" >&2; exit 1; fi

mkdir -p "$OUT"
cp -a "$POLYGON/." "$OUT/"
mkdir -p "$OUT/demo"
mv "$OUT/index.html" "$OUT/demo/index.html"
# The polygon's links home: "/" is the docs now.
home_links=0
for page in "$OUT"/demo/index.html "$OUT"/*.html; do
  n=$(grep -o 'href="/"' "$page" | wc -l | tr -d ' ' || true)
  [ "$n" = "0" ] && continue
  perl -pi -e 's#href="/"#href="/demo/"#g' "$page"
  home_links=$((home_links + n))
done
[ "$home_links" -gt 0 ] || { echo "no polygon link home rewritten: its markup changed" >&2; exit 1; }

cp -a "$DOCS/." "$OUT/"
# Browsers ask for /favicon.ico on the polygon's pages; the site's own icon answers.
[ -e "$OUT/favicon.ico" ] || cp "$SITE/assets/favicon.ico" "$OUT/favicon.ico"

frames=$(grep -rho ' sandbox="allow-scripts"' "$DOCS" --include='*.html' | wc -l | tr -d ' ' || true)
[ "$frames" -gt 0 ] || { echo "no example frame in the build: its markup changed" >&2; exit 1; }
if [ "$OPEN_FRAMES" = 1 ]; then
  { grep -rl ' sandbox="allow-scripts"' "$OUT/ru" "$OUT/index.html" "$OUT/404.html" --include='*.html' || true; } | while read -r page; do
    perl -pi -e 's/ sandbox="allow-scripts"//g' "$page"
  done
  left=$(grep -rho 'sandbox="allow-scripts"' "$OUT/ru" --include='*.html' | wc -l | tr -d ' ' || true)
  [ "$left" = "0" ] || { echo "frame rewrite mismatch: $frames frames, $left left sandboxed" >&2; exit 1; }
fi

node "$SITE/scripts/landing-transform.mjs" "$OUT"

echo "composed $(find "$OUT" -type f | wc -l | tr -d ' ') files in $OUT: docs at /, polygon at /demo/ ($home_links links home), $frames example frames $([ "$OPEN_FRAMES" = 1 ] && echo opened for a local host || echo sandboxed)"
