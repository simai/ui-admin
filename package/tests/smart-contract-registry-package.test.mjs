import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import test from "node:test";

// The package part of ui-source tests/smart-contract-registry.test.mjs, for the
// set admin (split from simai/ui-pro components/tests/smart-contract-registry-package.test.mjs
// at 2ba35fa). It runs in the overlay (ui-source at the pinned revision with this
// repository laid over it): sf-contract walks every smart.manifest.json under src,
// so the registry it builds there holds the free components and the set's one.
const root = new URL("..", import.meta.url);
const run = (...args) => execFileSync(process.execPath, ["scripts/sf-contract.mjs", ...args], {cwd: root, encoding: "utf8"});

test("the set's admin menu is generated into the searchable registry beside the free components", () => {
  run("build");
  const registry = JSON.parse(readFileSync(new URL("../contracts/generated/smart-component-contract-registry.json", import.meta.url), "utf8"));
  assert.equal(registry.schema, "simai.smart-component-contract-registry.v2");
  // The free registry's Smart components at the pinned revision (87 at
  // e7ea89e07a3a, pair ui-9ceecc24c988) and the set's four (the menu, the
  // shell, the notifications, the activity) make 91.
  assert.equal(registry.entries.length, 91);
  for (const id of ["smart.admin-menu", "smart.admin-shell", "smart.admin-notifications", "smart.admin-activity"]) {
    assert.ok(registry.entries.some((entry) => entry.id === id), id);
  }
  assert.ok(registry.entries.find(({id}) => id === "smart.admin-notifications").capabilities.includes("notifications"));
  assert.ok(registry.entries.find(({id}) => id === "smart.admin-activity").capabilities.includes("activity"));
  assert.ok(registry.entries.find(({id}) => id === "smart.admin-menu").capabilities.includes("navigation"));
  assert.ok(registry.entries.every(({contract_schema}) => contract_schema.version === 2));
});

test("CLI discovers, describes and verifies the admin menu", () => {
  const listed = JSON.parse(run("list", "--kind", "smart", "--capability", "navigation"));
  // The free site navigation and the set's admin menu.
  assert.ok(listed.some(({id}) => id === "smart.admin-menu"), "the admin menu is listed among the navigation components");
  const packet = JSON.parse(run("describe", "smart.admin-menu", "--format", "ai"));
  assert.equal(packet.decision.reuse_mode, "whole");
  assert.equal(packet.public_abi.custom_element, "sf-admin-menu");
  assert.equal(packet.conformance.compatibility.contract_schema.version, 2);
  assert.equal(packet.conformance.compatibility.migrations.at(-1).to, '1.17.2');
  assert.match(packet.backend.integration_examples.larena_php, /Smart::render\('ui\.admin_menu'/);
  assert.deepEqual(JSON.parse(run("verify", "smart.admin-menu")), {ok: true, verified: ["smart.admin-menu"]});
});
