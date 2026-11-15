#!/bin/sh
# Usage: sh package/scripts/gates.sh <new workspace> [--ui-source DIR] [--ui DIR] [--builder DIR]
#
# Every gate of the set (standard simai.component-set 1.0.0, same-gates-for-every-set),
# in order, over the committed set at HEAD, stopping at the first red one:
#
#   1. build   ui-builder verify-package-reproducibility.cjs: two builds, byte-identical
#   2. receipt ui-builder write-package-receipt.py, checked against the released pair
#              and the passport against the name registry at ui-source main
#   3. unit    scripts/test.mjs: the suite in the overlay of the pinned ui-source
#   4. registry scripts/check-registry.mjs: the passport against the registry at main
#   5. manifest scripts/run-manifest-probes.mjs: every probe.json, real Loader
#   6. browser scripts/run-browser-probes.mjs: tests/browser/*.browser.mjs
#   7. paint   scripts/run-first-paint.mjs check and gate (1280 and 390 px)
#
# The free side is the distr of the released pair whose source the lock pins,
# taken from the ui checkout's git objects (never its working tree). Sibling
# checkouts are the defaults: ../ui-source, ../ui, ../ui-builder beside this
# repository. The overlay is package/.overlay (ignored): the browser probes
# import Playwright, which Node resolves from the overlay's parent folders, so
# it stays inside the checkout. Each gate's output lands in <workspace>/logs/; the summary in
# <workspace>/gates.json. Long: start it with nohup and read the log.
set -eu
here=$(cd "$(dirname "$0")/.." && pwd)
repo=$(git -C "$here" rev-parse --show-toplevel)
workspace=${1:?usage: gates.sh <new workspace> [--ui-source DIR] [--ui DIR] [--builder DIR] [--set ID=DIR ...]}
shift
ui_source="$repo/../ui-source"; ui="$repo/../ui"; builder="$repo/../ui-builder"
# Each set the passport requires (requires_sets), as its released output (the
# folder holding smart/rule.js): --set <id>=<dir>, else ../ui-<id>/package/dist
# beside this repository.
given_sets=""
while [ $# -gt 0 ]; do
  case "$1" in
    --ui-source) ui_source=$2; shift 2 ;;
    --ui) ui=$2; shift 2 ;;
    --builder) builder=$2; shift 2 ;;
    --set) given_sets="$given_sets $2"; shift 2 ;;
    *) echo "unknown option $1" >&2; exit 2 ;;
  esac
done
[ ! -e "$workspace" ] || { echo "the workspace must not exist: $workspace" >&2; exit 2; }
mkdir -p "$workspace/logs"
workspace=$(cd "$workspace" && pwd)
logs="$workspace/logs"
revision=$(git -C "$repo" rev-parse HEAD)
[ -z "$(git -C "$repo" status --porcelain -- package)" ] || { echo "package/ has uncommitted changes: the gates read the commit" >&2; exit 2; }
source_revision=$(node -e "console.log(require('$here/framework.lock.json').source.revision)")

# The released pair built from the pinned source: the newest release lock whose
# build_inputs.source is that revision.
lock=$(cd "$ui" && grep -l "\"commit\": \"$source_revision\"" contracts/releases/ui-*.lock.json | grep -v smart | head -1)
[ -n "$lock" ] || { echo "no release of $source_revision in $ui contracts/releases" >&2; exit 2; }
pair_commit=$(node -e "console.log(require('$ui/$lock').runtime_sources.core.commit)")
mkdir -p "$workspace/free"
git -C "$ui" archive --format=tar "$pair_commit" distr | tar -x -C "$workspace/free"
free="$workspace/free/distr"
build="$workspace/build"
output="$build/wave-1/output/package/admin"
sets=""
for id in $(node -e "console.log((require('$here/set.json').requires_sets ?? []).map(({id}) => id).join(' '))"); do
  dir="$repo/../ui-$id/package/dist"
  for pair in $given_sets; do [ "${pair%%=*}" = "$id" ] && dir=${pair#*=}; done
  [ -f "$dir/smart/rule.js" ] || { echo "the required set $id has no released output at $dir (pass --set $id=DIR)" >&2; exit 2; }
  sets="$sets --set $id=$dir"
done
export PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-$repo/../.playwright-browsers}

step() { echo "== $1"; }
step "build ($revision over ui-source $source_revision, pair $(basename "$lock" .lock.json))"
node "$builder/scripts/verify-package-reproducibility.cjs" "$ui_source" "$build" --package admin \
  --package-source "$repo" --package-path package --package-revision "$revision" > "$logs/build.json"
step receipt
curl -fsS https://raw.githubusercontent.com/simai/ui-source/main/contracts/registry/names.json -o "$workspace/names-main.json"
python3 "$builder/scripts/write-package-receipt.py" --report "$build/report.json" --ui "$ui" --registry "$workspace/names-main.json" > "$logs/receipt.json"
step unit
(cd "$here" && node scripts/test.mjs --committed --ui-source "$ui_source") > "$logs/unit.log" 2>&1
step registry
node "$here/scripts/check-registry.mjs" --registry "$workspace/names-main.json" > "$logs/registry.json"
step manifest
node "$here/scripts/run-manifest-probes.mjs" "$free" "$output" $sets > "$logs/manifest.log" 2>&1
step browser
node "$here/scripts/run-browser-probes.mjs" "$free" "$output" $sets > "$logs/browser.json" 2> "$logs/browser.err"
step "first paint"
node "$here/scripts/run-first-paint.mjs" check "$free" "$output" > "$logs/first-paint-check.log" 2>&1
node "$here/scripts/run-first-paint.mjs" gate "$free" "$output" > "$logs/first-paint-gate.log" 2>&1

node - "$workspace" "$revision" "$lock" <<'NODE'
const [workspace, revision, lock] = process.argv.slice(2);
const {readFileSync, writeFileSync} = require('node:fs');
const read = (name) => readFileSync(`${workspace}/logs/${name}`, 'utf8');
const lastJson = (text) => JSON.parse(text.slice(text.lastIndexOf('\n{') + 1));
const unit = Object.fromEntries([...read('unit.log').matchAll(/^ℹ (tests|pass|fail|skipped) (\d+)/gmu)].map(([, key, value]) => [key, Number(value)]));
const build = JSON.parse(read('build.json'));
const browser = JSON.parse(read('browser.json'));
const manifest = lastJson(read('manifest.log'));
const paint = lastJson(read('first-paint-gate.log'));
const summary = {
  set: 'admin', revision, pair: lock.replace(/^.*\/|\.lock\.json$/gu, ''),
  build: {status: build.status, byte_identical: build.products.package.byte_identical, files: build.products.package.files_count},
  receipt: JSON.parse(read('receipt.json')),
  unit, registry: JSON.parse(read('registry.json')),
  manifest: {checks: manifest.checks, passed: manifest.passed, failed: manifest.failed},
  browser: {passed: browser.passed, failed: browser.failed.length, skipped: browser.skipped.names},
  first_paint: {measured: paint.measured, passed: paint.passed, cls: paint.cls, failed: paint.failed.length},
};
writeFileSync(`${workspace}/gates.json`, `${JSON.stringify(summary, null, 1)}\n`);
console.log(JSON.stringify(summary, null, 1));
NODE
