#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function sha256Hex(s) {
  return createHash("sha256").update(s).digest("hex");
}

function runNode(script, args) {
  return execFileSync("node", [script, ...args], { encoding: "utf8", stdio: "pipe" });
}

function readOneJsonLine(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) throw new Error(`Empty file: ${filePath}`);
  const lines = raw.split("\n").filter(Boolean);
  if (lines.length !== 1) throw new Error(`Expected exactly one JSON record: ${filePath}`);
  return JSON.parse(lines[0]);
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

function parsePredCount(text, pred) {
  const re = new RegExp(`^${pred}\\(`, "gm");
  return (text.match(re) || []).length;
}

function main() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const logicPath = path.join(root, "bitboards/coreform_chain.logic");
  if (!fs.existsSync(logicPath)) throw new Error(`Missing authority file: ${logicPath}`);

  const text = fs.readFileSync(logicPath, "utf8");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "coreform-chain-"));
  const canonicalA = path.join(tmpDir, "coreformA.canonical.ndjson");
  const canonicalB = path.join(tmpDir, "coreformB.canonical.ndjson");
  const packetA = path.join(tmpDir, "coreformA.render_packet.ndjson");
  const packetB = path.join(tmpDir, "coreformB.render_packet.ndjson");
  const svgA = path.join(tmpDir, "coreformA.svg");
  const svgB = path.join(tmpDir, "coreformB.svg");

  const toCanonical = path.join(root, "bitboards/coreform_logic_to_canonical_ndjson.mjs");
  const toPacket = path.join(root, "org/scripts/org_canonical_to_render_packet_ndjson.mjs");
  const toSvg = path.join(root, "org/scripts/org_render_packet_to_svg.mjs");

  // Authority tests
  assertEq("Authority: single root", parsePredCount(text, "coreform_root"), 1);
  assertEq("Authority: 4 nodes", parsePredCount(text, "node"), 4);
  assertEq("Authority: 3 next edges", parsePredCount(text, "next"), 3);
  assertEq("Authority: 4 stages", parsePredCount(text, "stage"), 4);
  assertEq("Authority: 4 virtual_address", parsePredCount(text, "virtual_address"), 4);
  assertEq("Authority: 4 balanced_address", parsePredCount(text, "balanced_address"), 4);

  // Deterministic derivation
  runNode(toCanonical, [logicPath, canonicalA]);
  runNode(toCanonical, [logicPath, canonicalB]);
  const a = readOneJsonLine(canonicalA);
  const b = readOneJsonLine(canonicalB);
  assertEq("Derivation: deterministic canonical", a, b);

  // Serialization-only noise does not alter canonical truth
  const noisyLogicPath = path.join(tmpDir, "coreform_noise.logic");
  fs.writeFileSync(noisyLogicPath, text, "utf8");
  const canonicalNoiseBase = path.join(tmpDir, "coreformNoiseBase.canonical.ndjson");
  runNode(toCanonical, [noisyLogicPath, canonicalNoiseBase]);
  const nb = readOneJsonLine(canonicalNoiseBase);
  fs.writeFileSync(
    noisyLogicPath,
    `${text}\n% projection note: this is non-authoritative serialization noise\n`,
    "utf8"
  );
  const canonicalNoise = path.join(tmpDir, "coreformNoise.canonical.ndjson");
  runNode(toCanonical, [noisyLogicPath, canonicalNoise]);
  const n = readOneJsonLine(canonicalNoise);
  assertEq("Derivation: noise rejection", nb.artifact_hash, n.artifact_hash);
  assertEq("Derivation: noise id stability", nb.artifact_id, n.artifact_id);

  // Primitive/composer mutation must alter canonical truth
  const mutatedLogicPath = path.join(tmpDir, "coreform_mut.logic");
  fs.writeFileSync(
    mutatedLogicPath,
    text.replace("master_period, 5040", "master_period, 840"),
    "utf8"
  );
  const canonicalMut = path.join(tmpDir, "coreformMut.canonical.ndjson");
  runNode(toCanonical, [mutatedLogicPath, canonicalMut]);
  const m = readOneJsonLine(canonicalMut);
  assertNeq("Derivation: primitive mutation changes hash", a.artifact_hash, m.artifact_hash);
  assertNeq("Derivation: primitive mutation changes id", a.artifact_id, m.artifact_id);

  // Projection tests: logic -> canonical -> render_packet -> svg deterministic
  runNode(toPacket, [canonicalA, packetA]);
  runNode(toPacket, [canonicalB, packetB]);
  const packetHashA = sha256Hex(fs.readFileSync(packetA, "utf8"));
  const packetHashB = sha256Hex(fs.readFileSync(packetB, "utf8"));
  assertEq("Projection: packet determinism", packetHashA, packetHashB);

  runNode(toSvg, [packetA, svgA]);
  runNode(toSvg, [packetB, svgB]);
  const svgHashA = sha256Hex(fs.readFileSync(svgA, "utf8"));
  const svgHashB = sha256Hex(fs.readFileSync(svgB, "utf8"));
  assertEq("Projection: svg determinism", svgHashA, svgHashB);

  console.log("OK: coreform chain verified");
  console.log(`workspace=${tmpDir}`);
}

try {
  main();
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
}
