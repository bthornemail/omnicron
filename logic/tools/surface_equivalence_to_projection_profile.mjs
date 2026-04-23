#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function loadNdjson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line, i) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        throw new Error(`Invalid NDJSON at ${filePath}:${i + 1}: ${err.message}`);
      }
    });
}

function stageFromId(id) {
  if (/rule|ancestor|derive|closure/i.test(id)) return "carry_lookahead";
  if (/parent|term|fact/i.test(id)) return "truth_table";
  return "karnaugh";
}

function carrierFromHash(hash) {
  const n = parseInt(hash.slice(0, 2), 16);
  const carriers = ["AZTEC", "MAXI", "BEE", "16K"];
  return carriers[n % carriers.length];
}

function main() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const inPath = path.join(root, "logic/generated/surface_equivalence_receipts.ndjson");
  const outPath = path.join(root, "logic/generated/surface_projection_profile.ndjson");
  if (!fs.existsSync(inPath)) fail(`Missing input receipts: ${inPath}`);

  const receipts = loadNdjson(inPath).filter((r) => r.type === "surface_equivalence_receipt");
  const projections = receipts.map((r, idx) => {
    const stage = stageFromId(r.id);
    const carrier = carrierFromHash(r.canonical_pair_hash || "00");
    const torusCell = idx % 16;
    return {
      type: "derived_projection_profile",
      id: r.id,
      canonical_pair_hash: r.canonical_pair_hash,
      complete: !!r.complete,
      stage,
      kmap_torus: {
        cell_index: torusCell,
        active: r.surfaces_conflicting === 0
      },
      carrier_projection: {
        selected_label: carrier,
        all_labels: ["AZTEC", "MAXI", "BEE", "16K"]
      },
      polyform_overlay: {
        grouping_mode: r.complete ? "stable_group" : "partial_group",
        surfaces_present: r.surfaces_present,
        surfaces_expected: r.surfaces_expected
      },
      lexical_profile: {
        wordnet_anchors: r.profile?.wordnet_anchors || [],
        lexical_tags: r.profile?.lexical_tags || []
      },
      provenance: {
        derived_from: "surface_equivalence_receipt",
        authority_inversion: false
      }
    };
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${projections.map((p) => JSON.stringify(p)).join("\n")}\n`, "utf8");
  console.log(`OK: wrote ${outPath}`);
}

try {
  main();
} catch (err) {
  fail(err.message);
}
