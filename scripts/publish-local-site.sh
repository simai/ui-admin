#!/usr/bin/env bash
# Build the reference and publish it as the site ui-admin.test serves.
#
# ~/Sites/ui-admin.test was a plain copy taken on 2026-08-22, with nothing
# tying it to this repository: the published site was seven weeks older than
# the pin, and the pin was a month older than the Framework. A reference nobody
# can republish in one command is a reference nobody republishes (owner,
# 2026-10-09).
#
# The build refuses to run on a stale pin, so publishing cannot quietly ship
# last month's Framework either.
set -euo pipefail

link="${PUBLISH_LINK:-$HOME/Sites/ui-admin.test}"
releases="${PUBLISH_RELEASES:-$HOME/Sites/.ui-admin-releases}"
keep="${PUBLISH_KEEP:-2}"
name="${1:-$(date +%Y%m%d)-admin}"
root="$(cd "$(dirname "$0")/.." && pwd)"

cd "$root"
npm run build

target="$releases/$name"
rm -rf "$target"
mkdir -p "$releases"
cp -R dist "$target"

# The site was a directory, not a link. Moving it aside rather than deleting it
# keeps whatever was there until someone has looked at the new one.
if [ -e "$link" ] && [ ! -L "$link" ]; then
    mv "$link" "$link.replaced-$(date +%Y%m%d%H%M%S)"
fi
ln -sfn "$target" "$link"
echo "published $name -> $link"

current="$(basename "$(readlink "$link")")"
cd "$releases"
kept="$( { echo "$current"; ls -1t; } | awk '!seen[$0]++' | head -n "$keep")"
removed=0
for item in *; do
    if ! printf '%s\n' "$kept" | grep -qxF "$item"; then
        rm -rf "$item"
        removed=$((removed + 1))
    fi
done
echo "kept $keep, removed $removed"
