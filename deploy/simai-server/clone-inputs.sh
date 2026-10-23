#!/usr/bin/env bash
# Usage: deploy/simai-server/clone-inputs.sh <parent directory>
#
# Clones the repositories the build reads beside this checkout, each at the
# revision the locks pin (deploy/simai-server/pins.mjs), into <parent>: the
# layout the scripts default to (../ui, ../ui-source, ../ui-builder, ../ui-pro).
# The package source is the components/ folder of simai/ui-pro, so it is cloned
# too (owner, 2026-10-23: the components left this repository and it became
# their reference application). pin-framework-pair.mjs reads ../ui from the lock
# itself, not from SIMAI_UI_REPO, so the parent must be the directory this
# checkout sits in.
#
# Full clones on purpose: the pin checks ask git which commit last wrote a
# folder (`git log -1 -- distr` in ui, `-- components` in ui-pro) and the
# package build lays its overlay out of git objects, so a shallow clone would
# answer wrongly.
#
# Mirrors simai/ui-doc's CI (.github/workflows/quality.yml), which rebuilds the
# same package on Linux byte for byte.
set -euo pipefail

parent="${1:?usage: clone-inputs.sh <parent directory>}"
here="$(cd "$(dirname "$0")" && pwd)"
pins="$(node "$here/pins.mjs")"
pin() { printf '%s\n' "$pins" | sed -n "s/^$1=//p"; }

clone() { # <owner/repo> <directory> <revision>
  local target="$parent/$2"
  if [ -e "$target" ]; then
    echo "$target already exists; refusing to reuse a checkout of unknown state" >&2
    return 1
  fi
  for attempt in 1 2 3; do
    git clone --quiet --no-checkout "https://github.com/$1.git" "$target" && break
    rm -rf "$target"
    [ "$attempt" -lt 3 ] || return 1
    sleep 10
  done
  git -C "$target" checkout --quiet --detach "$3"
  test "$(git -C "$target" rev-parse HEAD)" = "$3"
  echo "$1 $3 -> $target"
}

mkdir -p "$parent"
# One ui clone holds both sides of the pair. It is checked out at the core
# commit (the release build commit); the smart commit may be an older one that
# last wrote distr/smart, and the release contract names both (pins.mjs).
clone simai/ui ui "$(pin UI_CORE_REVISION)"
node "$here/pins.mjs" --verify-ui "$parent/ui"

# The package source is simai/ui-pro, cloned at the pinned revision. The
# ui-source revision the package is built over is the one its
# framework.lock.json pins at that commit, so it is read from that clone.
clone "$(pin LARENA_REPOSITORY)" ui-pro "$(pin LARENA_REVISION)"
package="$parent/ui-pro"
source_lock="$(git -C "$package" show "$(pin LARENA_REVISION):$(pin LARENA_PATH)/framework.lock.json")"
source_repository="$(printf '%s' "$source_lock" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).source.repository))')"
source_revision="$(printf '%s' "$source_lock" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).source.revision))')"
[[ "$source_repository" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$ ]] || { echo "bad ui-source repository: $source_repository" >&2; exit 1; }
[[ "$source_revision" =~ ^[0-9a-f]{40}$ ]] || { echo "bad ui-source revision: $source_revision" >&2; exit 1; }
clone "$source_repository" ui-source "$source_revision"

clone "$(pin BUILDER_REPOSITORY)" ui-builder "$(pin BUILDER_REVISION)"
yarn --cwd "$parent/ui-builder" install --frozen-lockfile --non-interactive --silent
