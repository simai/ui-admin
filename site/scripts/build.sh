#!/bin/sh
# Usage: sh site/scripts/build.sh <set build workspace> [--ui DIR]
#
# Builds the set site locally over the set's own build:
#   1. lays the SIMAI Framework release and the set into the installed Docara
#      copy (scripts/materialize-framework-runtime.php; vendor/ is ignored);
#   2. extracts the release's distr from ui's git objects into .framework/
#      (ignored) for Docara's page composition runtime (DOCARA_SIMAI_UI_ROOT),
#      which Docara 3.18.0 cannot project for this release itself;
#   3. checks that every generated part of the content is current
#      (build-pages and build-reference against the workspace's receipt,
#      build-examples for the examples' demo host), so a page never drifts
#      from the set it documents;
#   4. runs docara build production and verify-static (a link to /demo/, the
#      full example publish-local.sh lays beside the build, allowed), then the site lint
#      (scripts/site-lint.mjs) over the content and the built pages.
# <set build workspace> is the one package/scripts/gates.sh wrote (it holds
# build/package-receipt.json and build/wave-1/output/package/admin). Serve the
# result with node scripts/serve.mjs.
set -eu
site=$(cd "$(dirname "$0")/.." && pwd)
workspace=$(cd "${1:?usage: build.sh <set build workspace> [--ui DIR]}" && pwd)
shift
ui="$site/../../ui"
[ "${1:-}" = "--ui" ] && ui=$2
ui=$(cd "$ui" && pwd)
cd "$site"
[ -d vendor/simai/docara ] || composer install --no-interaction
php -d memory_limit=2G scripts/materialize-framework-runtime.php "$ui" \
  --receipt="$workspace/build/package-receipt.json" --from="$workspace/build/wave-1/output/package/admin" > /dev/null
commit=$(php -r '$l=json_decode(file_get_contents("simai-framework.lock.json"),true); echo $l["runtime"]["ui"]["commit"];')
if [ "$(cat .framework/COMMIT 2>/dev/null || true)" != "$commit" ]; then
  rm -rf .framework && mkdir -p .framework
  git -C "$ui" archive --format=tar "$commit" distr | tar -x -C .framework
  echo "$commit" > .framework/COMMIT
fi
node scripts/build-pages.mjs --check --receipt "$workspace/build/package-receipt.json"
node scripts/build-examples.mjs --check
node scripts/build-reference.mjs --check --receipt "$workspace/build/package-receipt.json"
DOCARA_SIMAI_UI_ROOT="$site/.framework" php -d memory_limit=2G vendor/bin/docara build production
# verify-static checks the Docara build alone. The full example at /demo/ is
# not a Docara page: publish-local.sh lays it beside the build, so a link to
# /demo/ is the one reference allowed to point outside the build.
php -d memory_limit=2G vendor/bin/docara verify-static build_production > .docara-verify.out 2>&1 || true
node -e '
const text = require("fs").readFileSync(".docara-verify.out", "utf8");
const report = JSON.parse(text.slice(text.indexOf("{")));
const broken = report.broken.filter((one) => one.reference !== "/demo/");
console.log(JSON.stringify({html_pages: report.html_pages, references: report.local_references_checked, to_demo: report.broken.length - broken.length, broken: broken.length}));
if (broken.length) { console.error(JSON.stringify(broken, null, 1)); process.exit(1); }'
node scripts/site-lint.mjs
