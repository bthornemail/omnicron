#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(2);
}

function main() {
  const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const manifestPath = path.join(rootDir, "authority/classification_manifest.json");
  if (!fs.existsSync(manifestPath)) fail(`missing manifest: ${manifestPath}`);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const allowedClasses = Array.isArray(manifest.class_enum) ? manifest.class_enum : [];
  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
  const canonicalStageFiles = Array.isArray(manifest.canonical_stage_files)
    ? manifest.canonical_stage_files
    : [];
  if (allowedClasses.length === 0) fail("class_enum is empty");
  if (entries.length === 0) fail("entries list is empty");
  if (canonicalStageFiles.length === 0) fail("canonical_stage_files list is empty");

  const byPath = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") fail("entry is not an object");
    const rel = entry.path;
    const cls = entry.class;
    if (typeof rel !== "string" || rel.length === 0) fail("entry.path must be non-empty string");
    if (typeof cls !== "string" || cls.length === 0) fail(`entry.class missing for ${rel}`);
    if (!allowedClasses.includes(cls)) fail(`entry.class '${cls}' for ${rel} is not in class_enum`);
    if (byPath.has(rel)) fail(`duplicate path entry: ${rel}`);
    byPath.set(rel, cls);
  }

  for (const rel of byPath.keys()) {
    const abs = path.join(rootDir, rel);
    if (!fs.existsSync(abs)) fail(`listed path does not exist: ${rel}`);
  }

  for (const rel of canonicalStageFiles) {
    if (!byPath.has(rel)) fail(`canonical stage file not declared in entries: ${rel}`);
    const cls = byPath.get(rel);
    if (cls === "temporary") fail(`canonical stage file cannot be temporary: ${rel}`);
  }

  const authority = [...byPath.entries()].filter(([, cls]) => cls === "authority").map(([p]) => p);
  const derived = [...byPath.entries()].filter(([, cls]) => cls === "derived").map(([p]) => p);
  if (authority.length === 0) fail("no authority entries found");
  if (derived.length === 0) fail("no derived entries found");

  const requiredAuthority = [
    "prolog/omnitron_declarations.lx",
    "prolog/constitutional_stack.pl",
    "prolog/bootstrap_datalog.pl",
    "prolog/omnicron-rule-source.org",
    "polyform/org/scripts/canonical_identity.mjs"
  ];
  for (const rel of requiredAuthority) {
    if (!byPath.has(rel)) fail(`required authority path missing: ${rel}`);
    if (byPath.get(rel) !== "authority") fail(`required authority path not classed authority: ${rel}`);
  }

  console.log("OK: authority/derived classification manifest verified");
}

main();
