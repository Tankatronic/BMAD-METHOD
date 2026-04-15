/**
 * Azure DevOps URL Parsing Tests
 *
 * Verifies that CustomModuleManager.parseSource() correctly handles
 * Azure DevOps Git URLs (dev.azure.com and legacy visualstudio.com).
 *
 * Fixes: https://github.com/bmad-code-org/BMAD-METHOD/issues/2268
 * Usage: node test/test-azure-devops-url-parsing.js
 */

const { CustomModuleManager } = require('../tools/installer/modules/custom-module-manager');

// ANSI colors
const colors = {
  reset: '\u001B[0m',
  green: '\u001B[32m',
  red: '\u001B[31m',
  cyan: '\u001B[36m',
  dim: '\u001B[2m',
};

let passed = 0;
let failed = 0;

function assert(condition, testName, errorMessage = '') {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) {
      console.log(`  ${colors.dim}${errorMessage}${colors.reset}`);
    }
    failed++;
  }
}

const manager = new CustomModuleManager();

// ─── Azure DevOps: dev.azure.com ────────────────────────────────────────────

console.log(`\n${colors.cyan}Azure DevOps URL parsing (dev.azure.com)${colors.reset}\n`);

{
  const result = manager.parseSource('https://dev.azure.com/myorg/MyProject/_git/my-module');
  assert(result.isValid === true, 'dev.azure.com basic URL is valid');
  assert(result.type === 'url', 'dev.azure.com type is url');
  assert(
    result.cloneUrl === 'https://dev.azure.com/myorg/MyProject/_git/my-module',
    'dev.azure.com cloneUrl preserves full _git path',
    `Got: ${result.cloneUrl}`,
  );
  assert(result.subdir === null, 'dev.azure.com basic URL has no subdir');
  assert(
    result.cacheKey === 'dev.azure.com/myorg/MyProject/my-module',
    'dev.azure.com cacheKey includes org/project/repo',
    `Got: ${result.cacheKey}`,
  );
  assert(
    result.displayName === 'MyProject/my-module',
    'dev.azure.com displayName is project/repo',
    `Got: ${result.displayName}`,
  );
}

{
  const result = manager.parseSource('https://dev.azure.com/myorg/MyProject/_git/my-module.git');
  assert(result.isValid === true, 'dev.azure.com URL with .git suffix is valid');
  assert(
    result.cloneUrl === 'https://dev.azure.com/myorg/MyProject/_git/my-module',
    'dev.azure.com .git suffix stripped from cloneUrl',
    `Got: ${result.cloneUrl}`,
  );
}

{
  const result = manager.parseSource('https://dev.azure.com/myorg/MyProject/_git/my-module/path/to/subdir');
  assert(result.isValid === true, 'dev.azure.com URL with subdir path is valid');
  assert(
    result.cloneUrl === 'https://dev.azure.com/myorg/MyProject/_git/my-module',
    'dev.azure.com subdir URL cloneUrl excludes subdir',
    `Got: ${result.cloneUrl}`,
  );
  assert(
    result.subdir === 'path/to/subdir',
    'dev.azure.com subdir correctly extracted',
    `Got: ${result.subdir}`,
  );
}

// ─── Azure DevOps: legacy visualstudio.com ──────────────────────────────────

console.log(`\n${colors.cyan}Azure DevOps URL parsing (visualstudio.com)${colors.reset}\n`);

{
  const result = manager.parseSource('https://myorg.visualstudio.com/MyProject/_git/my-module');
  assert(result.isValid === true, 'visualstudio.com basic URL is valid');
  assert(result.type === 'url', 'visualstudio.com type is url');
  assert(
    result.cloneUrl === 'https://myorg.visualstudio.com/MyProject/_git/my-module',
    'visualstudio.com cloneUrl preserves full _git path',
    `Got: ${result.cloneUrl}`,
  );
  assert(result.subdir === null, 'visualstudio.com basic URL has no subdir');
  assert(
    result.cacheKey === 'myorg.visualstudio.com/MyProject/my-module',
    'visualstudio.com cacheKey is host/project/repo',
    `Got: ${result.cacheKey}`,
  );
}

// ─── Non-Azure URLs still work ──────────────────────────────────────────────

console.log(`\n${colors.cyan}Non-Azure HTTPS URLs (regression check)${colors.reset}\n`);

{
  const result = manager.parseSource('https://github.com/owner/repo');
  assert(result.isValid === true, 'GitHub basic URL still valid');
  assert(
    result.cloneUrl === 'https://github.com/owner/repo',
    'GitHub cloneUrl unchanged',
    `Got: ${result.cloneUrl}`,
  );
  assert(
    result.cacheKey === 'github.com/owner/repo',
    'GitHub cacheKey unchanged',
    `Got: ${result.cacheKey}`,
  );
}

{
  const result = manager.parseSource('https://github.com/owner/repo/tree/main/subdir');
  assert(result.isValid === true, 'GitHub URL with tree path still valid');
  assert(
    result.cloneUrl === 'https://github.com/owner/repo',
    'GitHub tree URL cloneUrl correct',
    `Got: ${result.cloneUrl}`,
  );
  assert(
    result.subdir === 'subdir',
    'GitHub tree subdir still extracted',
    `Got: ${result.subdir}`,
  );
}

{
  const result = manager.parseSource('git@github.com:owner/repo.git');
  assert(result.isValid === true, 'SSH URL still valid');
  assert(
    result.cloneUrl === 'git@github.com:owner/repo.git',
    'SSH cloneUrl unchanged',
    `Got: ${result.cloneUrl}`,
  );
}

// ─── Summary ────────────────────────────────────────────────────────────────

console.log(`\n${colors.cyan}Results: ${passed} passed, ${failed} failed${colors.reset}\n`);
process.exit(failed > 0 ? 1 : 0);
