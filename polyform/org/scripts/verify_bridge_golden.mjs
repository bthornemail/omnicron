#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const EXPECTED_CANONICAL_SHA256 =
  "793d8ffc6cf3dda3f3dfe13452fdbf952095105210229708087b6baa7a064aed";

function sha256HexFile(filePath) {
  const data = fs.readFileSync(filePath);
  return createHash("sha256").update(data).digest("hex");
}

function main() {
  const orgRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const canonical = path.join(orgRoot, "golden/omnicron_profile.canonical.ndjson");
  if (!fs.existsSync(canonical)) {
    throw new Error(`Missing golden canonical artifact: ${canonical}`);
  }
  const actual = sha256HexFile(canonical);
  if (actual !== EXPECTED_CANONICAL_SHA256) {
    throw new Error(
      `Golden hash mismatch: expected=${EXPECTED_CANONICAL_SHA256} actual=${actual}`
    );
  }
  console.log("OK: bridge golden canonical hash matches");
}

try {
  main();
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
}

