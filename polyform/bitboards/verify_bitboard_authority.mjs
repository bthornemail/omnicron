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
  execFileSync("node", [script, ...args], { stdio: "pipe", encoding: "utf8" });
}

function readJsonLine(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const lines = raw.split("\n").filter(Boolean);
  if (lines.length !== 1) throw new Error(`Expected one JSON line: ${filePath}`);
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

function main() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const bitboardsDir = path.join(root, "bitboards");
  const adapter = path.join(bitboardsDir, "bitboard_to_canonical_ndjson.mjs");
  const toPacket = path.join(root, "org/scripts/org_canonical_to_render_packet_ndjson.mjs");
  const toSvg = path.join(root, "org/scripts/org_render_packet_to_svg.mjs");

  const files = fs
    .readdirSync(bitboardsDir)
    .filter((f) => f.endsWith(".bitboard"))
    .sort();
  if (files.length === 0) throw new Error("No .bitboard files found");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bitboard-authority-"));
  for (const file of files) {
    const abs = path.join(bitboardsDir, file);
    const canonA = path.join(tmp, `${file}.a.canonical.ndjson`);
    const canonB = path.join(tmp, `${file}.b.canonical.ndjson`);
    const packetA = path.join(tmp, `${file}.a.render_packet.ndjson`);
    const packetB = path.join(tmp, `${file}.b.render_packet.ndjson`);
    const svgA = path.join(tmp, `${file}.a.svg`);
    const svgB = path.join(tmp, `${file}.b.svg`);

    runNode(adapter, [abs, canonA]);
    runNode(adapter, [abs, canonB]);

    const a = readJsonLine(canonA);
    const b = readJsonLine(canonB);
    assertEq(`${file}: deterministic canonical`, a, b);
    assertEq(`${file}: artifact kind`, a.artifact_kind, "bitboard");

    runNode(toPacket, [canonA, packetA]);
    runNode(toPacket, [canonB, packetB]);
    assertEq(
      `${file}: deterministic render packet`,
      sha256Hex(fs.readFileSync(packetA, "utf8")),
      sha256Hex(fs.readFileSync(packetB, "utf8"))
    );

    runNode(toSvg, [packetA, svgA]);
    runNode(toSvg, [packetB, svgB]);
    assertEq(
      `${file}: deterministic svg`,
      sha256Hex(fs.readFileSync(svgA, "utf8")),
      sha256Hex(fs.readFileSync(svgB, "utf8"))
    );

    const mutated = path.join(tmp, `${file}.mutated.bitboard`);
    const raw = fs.readFileSync(abs, "utf8");
    const changed = raw.replace("WORD_0=0x", "WORD_0=0xE");
    fs.writeFileSync(mutated, changed, "utf8");
    const canonMut = path.join(tmp, `${file}.mut.canonical.ndjson`);
    runNode(adapter, [mutated, canonMut]);
    const m = readJsonLine(canonMut);
    assertNeq(`${file}: content mutation changes artifact`, a.artifact_hash, m.artifact_hash);
  }

  console.log("OK: bitboard authority verified");
  console.log(`workspace=${tmp}`);
}

try {
  main();
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
}

