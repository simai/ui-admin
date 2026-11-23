#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Materialize the exact SIMAI Framework release this set site is built over,
 * and the set admin beside it, into the installed Docara copy.
 *
 * Adapted from simai/ui-doc scripts/materialize-framework-runtime.php (the
 * same Docara mechanism: the installed Framework projection is replaced from
 * immutable Git objects of a `ui` checkout, and a product component package is
 * laid by its package receipt). The differences: the set is this repository's
 * own `package/`, so its receipt is not pinned here but checked against this
 * checkout (the receipt names simai/ui-admin, folder `package`, a commit whose
 * `package/` tree is the one at HEAD, and the release the site is pinned to);
 * the project lock is read from the working tree.
 *
 * The free release is the one the set is built over (package/framework.lock.json
 * and package/set.json name its ui-source revision). Docara 3.18.0 bundles an
 * older pair, not the one the set is built over; this script
 * replaces it with the pinned release.
 *
 *   php scripts/materialize-framework-runtime.php /absolute/ui \
 *       --receipt=/absolute/build/package-receipt.json \
 *       --from=/absolute/build/wave-1/output/package/admin [--package=/absolute/docara-package]
 *
 * Package bytes land only in the installed Docara copy (vendor/, ignored) and
 * in the built site; this repository records the receipt's identity and the
 * files' hashes in simai-framework.lock.json, never the files.
 */

const UI_METADATA_REVISION = 'b13d856d0f24778347abc5d701410c75b09e8692';
const UI_RUNTIME_REVISION = 'b4f79e1c58b70e4a7f6512ed19084b4bc34e6098';
const SOURCE_REVISION = 'e59dbad1c10848ec4f2663f52c04aa14b7be39f6';
const BUILDER_REVISION = 'ee30c8215ff5b6491447e98c3d7ab674447a67bb';
const RELEASE_LOCK = 'contracts/releases/ui-b4f79e1c58b7.lock.json';
// The release on npm, the form the guide's CDN snippets use
// (https://cdn.jsdelivr.net/npm/<package>@<version>/distr/...). The version is
// derived from the release commit, never chosen: 5.<yyyymmdd>.<hhmm> of its
// UTC commit time, the last part without leading zeros. The release id stays
// the commit. scripts/sync-framework-documentation-versions.php checks the
// version against UI_RUNTIME_REVISION and moves the snippets with it.
const NPM_PACKAGE = '@simai-studio/ui';
const NPM_VERSION = '5.20261123.1101';
// The set this repository holds: its receipt must name this repository's
// package folder (checked against the checkout below).
const PACKAGES = [
    'admin' => [
        'repository' => 'simai/ui-admin',
        'path' => 'package',
    ],
];

$projectRoot = dirname(__DIR__);
$uiRoot = null;
$receiptPaths = [];
$withoutPackages = false;
$fromPath = null;
$packageRoot = $projectRoot . '/vendor/simai/docara';
foreach (array_slice($argv, 1) as $argument) {
    if (str_starts_with($argument, '--receipt=')) {
        $receiptPaths[] = substr($argument, strlen('--receipt='));
    } elseif (str_starts_with($argument, '--package=')) {
        $packageRoot = substr($argument, strlen('--package='));
    } elseif (str_starts_with($argument, '--from=')) {
        $fromPath = substr($argument, strlen('--from='));
    } elseif ($argument === '--without-packages') {
        $withoutPackages = true;
    } elseif (! str_starts_with($argument, '--') && $uiRoot === null) {
        $uiRoot = $argument;
    } else {
        $uiRoot = null;
        break;
    }
}

if (! is_string($uiRoot) || ($receiptPaths === []) === ! $withoutPackages) {
    fwrite(STDERR, "Usage: php scripts/materialize-framework-runtime.php /absolute/ui (--receipt=/absolute/package-receipt.json --from=/absolute/build-output ... | --without-packages) [--package=/absolute/docara-package]\n");
    exit(2);
}

$uiRoot = realpath($uiRoot);
$receiptPaths = array_map(static fn (string $path): string|false => realpath($path), $receiptPaths);
$packageRoot = realpath($packageRoot);
if ($uiRoot === false || in_array(false, $receiptPaths, true) || $packageRoot === false || ! is_dir($packageRoot)) {
    throw new RuntimeException('FRAMEWORK_MATERIALIZATION_INPUT_MISSING');
}

$git = static function (string $root, array $arguments): string {
    $pipes = [];
    $process = proc_open(['git', '-C', $root, ...$arguments], [
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ], $pipes);
    if (! is_resource($process)) {
        throw new RuntimeException('FRAMEWORK_GIT_PROCESS_FAILED');
    }
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $status = proc_close($process);
    if ($status !== 0 || ! is_string($stdout)) {
        throw new RuntimeException('FRAMEWORK_GIT_COMMAND_FAILED: ' . trim((string) $stderr));
    }

    return $stdout;
};

$writeJson = static function (string $path, array $value): void {
    $bytes = json_encode($value, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    if (file_put_contents($path, $bytes, LOCK_EX) === false) {
        throw new RuntimeException('FRAMEWORK_MATERIALIZATION_WRITE_FAILED: ' . $path);
    }
};

$copyBytes = static function (string $bytes, array $paths): void {
    foreach ($paths as $path) {
        if (file_put_contents($path, $bytes, LOCK_EX) === false) {
            throw new RuntimeException('FRAMEWORK_MATERIALIZATION_WRITE_FAILED: ' . $path);
        }
    }
};

foreach ([
    [$uiRoot, UI_METADATA_REVISION],
    [$uiRoot, UI_RUNTIME_REVISION],
] as [$root, $revision]) {
    $actual = trim($git($root, ['rev-parse', $revision . '^{commit}']));
    if ($actual !== $revision) {
        throw new RuntimeException('FRAMEWORK_REVISION_MISMATCH: ' . $revision);
    }
}

$release = json_decode(
    $git($uiRoot, ['show', UI_METADATA_REVISION . ':' . RELEASE_LOCK]),
    true,
    512,
    JSON_THROW_ON_ERROR,
);
// The release is named once, by the lock this site is pinned to; the
// identifier inside that lock has to agree with its own file name, and both
// have to name the runtime revision pinned above. Release lock v2: Core and
// Smart are the same `ui` revision, Smart under `distr/smart`.
$expected = [
    'schema_version' => 2,
    'compatibility_id' => basename(RELEASE_LOCK, '.lock.json'),
    'core' => UI_RUNTIME_REVISION,
    'smart' => UI_RUNTIME_REVISION,
    'smart_path' => 'distr/smart',
    'source' => SOURCE_REVISION,
    'builder' => BUILDER_REVISION,
];
$actual = [
    'schema_version' => $release['schema_version'] ?? null,
    'compatibility_id' => $release['compatibility_id'] ?? null,
    'core' => $release['runtime_sources']['core']['commit'] ?? null,
    'smart' => $release['runtime_sources']['smart']['revision'] ?? null,
    'smart_path' => $release['runtime_sources']['smart']['runtime_path'] ?? null,
    'source' => $release['build_inputs']['source']['commit'] ?? null,
    'builder' => $release['build_inputs']['builder']['commit'] ?? null,
];
if ($actual !== $expected || ($release['status'] ?? null) !== 'bounded') {
    throw new RuntimeException('FRAMEWORK_RELEASE_LOCK_MISMATCH');
}

$registryBytes = $git(
    $uiRoot,
    ['show', UI_METADATA_REVISION . ':contracts/generated/framework-contract-registry.json'],
);
$documentationBytes = $git(
    $uiRoot,
    ['show', UI_METADATA_REVISION . ':contracts/generated/documentation-source.json'],
);
$registry = json_decode($registryBytes, true, 512, JSON_THROW_ON_ERROR);
if (($registry['compatibility']['id'] ?? null) !== $expected['compatibility_id']) {
    throw new RuntimeException('FRAMEWORK_REGISTRY_COMPATIBILITY_MISMATCH');
}
$docaraPair = $expected['compatibility_id'];

// Each receipt has to be the package this site pins, built from the pinned
// source revision into the pinned archive, beside this release. Docara checks
// the package files against the receipt when it lays them.
$receipts = [];
foreach ($receiptPaths as $receiptPath) {
    $receipt = json_decode((string) file_get_contents($receiptPath), true, 512, JSON_THROW_ON_ERROR);
    $name = is_array($receipt) ? ($receipt['package'] ?? null) : null;
    $pinned = is_string($name) ? (PACKAGES[$name] ?? null) : null;
    if ($pinned === null || isset($receipts[$name])) {
        throw new RuntimeException('FRAMEWORK_PACKAGE_NOT_PINNED: ' . (string) $name);
    }
    if (($receipt['package_source']['repository'] ?? null) !== $pinned['repository']
        || ($receipt['package_source']['path'] ?? null) !== $pinned['path']
    ) {
        throw new RuntimeException('FRAMEWORK_PACKAGE_RECEIPT_MISMATCH: ' . $name);
    }
    // The receipt's commit is in this checkout and its package folder is the
    // one at HEAD: the site shows the set as it is committed, never an older build.
    // The release route lays the build itself into <path>/dist after that
    // commit, so dist/ is left out of the comparison.
    $built = (string) ($receipt['package_source']['revision'] ?? '');
    $repositoryRoot = trim($git($projectRoot, ['rev-parse', '--show-toplevel']));
    $changed = static fn (string $commit): string => trim($git($repositoryRoot, ['diff', '--name-only', $commit, 'HEAD', '--', $pinned['path'], ':(exclude)' . $pinned['path'] . '/dist']));
    if (preg_match('/\A[0-9a-f]{40}\z/D', $built) !== 1 || $changed($built) !== '') {
        throw new RuntimeException('FRAMEWORK_PACKAGE_STALE: ' . $name . ' was built from ' . $built
            . ', whose ' . $pinned['path'] . '/ is not the one at HEAD; rebuild the set');
    }
    if (($receipt['framework']['release'] ?? null) !== $docaraPair
        || ($receipt['framework']['source']['revision'] ?? null) !== SOURCE_REVISION
    ) {
        throw new RuntimeException('FRAMEWORK_PACKAGE_RELEASE_MISMATCH: ' . $name . ' is built for '
            . (string) ($receipt['framework']['release'] ?? 'no release'));
    }
    $receipts[$name] = $receiptPath;
}
if (! $withoutPackages && array_diff(array_keys(PACKAGES), array_keys($receipts)) !== []) {
    throw new RuntimeException('FRAMEWORK_PACKAGE_RECEIPT_MISSING: ' . implode(', ', array_diff(array_keys(PACKAGES), array_keys($receipts))));
}

$projectLockPath = $projectRoot . '/simai-framework.lock.json';
$packageLockPath = $packageRoot . '/docs/site/simai-framework.lock.json';
$stubLockPath = $packageRoot . '/stubs/portable/simai-framework.lock.json';
$lock = json_decode((string) file_get_contents($projectLockPath), true, 512, JSON_THROW_ON_ERROR);
// The registry's source digest is the sha256 of `git archive --format=tar`
// of contracts/generated at the metadata revision, as for every earlier pin.
$contractArchiveHash = hash('sha256', $git($uiRoot, [
    'archive', '--format=tar', UI_METADATA_REVISION, 'contracts/generated',
]));
// Packages are recomputed below from their receipts, or left out.
unset($lock['package_projections']);

$uiSource = $release['runtime_sources']['core'];
$smartSource = $release['runtime_sources']['smart'];
$registryHash = hash('sha256', $registryBytes);
$lock['runtime']['pair_id'] = $docaraPair;
$lock['runtime']['bundle_id'] = $docaraPair
    . '-registry-' . substr($registryHash, 0, 8) . '-verified-commit-candidate-v1';
$lock['runtime']['publication_profile'] = 'verified-commit-candidate-v1';
$lock['runtime']['tag'] = null;
$lock['runtime']['ui'] = [
    'tag' => null,
    'commit' => UI_RUNTIME_REVISION,
    'tree' => 'distr',
    'mount' => 'ui',
    'sha256' => $uiSource['archive_sha256'],
    'files' => count(array_filter(
        preg_split('/\R/', trim($git($uiRoot, ['ls-tree', '-r', '--name-only', UI_RUNTIME_REVISION, 'distr']))) ?: [],
    )),
];
// Smart is the same `ui` commit's distr/smart; Docara reads it from there.
$lock['runtime']['ui_smart'] = [
    'tag' => null,
    'commit' => UI_RUNTIME_REVISION,
    'tree' => 'distr/smart',
    'mount' => 'ui',
    'sha256' => $smartSource['archive_sha256'],
    'files' => count(array_filter(
        preg_split('/\R/', trim($git($uiRoot, ['ls-tree', '-r', '--name-only', UI_RUNTIME_REVISION, 'distr/smart']))) ?: [],
    )),
];
$lock['runtime']['framework_registry'] = [
    'schema_id' => 'simai.framework.contract-registry',
    'compatibility_id' => $docaraPair,
    'profile' => 'plain-assets-v1',
    'relative_path' => 'contracts/generated/framework-contract-registry.json',
    'file_sha256' => $registryHash,
    'source' => [
        'commit' => UI_METADATA_REVISION,
        'tree' => 'contracts/generated',
        'tree_oid' => trim($git($uiRoot, ['rev-parse', UI_METADATA_REVISION . ':contracts/generated'])),
        'mount' => 'contract',
        'sha256' => $contractArchiveHash,
        'files' => 2,
    ],
    'documentation_source' => [
        'schema' => 'docara.documentation_source.v1',
        'relative_path' => 'contracts/generated/documentation-source.json',
        'file_sha256' => hash('sha256', $documentationBytes),
    ],
];
$lock['asset_projection']['source'] = ['provider' => 'simai/ui', 'revision' => UI_RUNTIME_REVISION];
$lock['dynamic_asset_projection']['source'] = ['provider' => 'simai/ui', 'revision' => UI_RUNTIME_REVISION];
// A first approximation the Smart sync below replaces; Docara names Smart
// files `smart/<component>/...` whichever repository carries them.
$smartRuntimePaths = array_values(array_filter(
    preg_split('/\R/', trim($git(
        $uiRoot,
        ['ls-tree', '-r', '--name-only', UI_RUNTIME_REVISION, 'distr/smart'],
    ))) ?: [],
    static fn (string $path): bool => preg_match('~/((?:css|js)/[^/]+\.(?:css|js))$~', $path) === 1
        && ! str_contains($path, '.min.'),
));
$smartRuntimeFiles = [];
foreach ($smartRuntimePaths as $path) {
    $smartRuntimeFiles[substr($path, strlen('distr/'))] = [
        'sha256' => hash('sha256', $git($uiRoot, ['show', UI_RUNTIME_REVISION . ':' . $path])),
    ];
}
$lock['dynamic_asset_projection']['files'] = $smartRuntimeFiles;
$lock['runtime']['components']['sf-alert']['css'] = null;
$lock['runtime_projection']['mount'] = '_docara/vendor/simai-framework/runtime/' . UI_RUNTIME_REVISION . '/distr';
$lock['runtime_projection']['source'] = [
    'provider' => 'simai/ui',
    'revision' => UI_RUNTIME_REVISION,
    'tree_sha256' => $uiSource['archive_sha256'],
];
$lock['runtime_projection']['manifest']['path'] = 'portable/vendor/simai-framework/runtime/'
    . UI_RUNTIME_REVISION . '/runtime-manifest.json';
$lock['runtime_projection']['manifest']['public'] = '_docara/vendor/simai-framework/runtime/'
    . UI_RUNTIME_REVISION . '/runtime-manifest.json';

foreach (['ui-alert.json', 'ui-button.json'] as $manifestName) {
    $manifestPath = $packageRoot . '/resources/framework/manifests/' . $manifestName;
    $manifest = json_decode((string) file_get_contents($manifestPath), true, 512, JSON_THROW_ON_ERROR);
    $manifest['provenance']['upstream_revision'] = UI_RUNTIME_REVISION;
    $writeJson($manifestPath, $manifest);
    $key = $manifestName === 'ui-alert.json' ? 'ui.alert' : 'ui.button';
    $lock['manifests'][$key]['sha256'] = hash_file('sha256', $manifestPath);
}

$copyBytes($registryBytes, [
    $projectRoot . '/contracts/generated/framework-contract-registry.json',
    $packageRoot . '/docs/site/contracts/generated/framework-contract-registry.json',
    $packageRoot . '/stubs/portable/contracts/generated/framework-contract-registry.json',
]);
$copyBytes($documentationBytes, [
    $projectRoot . '/contracts/generated/documentation-source.json',
    $packageRoot . '/docs/site/contracts/generated/documentation-source.json',
    $packageRoot . '/stubs/portable/contracts/generated/documentation-source.json',
]);

$writeJson($projectLockPath, $lock);
$writeJson($packageLockPath, $lock);
$writeJson($stubLockPath, $lock);

$runtimeBase = $packageRoot . '/resources/portable/vendor/simai-framework/runtime/' . UI_RUNTIME_REVISION;
if (! is_dir($runtimeBase) && ! mkdir($runtimeBase, 0755, true) && ! is_dir($runtimeBase)) {
    throw new RuntimeException('FRAMEWORK_RUNTIME_DIRECTORY_FAILED');
}
/* A second run starts where a fresh install starts: without the projected
   distribution. Docara's core sync refuses a file on disk its manifest does
   not list (FRAMEWORK_RUNTIME_UNMANIFESTED_FILE), and the files this script
   carries below (core/lang, core/contracts/icon-names.v1.json) are written
   after that sync, so a previous run's copies stopped every next run. The
   sync rewrites the whole distribution from the ui objects, so removing it
   first changes nothing in the result: two runs in a row give the same
   bytes. Only this release's projection folder inside the installed Docara
   copy (vendor/, ignored) is removed. */
$removeTree = static function (string $path) use (&$removeTree): void {
    if (is_link($path) || is_file($path)) {
        if (! unlink($path)) {
            throw new RuntimeException('FRAMEWORK_RUNTIME_CLEAN_FAILED: ' . $path);
        }

        return;
    }
    if (! is_dir($path)) {
        return;
    }
    foreach (scandir($path) ?: [] as $entry) {
        if ($entry !== '.' && $entry !== '..') {
            $removeTree($path . '/' . $entry);
        }
    }
    if (! rmdir($path)) {
        throw new RuntimeException('FRAMEWORK_RUNTIME_CLEAN_FAILED: ' . $path);
    }
};
$projectedDistribution = $runtimeBase . '/distr';
if (! str_starts_with($projectedDistribution, $packageRoot . '/resources/portable/vendor/simai-framework/runtime/')) {
    throw new RuntimeException('FRAMEWORK_RUNTIME_CLEAN_OUTSIDE: ' . $projectedDistribution);
}
$removeTree($projectedDistribution);
$writeJson($runtimeBase . '/runtime-manifest.json', [
    'schema' => 'docara.framework_runtime_assets.v1',
    'root' => 'distr',
    'source' => $lock['runtime_projection']['source'],
    'files' => [],
    'packet_sha256' => hash('sha256', ''),
]);

$runPhp = static function (array $arguments) use ($packageRoot): array {
    $pipes = [];
    $process = proc_open([PHP_BINARY, ...$arguments], [
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ], $pipes, $packageRoot);
    if (! is_resource($process)) {
        throw new RuntimeException('FRAMEWORK_SYNC_PROCESS_FAILED');
    }
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $status = proc_close($process);
    if ($status !== 0) {
        throw new RuntimeException('FRAMEWORK_SYNC_FAILED: ' . trim((string) $stderr));
    }

    return json_decode((string) $stdout, true, 512, JSON_THROW_ON_ERROR);
};

$coreReceipt = $runPhp([$packageRoot . '/scripts/sync-framework-rule-registry.php', $uiRoot]);

/* Docara projects a component as its css and js entrypoint plus whatever the
   stylesheet references. A component that ships data files -- the flag sets are
   fetched by the component at runtime, by a URL it builds itself -- has nothing
   pointing at them from CSS, so the projection leaves them behind and the site
   falls back to emoji while the pair itself carries the files.

   Until the projection learns about declared asset directories, this build
   carries them itself. The list is explicit on purpose: a directory appears here
   because a component was read and found to need it, not because a glob matched.
   Generalising this belongs in Docara, and is written up in the handoff. */
/* core/lang: since the pair ui-1ed6b6c9a040 (owner decision C282) every
   language but English is a language file that core fetches by URL beside
   core/js (core/lang/<code>/<family>.json, listed in core/lang/index.json):
   nothing points at it from CSS, so a Russian page drew English words and
   logged a 404 per family. Carried here until Docara projects it. */
$componentAssetDirectories = ['component/flag/flags', 'core/lang'];
$runtimeDistribution = $runtimeBase . '/distr';
$carried = 0;
foreach ($componentAssetDirectories as $directory) {
    $listing = trim($git($uiRoot, ['ls-tree', '-r', '--name-only', UI_RUNTIME_REVISION, 'distr/' . $directory]));
    foreach (preg_split('/\R/', $listing) ?: [] as $sourcePath) {
        if ($sourcePath === '' || str_ends_with($sourcePath, '.gz')) {
            continue;
        }
        $target = $runtimeDistribution . '/' . substr($sourcePath, strlen('distr/'));
        if (! is_dir(dirname($target)) && ! mkdir(dirname($target), 0755, true) && ! is_dir(dirname($target))) {
            throw new RuntimeException('FRAMEWORK_ASSET_DIRECTORY_FAILED: ' . $sourcePath);
        }
        file_put_contents($target, $git($uiRoot, ['show', UI_RUNTIME_REVISION . ':' . $sourcePath]), LOCK_EX);
        chmod($target, 0644);
        $carried += 1;
    }
}
/* The site serves the runtime to whoever opens it, so it redistributes the
   third-party code inside those files. Lit, Floating UI and the Material fonts
   ask for their notice to travel with them, and the pair carries that notice as
   a contract file; the projection takes css and js, so it has to be named. */
/* core/contracts/icon-names.v1.json: the icon names the core reads by URL
   beside core/js to check an icon name (sf-icon); nothing points at it from
   CSS either, and 11 pages logged a 404 for it (view site acceptance VSA-2).
   ui-doc's copy serves it at the same path. */
$runtimeNoticeFiles = ['core/contracts/third-party-notices.v1.json', 'core/contracts/icon-names.v1.json'];
foreach ($runtimeNoticeFiles as $noticePath) {
    $target = $runtimeDistribution . '/' . $noticePath;
    if (! is_dir(dirname($target)) && ! mkdir(dirname($target), 0755, true) && ! is_dir(dirname($target))) {
        throw new RuntimeException('FRAMEWORK_NOTICE_DIRECTORY_FAILED: ' . $noticePath);
    }
    file_put_contents($target, $git($uiRoot, ['show', UI_RUNTIME_REVISION . ':distr/' . $noticePath]), LOCK_EX);
    chmod($target, 0644);
    $carried += 1;
}

$smartReceipt = $runPhp([$packageRoot . '/scripts/sync-framework-smart-runtime.php', $uiRoot]);
$viewUtilitiesPath = $packageRoot . '/resources/framework/view-utilities.json';
$viewUtilities = json_decode((string) file_get_contents($viewUtilitiesPath), true, 512, JSON_THROW_ON_ERROR);
$viewUtilities['compatibility_id'] = $docaraPair;
$viewUtilities['registry_sha256'] = $registryHash;
$writeJson($viewUtilitiesPath, $viewUtilities);
copy($packageLockPath, $projectLockPath);

// Product component packages, each from its receipt, recorded in this site's
// lock only. Their bytes go to the installed Docara copy (ignored here) and
// from there into the built site.
$packageReceipts = [];
foreach ($receipts as $name => $receiptPath) {
    /* A component set's receipt lists its passport, set.json, beside smart/
       (standard simai.component-set: the builder copies it into the build).
       Docara 3.14.1 reads set receipts as they are (its
       FrameworkPackageReceipt checks the passport the receipt names), so the
       receipt goes unchanged; the files are read from the build's output
       directory (--from) when one is given, which holds smart/ and set.json.
       Docara 3.11.1 refused such a receipt and the site handed it one without
       the passport (docs/DOCARA-REQUESTS.md); that adapter is gone. */
    $arguments = [$packageRoot . '/scripts/sync-framework-package-runtime.php', '--receipt', $receiptPath];
    if (is_string($fromPath)) {
        if (! is_dir($fromPath . '/smart')) {
            throw new RuntimeException('FRAMEWORK_PACKAGE_SET_NEEDS_OUTPUT: --from must hold smart/ for the set ' . $name);
        }
        array_push($arguments, '--from', realpath($fromPath));
    }
    array_push($arguments, '--lock', $projectLockPath);
    $packageReceipts[$name] = $runPhp($arguments);
}

fwrite(STDOUT, json_encode([
    'schema' => 'ui-admin.framework_materialization.v1',
    'status' => 'pass',
    'release_lock' => UI_METADATA_REVISION . ':' . RELEASE_LOCK,
    'candidate' => [
        'ui_metadata' => UI_METADATA_REVISION,
        'ui_runtime' => UI_RUNTIME_REVISION,
        'source' => SOURCE_REVISION,
        'builder' => BUILDER_REVISION,
        'packages' => $withoutPackages ? [] : PACKAGES,
    ],
    'core_projection' => $coreReceipt,
    'smart_projection' => $smartReceipt,
    'package_projections' => $packageReceipts,
    'project_lock_sha256' => hash_file('sha256', $projectLockPath),
    'owner_source_modified' => false,
], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
