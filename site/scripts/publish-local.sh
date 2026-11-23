#!/usr/bin/env bash
# Usage: scripts/publish-local.sh --polygon DIR [--release DIR] [--link PATH]
#
# Publishes the built site (build_production) to the local review host
# https://ui-admin.test (ServBay serves ~/Sites/ui-admin.test, a symlink to a
# release folder). Every publish is a NEW release folder; the symlink moves to
# it and the earlier folders stay, so going back is moving the link back.
#
#   --polygon DIR  a built polygon of this repository (npm run build: dist/,
#                  or the root of an earlier ui-admin.test release). It goes
#                  beside the docs: its index.html becomes /demo/index.html,
#                  its links to "/" become "/demo/", and everything else keeps
#                  its root path (/assets/, /distr/, /data/, …), which the
#                  Docara build does not use (Docara writes under /_docara/,
#                  /ru/, /en/). A path present in both stops the publish.
#   --release DIR  the new release folder (default
#                  ~/Sites/.ui-admin-releases/<date>-admin-site); it must not
#                  exist.
#   --link PATH    the symlink the host serves (default ~/Sites/ui-admin.test).
#
# Changes made in the copy only, never in the build:
#
# The live examples run in sandboxed srcdoc frames (sandbox="allow-scripts"),
# whose origin is opaque. Chromium's Local Network Access blocks every request
# from an opaque-origin frame to a loopback or private address, so on a local
# host the frame never loads SIMAI Framework or the set. The local copy drops
# the sandbox attribute: the frames run as the site's own origin (adding
# allow-same-origin instead makes Chrome warn on every frame). The examples are
# this repository's own code. The build, and anything deployed from it, keeps
# Docara's sandbox.
#
# The home page's live example loses its code tabs, and the hero's effect gets
# a mask under its text (scripts/landing-transform.mjs).
set -euo pipefail

SITE="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$SITE/build_production"
POLYGON=""
RELEASE="$HOME/Sites/.ui-admin-releases/$(date +%Y%m%d)-admin-site"
LINK="$HOME/Sites/ui-admin.test"
while [ $# -gt 0 ]; do
  case "$1" in
    --polygon) POLYGON="$2"; shift 2 ;;
    --release) RELEASE="$2"; shift 2 ;;
    --link) LINK="$2"; shift 2 ;;
    *) echo "unknown argument $1" >&2; exit 2 ;;
  esac
done

[ -f "$SOURCE/index.html" ] || { echo "no build at $SOURCE: run scripts/build.sh first" >&2; exit 1; }
[ -n "$POLYGON" ] && [ -f "$POLYGON/index.html" ] && [ -d "$POLYGON/distr" ] || { echo "--polygon DIR: a built polygon with index.html and distr/" >&2; exit 1; }
[ ! -e "$RELEASE" ] || { echo "$RELEASE exists: a publish makes a new release folder" >&2; exit 1; }
[ ! -e "$LINK" ] || [ -L "$LINK" ] || { echo "$LINK is not a symlink" >&2; exit 1; }
POLYGON="$(cd "$POLYGON" && pwd)"

# The two trees must not share a path, apart from the polygon's index.html
# that moves to /demo/.
clash=$(cd "$SOURCE" && find . -mindepth 1 -maxdepth 1 | sed 's#^\./##' | while read -r entry; do
  [ "$entry" = "index.html" ] && continue
  [ -e "$POLYGON/$entry" ] && echo "$entry"
done || true)
[ -z "$clash" ] || { echo "the build and the polygon share: $clash" >&2; exit 1; }
if [ -e "$POLYGON/demo/index.html" ]; then echo "the polygon has demo/index.html already" >&2; exit 1; fi

mkdir -p "$RELEASE"
cp -a "$POLYGON/." "$RELEASE/"
mkdir -p "$RELEASE/demo"
mv "$RELEASE/index.html" "$RELEASE/demo/index.html"
# The polygon's links home: "/" is the docs now.
home_links=0
for page in "$RELEASE"/demo/index.html "$RELEASE"/*.html; do
  n=$(grep -o 'href="/"' "$page" | wc -l | tr -d ' ' || true)
  [ "$n" = "0" ] && continue
  perl -pi -e 's#href="/"#href="/demo/"#g' "$page"
  home_links=$((home_links + n))
done
[ "$home_links" -gt 0 ] || { echo "no polygon link home rewritten: its markup changed" >&2; exit 1; }

rsync -a "$SOURCE/" "$RELEASE/"
# Browsers ask for /favicon.ico on the polygon's pages; the site's own icon answers.
[ -e "$RELEASE/favicon.ico" ] || cp "$SITE/assets/favicon.ico" "$RELEASE/favicon.ico"

expected=$(grep -rho ' sandbox="allow-scripts"' "$SOURCE" --include='*.html' | wc -l | tr -d ' ' || true)
{ grep -rl ' sandbox="allow-scripts"' "$RELEASE/ru" "$RELEASE/index.html" "$RELEASE/404.html" --include='*.html' || true; } | while read -r page; do
  perl -pi -e 's/ sandbox="allow-scripts"//g' "$page"
done
left=$(grep -rho 'sandbox="allow-scripts"' "$RELEASE/ru" --include='*.html' | wc -l | tr -d ' ' || true)
[ "$expected" -gt 0 ] && [ "$left" = "0" ] || { echo "frame rewrite mismatch: expected $expected, left $left" >&2; exit 1; }

node "$SITE/scripts/landing-transform.mjs" "$RELEASE"

ln -sfn "$RELEASE" "$LINK"
echo "published $(find "$RELEASE" -type f | wc -l | tr -d ' ') files to $RELEASE ($expected example frames opened for the local host, $home_links polygon links home); $LINK -> $(readlink "$LINK")"
