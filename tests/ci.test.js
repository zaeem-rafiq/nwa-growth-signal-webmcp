const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const workflowPath = path.join(__dirname, "..", ".github", "workflows", "verify.yml");

test("pull requests and pushes run the dependency-free release gates on Node 22", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8");

  assert.match(workflow, /on:\s*\n\s+pull_request:\s*\n\s+push:/);
  assert.match(workflow, /uses:\s*actions\/checkout@[0-9a-f]{40} # v4/);
  assert.match(workflow, /uses:\s*actions\/setup-node@[0-9a-f]{40} # v4/);
  assert.doesNotMatch(workflow, /uses:\s*[^@\n]+@v\d+\s*$/m);
  assert.match(workflow, /node-version:\s*["']?22["']?/);
  assert.match(workflow, /run:\s*node --test tests\/\*\.test\.js/);
  assert.match(workflow, /run:\s*node scripts\/benchmark\.js/);
  assert.match(workflow, /run:\s*node scripts\/historical-impact-benchmark\.js/);
  assert.doesNotMatch(workflow, /\b(?:npm|pnpm|yarn)\s+(?:ci|install)\b/);
});
