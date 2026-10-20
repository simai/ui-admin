#!/usr/bin/env bash
# Usage: deploy/simai-server/smoke.sh <artifact root>
#
# Starts the artifact's server.js the way .simai/app.json says, with only the
# artifact's production node_modules, and requires /api/field-types to answer
# 200 with JSON. It runs on a copy: server.js writes data.json and avatars
# beside itself, and the artifact must ship without them.
set -euo pipefail

artifact="$(cd "${1:?usage: smoke.sh <artifact root>}" && pwd)"
work="$(mktemp -d)"
pid=
cleanup() {
  local status=$?
  if [ -n "$pid" ]; then kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; fi
  rm -rf "$work"
  exit "$status"
}
trap cleanup EXIT
cp -R "$artifact/." "$work/"
port="$(node -e 'const s=require("net").createServer().listen(0,()=>{console.log(s.address().port);s.close()})')"

(cd "$work" && PORT="$port" NODE_PATH='' exec node server.js) > "$work/server.log" 2>&1 &
pid=$!
for _ in $(seq 1 120); do
  if code="$(curl -s -o "$work/field-types.json" -w '%{http_code}' "http://127.0.0.1:$port/api/field-types")" && [ "$code" = 200 ]; then
    node -e 'const v=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));if(!v||typeof v!=="object")process.exit(1)' "$work/field-types.json"
    echo "server.js answers /api/field-types 200 on port $port"
    exit 0
  fi
  kill -0 "$pid" 2>/dev/null || break
  sleep 1
done
echo "server.js did not answer /api/field-types with 200 (last: ${code:-none})" >&2
cat "$work/server.log" >&2
exit 1
