#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  sha256Hex,
  deriveAddressSeed,
  deriveVirtualAddress,
  deriveBalancedAddress,
  deriveReceiptAnchor,
  deriveArtifactId,
  deriveArtifactHash
} from "../org/scripts/canonical_identity.mjs";

function usage() {
  console.error(
    "Usage: node polyform/bitboards/bitboard_to_canonical_ndjson.mjs <input.bitboard> [output.ndjson]"
  );
}

function parseBitboard(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");

  const words = new Map();
  const grid = [];
  let inGrid = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    if (line === "GRID_16x16:") {
      inGrid = true;
      continue;
    }
    if (inGrid && /^[.#]{16}$/.test(line)) {
      grid.push(line);
      continue;
    }
    if (line.startsWith("#")) continue;
    if (!inGrid) {
      const wm = line.match(/^WORD_([0-9]+)=0x([0-9A-Fa-f]{8})$/);
      if (wm) {
        words.set(Number.parseInt(wm[1], 10), `0x${wm[2].toUpperCase()}`);
      }
      continue;
    }
  }

  if (words.size === 0) {
    throw new Error("No WORD_n rows found");
  }
  if (grid.length === 0) {
    throw new Error("No GRID_16x16 rows found");
  }

  const orderedWordIndexes = [...words.keys()].sort((a, b) => a - b);
  const wordLines = orderedWordIndexes.map((idx) => `WORD_${idx}=${words.get(idx)}`);
  const canonicalPayload = `${wordLines.join("\n")}\nGRID_16x16:\n${grid.join("\n")}\n`;
  return {
    canonicalPayload,
    wordCount: orderedWordIndexes.length,
    gridRows: grid.length
  };
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

const raw = fs.readFileSync(absInput, "utf8");
const parsed = parseBitboard(raw);
const basename = path.basename(absInput);
const contentSha = sha256Hex(parsed.canonicalPayload);
const stepIdentity = sha256Hex(`bitboard|${basename}|${contentSha}`);
const addressSeed = deriveAddressSeed(stepIdentity, "bitboard_authority_v1");
const virtualAddress = deriveVirtualAddress(addressSeed);
const balancedAddress = deriveBalancedAddress(addressSeed);
const receiptAnchor = deriveReceiptAnchor(stepIdentity, addressSeed);
const artifactKind = "bitboard";
const payloadKind = "bitboard_text";
const artifactId = deriveArtifactId({
  stepIdentity,
  addressSeed,
  virtualAddress,
  balancedAddress,
  sourcePath: absInput,
  artifactKind
});
const artifactHash = deriveArtifactHash({
  artifactId,
  contentSha256: contentSha,
  payloadKind,
  receiptAnchor,
  semanticFingerprint: stepIdentity
});

const canonical = {
  type: "canonical_artifact",
  schema_version: "1.0.0",
  source_module: "polyform/org/scripts/canonical_identity.mjs",
  authority_status: "authority",
  artifact_id: artifactId,
  artifact_hash: artifactHash,
  artifact_kind: artifactKind,
  payload_kind: payloadKind,
  producer_step_identity: stepIdentity,
  address_seed: addressSeed,
  virtual_address: virtualAddress,
  balanced_address: balancedAddress,
  receipt_anchor: receiptAnchor,
  content_path: absInput,
  content_sha256: contentSha,
  content_bytes: Buffer.byteLength(parsed.canonicalPayload, "utf8"),
  canonical_payload: parsed.canonicalPayload,
  projection_hints: {
    authority_source: "bitboard",
    source_file: basename,
    word_count: parsed.wordCount,
    grid_rows: parsed.gridRows
  },
  provenance: {
    derived_from: "bitboard_authority",
    semantic_fingerprint: stepIdentity,
    resolver_version: "bitboard_to_canonical_v1"
  },
  replay_stage: "emit",
  receipt: {
    anchor: receiptAnchor,
    requirements: {
      require_step_identity: true,
      require_address_seed: true,
      require_content_sha256: true,
      require_source_target: true,
      require_receipt_anchor: true
    }
  }
};

const payload = `${JSON.stringify(canonical)}\n`;
if (outputPath) {
  fs.writeFileSync(path.resolve(outputPath), payload, "utf8");
} else {
  process.stdout.write(payload);
}
