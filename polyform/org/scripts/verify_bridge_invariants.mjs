#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function runNode(scriptPath, args) {
  execFileSync("node", [scriptPath, ...args], { stdio: "pipe", encoding: "utf8" });
}

function readSingleJsonLine(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) throw new Error(`Empty NDJSON file: ${filePath}`);
  const lines = raw.split("\n").filter(Boolean);
  if (lines.length !== 1) throw new Error(`Expected exactly one JSON line in ${filePath}, got ${lines.length}`);
  return JSON.parse(lines[0]);
}

function writeSingleJsonLine(filePath, obj) {
  fs.writeFileSync(filePath, `${JSON.stringify(obj)}\n`, "utf8");
}

function runPipeline(orgRoot, inputOrg, outPrefix) {
  const q = path.join(orgRoot, "scripts/org_query_to_structural_ndjson.mjs");
  const r = path.join(orgRoot, "scripts/org_structural_to_resolved_ndjson.mjs");
  const c = path.join(orgRoot, "scripts/org_resolved_to_canonical_ndjson.mjs");

  const structural = `${outPrefix}.structural.ndjson`;
  const resolved = `${outPrefix}.resolved.ndjson`;
  const canonical = `${outPrefix}.canonical.ndjson`;

  runNode(q, [inputOrg, structural]);
  runNode(r, [structural, resolved]);
  runNode(c, [resolved, canonical]);

  return { structural, resolved, canonical };
}

function assertEq(name, a, b) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`${name} failed`);
  }
}

function assertNeq(name, a, b) {
  if (JSON.stringify(a) === JSON.stringify(b)) {
    throw new Error(`${name} failed`);
  }
}

function main() {
  const orgRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const fixture = path.join(orgRoot, "corpus/omnicron_profile.tst");
  if (!fs.existsSync(fixture)) {
    throw new Error(`Fixture missing: ${fixture}`);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "org-bridge-invariants-"));
  const orgInput = path.join(tempDir, "fixture.org");
  fs.copyFileSync(fixture, orgInput);

  // Invariant 1: same resolved block yields same canonical artifact.
  const runA = runPipeline(orgRoot, orgInput, path.join(tempDir, "runA"));
  const runB = runPipeline(orgRoot, orgInput, path.join(tempDir, "runB"));
  const canonicalA = readSingleJsonLine(runA.canonical);
  const canonicalB = readSingleJsonLine(runB.canonical);
  assertEq("Invariant 1 (determinism)", canonicalA, canonicalB);

  // Invariant 2: Org-only noise upstream that does not change resolved semantics
  // should not change canonical artifact (demonstrated by mutating non-authoritative
  // resolved metadata only).
  const resolvedBase = readSingleJsonLine(runA.resolved);
  const resolvedNoise = JSON.parse(JSON.stringify(resolvedBase));
  resolvedNoise.source = {
    ...resolvedNoise.source,
    headline_path: ["NOISE", "ONLY"],
    byte_span: { start: 0, end: 0 }
  };
  resolvedNoise.inherited_context = {
    ...resolvedNoise.inherited_context,
    headline_path: "noise-only",
    tags: "[]"
  };
  resolvedNoise.compile_policy = {
    ...resolvedNoise.compile_policy,
    mode: "replace"
  };
  const resolvedNoiseFile = path.join(tempDir, "noise.resolved.ndjson");
  const canonicalNoiseFile = path.join(tempDir, "noise.canonical.ndjson");
  writeSingleJsonLine(resolvedNoiseFile, resolvedNoise);
  runNode(path.join(orgRoot, "scripts/org_resolved_to_canonical_ndjson.mjs"), [
    resolvedNoiseFile,
    canonicalNoiseFile
  ]);
  const canonicalNoise = readSingleJsonLine(canonicalNoiseFile);
  assertEq("Invariant 2 (semantic-noise rejection)", canonicalA, canonicalNoise);

  // Invariant 2b: companion end-to-end source-surface non-authority check.
  // Apply harmless Org-level noise *after* authoritative captured structures,
  // then rerun structural -> resolved -> canonical and require unchanged output.
  const orgSourceBase = fs.readFileSync(orgInput, "utf8");
  const orgNoisy = `${orgSourceBase}\n# non-authoritative trailing noise\n`;
  fs.writeFileSync(orgInput, orgNoisy, "utf8");
  const runNoisy = runPipeline(orgRoot, orgInput, path.join(tempDir, "runNoisy"));
  const canonicalNoisySource = readSingleJsonLine(runNoisy.canonical);
  assertEq(
    "Invariant 2b (upstream source-surface noise rejection)",
    canonicalA,
    canonicalNoisySource
  );

  // Invariant 3: changing routing witness changes artifact identity predictably.
  const resolvedRouteMut = JSON.parse(JSON.stringify(resolvedBase));
  resolvedRouteMut.virtual_address = "va:ffffffff:15.15.59";
  const resolvedRouteFile = path.join(tempDir, "route.resolved.ndjson");
  const canonicalRouteFile = path.join(tempDir, "route.canonical.ndjson");
  writeSingleJsonLine(resolvedRouteFile, resolvedRouteMut);
  runNode(path.join(orgRoot, "scripts/org_resolved_to_canonical_ndjson.mjs"), [
    resolvedRouteFile,
    canonicalRouteFile
  ]);
  const canonicalRoute = readSingleJsonLine(canonicalRouteFile);
  assertNeq("Invariant 3a (artifact_id changes with routing)", canonicalA.artifact_id, canonicalRoute.artifact_id);
  assertNeq("Invariant 3b (artifact_hash changes with routing)", canonicalA.artifact_hash, canonicalRoute.artifact_hash);

  // Invariant 4: projection hints do not affect artifact truth.
  const recomputedArtifactHash = sha256Hex(
    [
      canonicalA.artifact_id,
      canonicalA.content_sha256,
      canonicalA.payload_kind,
      canonicalA.receipt_anchor,
      canonicalA.provenance.semantic_fingerprint
    ].join("|")
  );
  assertEq("Invariant 4 (projection hints non-authoritative)", canonicalA.artifact_hash, recomputedArtifactHash);

  // Invariant 5: receipt policy material is downstream; changing requirements
  // does not alter canonical artifact truth fields if anchors stay fixed.
  const resolvedReceiptMut = JSON.parse(JSON.stringify(resolvedBase));
  resolvedReceiptMut.receipt_requirements = {
    require_step_identity: true,
    require_address_seed: true,
    require_content_sha256: true,
    require_source_target: true,
    require_receipt_anchor: true,
    extra_policy_noise: true
  };
  const resolvedReceiptFile = path.join(tempDir, "receipt.resolved.ndjson");
  const canonicalReceiptFile = path.join(tempDir, "receipt.canonical.ndjson");
  writeSingleJsonLine(resolvedReceiptFile, resolvedReceiptMut);
  runNode(path.join(orgRoot, "scripts/org_resolved_to_canonical_ndjson.mjs"), [
    resolvedReceiptFile,
    canonicalReceiptFile
  ]);
  const canonicalReceipt = readSingleJsonLine(canonicalReceiptFile);
  assertEq("Invariant 5a (artifact_hash stable under receipt policy mutation)", canonicalA.artifact_hash, canonicalReceipt.artifact_hash);
  assertEq("Invariant 5b (receipt anchor stable)", canonicalA.receipt_anchor, canonicalReceipt.receipt_anchor);

  console.log("OK: org bridge invariants verified");
  console.log(`workspace=${tempDir}`);
}

try {
  main();
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
}
