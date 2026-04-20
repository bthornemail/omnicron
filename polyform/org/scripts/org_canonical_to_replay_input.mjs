#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error(
    "Usage: node scripts/org_canonical_to_replay_input.mjs <canonical.ndjson> <replay.logic> [candidates.logic]"
  );
}

function normalizePayload(s) {
  const payload = String(s ?? "");
  return payload.endsWith("\n") ? payload : `${payload}\n`;
}

const canonicalPath = process.argv[2];
const replayOutPath = process.argv[3];
const candidateOutPath = process.argv[4] ?? null;

if (!canonicalPath || !replayOutPath) {
  usage();
  process.exit(2);
}

const absCanonical = path.resolve(canonicalPath);
if (!fs.existsSync(absCanonical)) {
  console.error(`Input not found: ${absCanonical}`);
  process.exit(2);
}

const lines = fs
  .readFileSync(absCanonical, "utf8")
  .split("\n")
  .filter((l) => l.trim().length > 0);

const payloads = [];
for (const line of lines) {
  let rec;
  try {
    rec = JSON.parse(line);
  } catch (err) {
    console.error(`Skipping invalid JSON line: ${err.message}`);
    continue;
  }
  if (rec.type !== "canonical_artifact") continue;
  const isLogicArtifact =
    rec.artifact_kind === "prolog_fact_set" || rec.payload_kind === "logic_text";
  if (!isLogicArtifact) continue;
  payloads.push(normalizePayload(rec.canonical_payload));
}

if (payloads.length === 0) {
  console.error("No logic payloads found in canonical artifact NDJSON.");
  process.exit(3);
}

const joined = payloads.join("");
fs.writeFileSync(path.resolve(replayOutPath), joined, "utf8");
if (candidateOutPath) {
  fs.writeFileSync(path.resolve(candidateOutPath), joined, "utf8");
}

console.log(`OK: replay payload materialized from canonical artifacts (${payloads.length} block(s))`);
