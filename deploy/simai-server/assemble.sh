#!/usr/bin/env bash
# Usage: deploy/simai-server/assemble.sh <empty output directory>
#
# Lays out the artifact the simai-env server deploys, from a checkout where
# `npm run build` has already written dist/ (the polygon) and
# `site/scripts/build.sh --released` has written site/build_production (the
# Admin set's documentation). This file is the one place the layout is decided
# (to be confirmed with the SIMAI ENV session):
#
#   dist/             the site, served statically by server.js: the
#                     documentation at the root and the polygon at /demo/
#                     (owner C423, 2026-11-23), composed by
#                     site/scripts/compose.sh -- the same script the local
#                     review host ui-admin.test is published with
#   server.js         the mock API (/api/), started with `node server.js`
#   public/           server.js serves /assets from ./public (local use)
#   state/            what server.js writes: data, avatars, uploads; kept
#                     across releases ("shared" in app.json), seeded empty
#   package.json      with package-lock.json: what node_modules was installed from
#   node_modules/     production dependencies of server.js only (npm ci --omit=dev)
#   .simai/app.json   the app description, copied from deploy/simai-server/app.json
#
# server.js writes state/data.json, state/avatars and state/uploads at run
# time and serves the files under /api/assets/; only the empty state/ ships.
set -euo pipefail

out="${1:?usage: assemble.sh <empty output directory>}"
root="$(cd "$(dirname "$0")/../.." && pwd)"

test -f "$root/dist/index.html" || { echo "no dist/index.html: run npm run build first" >&2; exit 1; }
test -f "$root/site/build_production/index.html" || { echo "no site/build_production/index.html: run sh site/scripts/build.sh --released first" >&2; exit 1; }
if [ -e "$out" ] && [ -n "$(ls -A "$out")" ]; then
  echo "$out is not empty" >&2
  exit 1
fi
mkdir -p "$out/.simai"

bash "$root/site/scripts/compose.sh" --polygon "$root/dist" --docs "$root/site/build_production" --out "$out/dist"
cp -R "$root/public" "$out/public"
cp "$root/server.js" "$root/package.json" "$root/package-lock.json" "$out/"
cp "$root/deploy/simai-server/app.json" "$out/.simai/app.json"
# An Actions artifact drops empty directories, so state/ carries a marker.
mkdir -p "$out/state" && : > "$out/state/.keep"

# No bin links: the artifact travels as an Actions artifact, which does not
# keep symlinks, and server.js needs no executables.
(cd "$out" && npm ci --omit=dev --no-bin-links --ignore-scripts --no-audit --no-fund --loglevel=error)

if [ -n "$(find "$out" -type l)" ]; then
  echo "the artifact holds symlinks:" >&2
  find "$out" -type l >&2
  exit 1
fi
echo "assembled $(du -sh "$out" | cut -f1) in $out"
