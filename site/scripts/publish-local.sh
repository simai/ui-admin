#!/usr/bin/env bash
# Usage: scripts/publish-local.sh [target directory]
#
# Copies the built site (build_production) to the local review host, by default
# ~/Sites/ui-view.test, served as https://ui-view.test by ServBay. The
# copy is exact (rsync --delete) except for one change in the copy only:
#
# The live examples run in sandboxed srcdoc frames (sandbox="allow-scripts"),
# whose origin is opaque. Chromium's Local Network Access blocks every request
# from an opaque-origin frame to a loopback or private address: scripts,
# stylesheets and fetches fail even with Access-Control-Allow-Origin, so on a
# local host the frame never loads the SIMAI Framework runtime or the set and
# only its static markup shows. A public host is not affected. For the local
# copy the frames also get allow-same-origin: they then run as the site's own
# origin, which the local host serves. The examples are this repository's own
# code. The build itself, and anything deployed from it, keeps Docara's sandbox.
#
# The copy's home page also gets the connection line in its hero and its live
# example without code tabs (scripts/landing-transform.mjs, Docara requests 9,
# 14 and 15).
set -euo pipefail

SITE="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$SITE/build_production"
TARGET="${1:-$HOME/Sites/ui-view.test}"

[ -f "$SOURCE/index.html" ] || { echo "no build at $SOURCE: run scripts/build.sh first" >&2; exit 1; }
mkdir -p "$TARGET"
rsync -a --delete "$SOURCE/" "$TARGET/"

expected=$(grep -rho 'sandbox="allow-scripts"' "$SOURCE" --include='*.html' | wc -l | tr -d ' ' || true)
{ grep -rl 'sandbox="allow-scripts"' "$TARGET" --include='*.html' || true; } | while read -r page; do
  perl -pi -e 's/sandbox="allow-scripts"/sandbox="allow-scripts allow-same-origin"/g' "$page"
done
changed=$(grep -rho 'sandbox="allow-scripts allow-same-origin"' "$TARGET" --include='*.html' | wc -l | tr -d ' ' || true)
left=$(grep -rho 'sandbox="allow-scripts"' "$TARGET" --include='*.html' | wc -l | tr -d ' ' || true)
if [ "$changed" != "$expected" ] || [ "$left" != "0" ]; then
  echo "frame rewrite mismatch: expected $expected, changed $changed, left $left" >&2
  exit 1
fi
# The home page's hero line and clean example (see scripts/landing-transform.mjs).
node "$SITE/scripts/landing-transform.mjs" "$TARGET"
echo "published $(find "$TARGET" -type f | wc -l | tr -d ' ' || true) files to $TARGET ($changed example frames opened for the local host)"
