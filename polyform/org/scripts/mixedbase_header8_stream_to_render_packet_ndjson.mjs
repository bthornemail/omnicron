#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { evaluateStream } from "../../../logic/runtime/header8_runtime.mjs";
import { renderPacketFromMixedBase } from "./mixedbase_stream_to_render_packet_ndjson.mjs";

const HEADER_COMMITMENT = [0x00, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f];

function usage() {
  console.error(
    "Usage: node mixedbase_header8_stream_to_render_packet_ndjson.mjs <stream.txt> [render_packet.ndjson] [witness.ndjson]"
  );
}

function utf8Bytes(text) {
  return Array.from(Buffer.from(text, "utf8"), (b) => b & 0xff);
}

function ndjsonWrite(filePath, rec) {
  fs.writeFileSync(filePath, `${JSON.stringify(rec)}\n`, "utf8");
}

function makeWitness(text, sourceName = "mixedbase_header8") {
  // Consume unary pre-header window first (0x00..0x2F), then decode stream bytes.
  const preheaderUnary = Array.from({ length: 0x30 }, (_, i) => i);
  const bytes = utf8Bytes(text);
  const stream = [...preheaderUnary, ...bytes];
  const result = evaluateStream(stream, { header_commitment: HEADER_COMMITMENT });

  if (!result.pass) {
    const code = result.error ? result.error.code : "UNKNOWN";
    throw new Error(`header8 pre-header congruence failed: ${code}`);
  }

  const firstTransition = result.phase_transitions[0] || null;
  if (!firstTransition) {
    throw new Error("No UNARY->STRUCTURAL phase transition observed");
  }

  const lastStep = result.steps[result.steps.length - 1] || null;
  return {
    type: "mixedbase_header8_witness",
    schema_version: "1.0.0",
    source: sourceName,
    header_commitment: HEADER_COMMITMENT,
    preheader_bytes_consumed: 0x30,
    total_bytes_consumed: stream.length,
    phase_transition: firstTransition,
    final_state: lastStep
      ? {
          index: lastStep.index,
          input: lastStep.input,
          current_state: lastStep.current_state,
          header8: lastStep.header8
        }
      : null,
    emit_preview: result.emits.slice(0, 12)
  };
}

const inputPath = process.argv[2];
const outputPacket = process.argv[3] || "/tmp/mixedbase_header8.render_packet.ndjson";
const outputWitness = process.argv[4] || "/tmp/mixedbase_header8.witness.ndjson";

if (!inputPath) {
  usage();
  process.exit(2);
}

const abs = path.resolve(inputPath);
if (!fs.existsSync(abs)) {
  console.error(`Input not found: ${abs}`);
  process.exit(2);
}

try {
  const text = fs.readFileSync(abs, "utf8");
  const sourceName = path.basename(abs, path.extname(abs));
  const witness = makeWitness(text, sourceName);

  const packet = renderPacketFromMixedBase(text, `${sourceName}_header8`);
  packet.source_artifact_id = `mixedbase-header8:${sourceName}`;
  packet.labels = [
    ...(packet.labels || []),
    { text: "header8-gated: unary->structural", x: 4, y: packet.height * packet.cell_size + 64, fill: "#7dd3fc" },
    { text: `phase-transition-index=${witness.phase_transition.index}`, x: 4, y: packet.height * packet.cell_size + 80, fill: "#7dd3fc" }
  ];

  ndjsonWrite(path.resolve(outputPacket), packet);
  ndjsonWrite(path.resolve(outputWitness), witness);

  console.log(`OK: packet=${path.resolve(outputPacket)}`);
  console.log(`OK: witness=${path.resolve(outputWitness)}`);
} catch (err) {
  console.error(`FAIL: ${err.message}`);
  process.exit(2);
}
