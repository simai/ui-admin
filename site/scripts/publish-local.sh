#!/usr/bin/env bash
# Usage: scripts/publish-local.sh --polygon DIR [--release DIR] [--link PATH]
#
# Publishes the built site (build_production) to the local review host
# https://ui-admin.test (ServBay serves ~/Sites/ui-admin.test, a symlink to a
# release folder). Every publish is a NEW release folder; the symlink moves to
# it and the earlier folders stay, so going back is moving the link back.
#
#   --polygon DIR  a built polygon of this repository (npm run build: dist/).
#                  It goes beside the docs under /demo/ (scripts/compose.sh).
#   --release DIR  the new release folder (default
#                  ~/Sites/.ui-admin-releases/<date>-admin-site); it must not
#                  exist.
#   --link PATH    the symlink the host serves (default ~/Sites/ui-admin.test).
#
# Changes made in the copy only, never in the build:
#
# The folder is laid out by scripts/compose.sh, the same script the deploy
# uses (deploy/simai-server/assemble.sh), with --open-frames: Chromium's Local
# Network Access blocks the sandboxed example frames on a local host, so the
# local copy drops their sandbox; the deployed one keeps it.
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
"$SITE/scripts/compose.sh" --polygon "$POLYGON" --docs "$SOURCE" --out "$RELEASE" --open-frames

ln -sfn "$RELEASE" "$LINK"
echo "published $RELEASE; $LINK -> $(readlink "$LINK")"
