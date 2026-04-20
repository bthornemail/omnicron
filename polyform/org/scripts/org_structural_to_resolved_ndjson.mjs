#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error(
    "Usage: node scripts/org_structural_to_resolved_ndjson.mjs <input.ndjson> [output.ndjson]"
  );
}

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function normalizePayload(payload) {
  let lines = String(payload ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));
  while (lines.length > 0 && lines[0] === "") {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  const s = lines.join("\n");
  return s.endsWith("\n") ? s : `${s}\n`;
}

function chooseMapValue(map, keys) {
  if (!map || typeof map !== "object") return "";
  for (const k of keys) {
    if (typeof map[k] === "string" && map[k].length > 0) return map[k];
  }
  return "";
}

function defaultRoleFromLanguage(lang) {
  const l = (lang || "").toLowerCase();
  if (["prolog", "logic", "datalog"].includes(l)) return "logic_fact_block";
  if (["c", "cpp", "h", "c++"].includes(l)) return "c_fragment";
  if (["lisp", "cl", "common-lisp", "scheme"].includes(l)) return "sexpr_payload";
  if (["json", "yaml", "toml"].includes(l)) return "config_payload";
  return "generic_source_block";
}

function defaultExtensionFromLanguage(lang) {
  const l = (lang || "").toLowerCase();
  if (["prolog", "logic", "datalog"].includes(l)) return "logic";
  if (["c"].includes(l)) return "c";
  if (["h"].includes(l)) return "h";
  if (["cpp", "c++"].includes(l)) return "cc";
  if (["lisp", "cl", "common-lisp", "scheme"].includes(l)) return "lisp";
  if (["json"].includes(l)) return "json";
  if (["yaml"].includes(l)) return "yaml";
  if (["toml"].includes(l)) return "toml";
  return l || "txt";
}

function deriveAddressSeed(stepIdentity, rec) {
  const frameLaw = chooseMapValue(rec.directives_local, [
    "OMNITRON_MODE",
    "OMNICRON_MODE",
    "OMNITRON_PROFILE"
  ]) || "default_frame_law";
  return sha256Hex(`seed|${stepIdentity}|${frameLaw}`);
}

function deriveVirtualAddress(addressSeed) {
  const lane = Number.parseInt(addressSeed.slice(0, 2), 16) % 16;
  const channel = Number.parseInt(addressSeed.slice(2, 4), 16) % 16;
  const slot = Number.parseInt(addressSeed.slice(4, 8), 16) % 60;
  const page = Number.parseInt(addressSeed.slice(8, 16), 16) >>> 0;
  return `va:${page.toString(16).padStart(8, "0")}:${lane}.${channel}.${slot}`;
}

function deriveBalancedAddress(addressSeed) {
  const raw = Number.parseInt(addressSeed.slice(16, 24), 16) % 8192;
  const signed = raw - 4096;
  const chiralityBit = Number.parseInt(addressSeed.slice(24, 26), 16) & 0x1;
  const chirality = chiralityBit === 0 ? "left" : "right";
  const sign = signed >= 0 ? "+" : "";
  return `ba:${chirality}:${sign}${signed}`;
}

function deriveReceiptAnchor(stepIdentity, addressSeed) {
  return sha256Hex(`receipt|${stepIdentity}|${addressSeed}`);
}

function resolveSourceDirectory(rec) {
  const fromProps = chooseMapValue(rec.properties_local, [
    "source-directory",
    "SOURCE_DIRECTORY",
    "source_directory",
    "SOURCE-DIRECTORY"
  ]);
  if (fromProps) return fromProps;
  return path.dirname(rec.file_path || ".");
}

function resolveSourceFile(rec, sourceDirectory) {
  const fromProps = chooseMapValue(rec.properties_local, [
    "source-file",
    "SOURCE_FILE",
    "source_file",
    "SOURCE-FILE"
  ]);
  if (fromProps) return fromProps;

  const basename = path.basename(rec.file_path || "org_input", path.extname(rec.file_path || ""));
  const ext = defaultExtensionFromLanguage(rec.block_language || "");
  const blockName = rec.block_name && rec.block_name.length > 0 ? rec.block_name : "block";
  return path.join(sourceDirectory, `${basename}.${blockName}.${ext}`);
}

function deriveStepIdentity(rec, sourceFile, sourceDirectory) {
  const inheritedContextFingerprint = sha256Hex(
    JSON.stringify({
      headline_path: rec.headline_path || [],
      tags: rec.tags || [],
      directives_local: rec.directives_local || {},
      properties_local: rec.properties_local || {}
    })
  );
  return sha256Hex(
    [
      rec.file_path || "",
      JSON.stringify(rec.headline_path || []),
      inheritedContextFingerprint,
      rec.block_kind || "",
      rec.block_language || "",
      rec.block_name || "",
      rec.payload_hash || sha256Hex(rec.block_body || ""),
      String(rec.local_order ?? 0),
      sourceFile || "",
      sourceDirectory || ""
    ].join("|")
  );
}

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? null;

if (!inputPath) {
  usage();
  process.exit(2);
}

const absInput = path.resolve(inputPath);
if (!fs.existsSync(absInput)) {
  console.error(`Input not found: ${absInput}`);
  process.exit(2);
}

const lines = fs
  .readFileSync(absInput, "utf8")
  .split("\n")
  .filter((l) => l.trim().length > 0);

const out = [];
for (const line of lines) {
  let rec;
  try {
    rec = JSON.parse(line);
  } catch (err) {
    console.error(`Skipping invalid JSON line: ${err.message}`);
    continue;
  }
  if (rec.type !== "org_structural_record") continue;

  const sourceDirectory = resolveSourceDirectory(rec);
  const sourceFile = resolveSourceFile(rec, sourceDirectory);
  const canonicalPayload = normalizePayload(rec.block_body || "");
  const stepIdentity = deriveStepIdentity(rec, sourceFile, sourceDirectory);
  const addressSeed = deriveAddressSeed(stepIdentity, rec);
  const virtualAddress = deriveVirtualAddress(addressSeed);
  const balancedAddress = deriveBalancedAddress(addressSeed);
  const receiptAnchor = deriveReceiptAnchor(stepIdentity, addressSeed);
  const artifactRole = defaultRoleFromLanguage(rec.block_language || "");

  const resolved = {
    type: "resolved_org_block",
    schema_version: "1.0.0",
    source: {
      file_path: rec.file_path,
      headline_path: rec.headline_path || [],
      byte_span: rec.byte_span || { start: 0, end: 0 }
    },
    step_identity: stepIdentity,
    address_seed: addressSeed,
    virtual_address: virtualAddress,
    balanced_address: balancedAddress,
    receipt_anchor: receiptAnchor,
    inherited_context: {
      headline_path: (rec.headline_path || []).join(" / "),
      headline_level: String(rec.headline_level ?? 0),
      tags: JSON.stringify(rec.tags || []),
      directives_fingerprint: sha256Hex(JSON.stringify(rec.directives_local || {}))
    },
    properties_resolved: rec.properties_local || {},
    source_file: sourceFile,
    source_directory: sourceDirectory,
    artifact_role: artifactRole,
    language_surface: rec.block_language || "",
    canonical_payload: canonicalPayload,
    compile_policy: {
      tangle: true,
      append: false,
      mode: "replace",
      language: rec.block_language || ""
    },
    receipt_requirements: {
      require_step_identity: true,
      require_address_seed: true,
      require_content_sha256: true,
      require_source_target: true,
      require_receipt_anchor: true
    },
    semantic_fingerprint: sha256Hex(
      [
        stepIdentity,
        addressSeed,
        virtualAddress,
        balancedAddress,
        artifactRole,
        sourceFile,
        sourceDirectory,
        canonicalPayload
      ].join("|")
    )
  };

  out.push(JSON.stringify(resolved));
}

const payload = out.join("\n") + (out.length ? "\n" : "");
if (outputPath) {
  fs.writeFileSync(path.resolve(outputPath), payload, "utf8");
} else {
  process.stdout.write(payload);
}
