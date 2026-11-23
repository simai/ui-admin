#!/usr/bin/env bash
# Build the site and publish it as the site ui-admin.test serves.
#
# ~/Sites/ui-admin.test was a plain copy taken on 2026-08-22, with nothing
# tying it to this repository: the published site was seven weeks older than
# the pin, and the pin was a month older than the Framework. A reference nobody
# can republish in one command is a reference nobody republishes (owner,
# 2026-10-09).
#
# Since owner decision C423 (2026-11-23) the site is the Admin set's
# documentation at the root and the polygon at /demo/, the layout
# admin.simai.io deploys (deploy/simai-server/assemble.sh). This builds both --
# the polygon (npm run build, which refuses a stale pin) and the documentation
# over the set's released output (site/scripts/build.sh --released) -- and
# publishes them with site/scripts/publish-local.sh: a new release folder under
# ~/Sites/.ui-admin-releases, the ~/Sites/ui-admin.test link moved to it, and
# every earlier folder kept, so going back is moving the link back.
set -euo pipefail

link="${PUBLISH_LINK:-$HOME/Sites/ui-admin.test}"
releases="${PUBLISH_RELEASES:-$HOME/Sites/.ui-admin-releases}"
name="${1:-$(date +%Y%m%d)-admin}"
root="$(cd "$(dirname "$0")/.." && pwd)"

cd "$root"
npm run build
sh site/scripts/build.sh --released ${SIMAI_UI_REPO:+--ui "$SIMAI_UI_REPO"}

# The site was a directory, not a link. Moving it aside rather than deleting it
# keeps whatever was there until someone has looked at the new one.
if [ -e "$link" ] && [ ! -L "$link" ]; then
    mv "$link" "$link.replaced-$(date +%Y%m%d%H%M%S)"
fi
mkdir -p "$releases"
bash site/scripts/publish-local.sh --polygon dist --release "$releases/$name" --link "$link"
