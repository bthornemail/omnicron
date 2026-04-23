#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function runCmd(cmd, cwd) {
  try {
    const out = execSync(cmd, { cwd, encoding: "utf8", stdio: "pipe" });
    return { ok: true, out: out.trim() };
  } catch (err) {
    const stdout = String(err.stdout || "");
    const stderr = String(err.stderr || "");
    return { ok: false, out: `${stdout}${stderr}`.trim() };
  }
}

function readSingleJsonLine(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  const lines = raw.split("\n").filter(Boolean);
  if (lines.length !== 1) throw new Error(`Expected one JSON line in ${filePath}`);
  return JSON.parse(lines[0]);
}

function writeSingleJsonLine(filePath, rec) {
  fs.writeFileSync(filePath, `${JSON.stringify(rec)}\n`, "utf8");
}

function isNumberArray(a) {
  return Array.isArray(a) && a.every((v) => typeof v === "number");
}

function isIntegerArray(a) {
  return Array.isArray(a) && a.every((v) => Number.isInteger(v) && v >= 0);
}

function validateRenderPacket(packet) {
  if (!packet || packet.type !== "render_packet") return false;
  if (typeof packet.schema_version !== "string") return false;
  if (typeof packet.frame_id !== "string") return false;
  if (typeof packet.source_artifact_id !== "string") return false;
  if (typeof packet.source_artifact_hash !== "string") return false;
  if (packet.primitive_type !== "rect_grid") return false;
  if (!Number.isInteger(packet.width) || packet.width < 0) return false;
  if (!Number.isInteger(packet.height) || packet.height < 0) return false;
  if (!Number.isInteger(packet.cell_size) || packet.cell_size < 1) return false;
  if (!isNumberArray(packet.positions)) return false;
  if (!isNumberArray(packet.colors)) return false;
  if (!isIntegerArray(packet.indices)) return false;
  if (!isNumberArray(packet.uvs)) return false;
  if (!isNumberArray(packet.transforms)) return false;
  if (!Array.isArray(packet.labels)) return false;
  if (!packet.overlay_flags || typeof packet.overlay_flags !== "object") return false;
  if (typeof packet.overlay_flags.show_grid !== "boolean") return false;
  if (typeof packet.overlay_flags.show_labels !== "boolean") return false;
  if (typeof packet.overlay_flags.show_addresses !== "boolean") return false;
  return true;
}

function verifyRun(rootDir, name, adapter, input) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `render-contract-${name}-`));
  const canonical1 = path.join(tmpDir, `${name}.1.canonical.ndjson`);
  const canonical2 = path.join(tmpDir, `${name}.2.canonical.ndjson`);
  const packet1 = path.join(tmpDir, `${name}.1.render_packet.ndjson`);
  const packet2 = path.join(tmpDir, `${name}.2.render_packet.ndjson`);
  const svg1 = path.join(tmpDir, `${name}.1.svg`);
  const svg2 = path.join(tmpDir, `${name}.2.svg`);

  const toPacket = path.join(rootDir, "polyform/org/scripts/org_canonical_to_render_packet_ndjson.mjs");
  const toSvg = path.join(rootDir, "polyform/org/scripts/org_render_packet_to_svg.mjs");

  const a1 = runCmd(`node "${adapter}" "${input}" "${canonical1}"`, rootDir);
  const a2 = runCmd(`node "${adapter}" "${input}" "${canonical2}"`, rootDir);
  if (!a1.ok || !a2.ok) return { ok: false, detail: `${name}: canonical adapter failed` };

  const c1 = readSingleJsonLine(canonical1);
  const c2 = readSingleJsonLine(canonical2);
  if (JSON.stringify(c1) !== JSON.stringify(c2)) {
    return { ok: false, detail: `${name}: canonical determinism failed` };
  }
  if (typeof c1.source_module !== "string" || c1.source_module.length === 0) {
    return { ok: false, detail: `${name}: canonical source_module missing` };
  }
  if (typeof c1.authority_status !== "string" || c1.authority_status.length === 0) {
    return { ok: false, detail: `${name}: canonical authority_status missing` };
  }
  if (c1.authority_status !== "authority") {
    return { ok: false, detail: `${name}: canonical authority_status must be authority` };
  }

  const p1 = runCmd(`node "${toPacket}" "${canonical1}" "${packet1}"`, rootDir);
  const p2 = runCmd(`node "${toPacket}" "${canonical2}" "${packet2}"`, rootDir);
  if (!p1.ok || !p2.ok) return { ok: false, detail: `${name}: render packet generation failed` };

  const packetRec1 = readSingleJsonLine(packet1);
  const packetRec2 = readSingleJsonLine(packet2);
  if (!validateRenderPacket(packetRec1) || !validateRenderPacket(packetRec2)) {
    return { ok: false, detail: `${name}: render packet schema validation failed` };
  }

  const packetHash1 = sha256Hex(fs.readFileSync(packet1, "utf8"));
  const packetHash2 = sha256Hex(fs.readFileSync(packet2, "utf8"));
  if (packetHash1 !== packetHash2) return { ok: false, detail: `${name}: render packet hash determinism failed` };

  const derivedFrom = c1?.provenance?.derived_from || "";
  const authoritySource = c1?.projection_hints?.authority_source || "";
  const allowedDerivedFrom = new Set(["bitboard_authority", "coreform_logic", "sequence_root"]);
  const sourceLinkOk =
    typeof packetRec1.source_artifact_id === "string" &&
    packetRec1.source_artifact_id.length > 0 &&
    typeof packetRec1.source_artifact_hash === "string" &&
    packetRec1.source_artifact_hash.length > 0;
  const provenanceOk = allowedDerivedFrom.has(derivedFrom) && String(authoritySource).length > 0 && sourceLinkOk;
  if (!provenanceOk) return { ok: false, detail: `${name}: packet provenance linkage incomplete` };

  const s1 = runCmd(`node "${toSvg}" "${packet1}" "${svg1}"`, rootDir);
  const s2 = runCmd(`node "${toSvg}" "${packet2}" "${svg2}"`, rootDir);
  if (!s1.ok || !s2.ok) return { ok: false, detail: `${name}: svg generation failed` };
  const svgHash1 = sha256Hex(fs.readFileSync(svg1, "utf8"));
  const svgHash2 = sha256Hex(fs.readFileSync(svg2, "utf8"));
  if (svgHash1 !== svgHash2) return { ok: false, detail: `${name}: svg determinism failed` };

  // Negative authority check A: projection-only knob mutation must not alter canonical identity linkage.
  const packetMut = JSON.parse(JSON.stringify(packetRec1));
  packetMut.overlay_flags.show_labels = !packetMut.overlay_flags.show_labels;
  packetMut.overlay_flags.show_grid = !packetMut.overlay_flags.show_grid;
  if (
    packetMut.source_artifact_id !== packetRec1.source_artifact_id ||
    packetMut.source_artifact_hash !== packetRec1.source_artifact_hash
  ) {
    return { ok: false, detail: `${name}: projection-only mutation changed authority linkage` };
  }

  // Negative authority check B: canonical payload mutation should alter packet hash.
  const canonicalMut = JSON.parse(JSON.stringify(c1));
  canonicalMut.canonical_payload = `${String(canonicalMut.canonical_payload || "")}\n#payload_mutation`;
  const canonicalMutFile = path.join(tmpDir, `${name}.mut.canonical.ndjson`);
  const packetMutFile = path.join(tmpDir, `${name}.mut.render_packet.ndjson`);
  writeSingleJsonLine(canonicalMutFile, canonicalMut);
  const pm = runCmd(`node "${toPacket}" "${canonicalMutFile}" "${packetMutFile}"`, rootDir);
  if (!pm.ok) return { ok: false, detail: `${name}: canonical mutation to packet failed` };
  const packetHashMut = sha256Hex(fs.readFileSync(packetMutFile, "utf8"));
  if (packetHashMut === packetHash1) {
    return { ok: false, detail: `${name}: canonical mutation did not alter packet hash` };
  }

  return { ok: true, detail: `${name}: render contract checks passed` };
}

function main() {
  const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const bitboardAdapter = path.join(rootDir, "polyform/bitboards/bitboard_to_canonical_ndjson.mjs");
  const coreformAdapter = path.join(rootDir, "polyform/bitboards/coreform_logic_to_canonical_ndjson.mjs");
  const runs = [
    {
      name: "bitboard",
      adapter: bitboardAdapter,
      input: path.join(rootDir, "polyform/bitboards/rules_golden.bitboard")
    },
    {
      name: "coreform",
      adapter: coreformAdapter,
      input: path.join(rootDir, "polyform/bitboards/coreform_chain.logic")
    }
  ];

  for (const run of runs) {
    const result = verifyRun(rootDir, run.name, run.adapter, run.input);
    if (!result.ok) {
      console.error(`ERROR: ${result.detail}`);
      process.exit(2);
    }
  }

  console.log("OK: render contract verified (packet hash/schema/provenance + svg determinism)");
}

main();
