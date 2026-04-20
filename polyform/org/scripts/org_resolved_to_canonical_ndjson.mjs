#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error(
    "Usage: node scripts/org_resolved_to_canonical_ndjson.mjs <input.ndjson> [output.ndjson]"
  );
}

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function chooseArtifactKind(resolved) {
  const role = (resolved.artifact_role || "").toLowerCase();
  const lang = (resolved.language_surface || "").toLowerCase();
  if (role.includes("logic") || ["logic", "prolog", "datalog"].includes(lang)) {
    return "prolog_fact_set";
  }
  if (["lisp", "cl", "common-lisp", "scheme"].includes(lang)) return "sexpr_payload";
  if (["c", "cpp", "h", "c++"].includes(lang)) return "c_fragment";
  if (["json", "yaml", "toml"].includes(lang)) return "mexpr_payload";
  return "fexpr_payload";
}

function choosePayloadKind(resolved) {
  const lang = (resolved.language_surface || "").toLowerCase();
  if (["logic", "prolog", "datalog"].includes(lang)) return "logic_text";
  if (["c", "cpp", "h", "c++"].includes(lang)) return "c_text";
  if (["lisp", "cl", "common-lisp", "scheme"].includes(lang)) return "sexpr_text";
  if (["json", "yaml", "toml"].includes(lang)) return "config_text";
  return "source_text";
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
  if (rec.type !== "resolved_org_block") continue;

  const canonicalPayload = String(rec.canonical_payload ?? "");
  const contentSha256 = sha256Hex(canonicalPayload);
  const contentBytes = Buffer.byteLength(canonicalPayload, "utf8");
  const artifactKind = chooseArtifactKind(rec);
  const payloadKind = choosePayloadKind(rec);
  const artifactId = sha256Hex(
    [
      rec.step_identity || "",
      rec.address_seed || "",
      rec.virtual_address || "",
      rec.balanced_address || "",
      rec.source_file || "",
      artifactKind
    ].join("|")
  );
  const artifactHash = sha256Hex(
    [
      artifactId,
      contentSha256,
      payloadKind,
      rec.receipt_anchor || "",
      rec.semantic_fingerprint || ""
    ].join("|")
  );

  const canonical = {
    type: "canonical_artifact",
    schema_version: "1.0.0",
    artifact_id: artifactId,
    artifact_hash: artifactHash,
    artifact_kind: artifactKind,
    payload_kind: payloadKind,
    producer_step_identity: rec.step_identity || "",
    address_seed: rec.address_seed || "",
    virtual_address: rec.virtual_address || "",
    balanced_address: rec.balanced_address || "",
    receipt_anchor: rec.receipt_anchor || "",
    content_path: rec.source_file || "",
    content_sha256: contentSha256,
    content_bytes: contentBytes,
    canonical_payload: canonicalPayload,
    projection_hints: {
      language_surface: rec.language_surface || "",
      artifact_role: rec.artifact_role || "",
      target_directory: rec.source_directory || ""
    },
    provenance: {
      derived_from: "resolved_org_block",
      semantic_fingerprint: rec.semantic_fingerprint || "",
      resolver_version: "resolved_to_canonical_v1"
    },
    replay_stage: "emit",
    receipt: {
      anchor: rec.receipt_anchor || "",
      requirements: rec.receipt_requirements || {}
    }
  };

  out.push(JSON.stringify(canonical));
}

const payload = out.join("\n") + (out.length ? "\n" : "");
if (outputPath) {
  fs.writeFileSync(path.resolve(outputPath), payload, "utf8");
} else {
  process.stdout.write(payload);
}
