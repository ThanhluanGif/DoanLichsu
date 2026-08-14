import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..");

// Hash the source files as they exist in the checkout, not the git index. This
// lets a release-evidence run prove an uncommitted source edit, while excluding
// files that are intentionally produced by the run or belong to planning/evidence.
const excluded = [
  /^artifacts\//,
  /^cards\//,
  /^flow\//,
  /^next-env\.d\.ts$/,
];

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean)
  .filter((file) => !excluded.some((pattern) => pattern.test(file)))
  .sort();

const hash = createHash("sha256");
for (const file of files) {
  const absolute = resolve(root, file);
  const content = readFileSync(absolute);
  hash.update(file);
  hash.update("\0");
  hash.update(String(content.byteLength));
  hash.update("\0");
  hash.update(content);
  hash.update("\0");
}

export function sourceTreeSha256() {
  return hash.copy().digest("hex");
}

export function sourceTreeFiles() {
  return files.map((file) => relative(root, resolve(root, file)));
}

if (process.argv[1]) {
  process.stdout.write(`${JSON.stringify({ sourceTreeSha256: sourceTreeSha256(), fileCount: files.length })}\n`);
}
