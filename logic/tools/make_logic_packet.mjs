#!/usr/bin/env node
"use strict";

import { createHash } from "node:crypto";
import fs from "node:fs";
import { replayLogicPacket } from "../runtime/logic_packet_replay.mjs";

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function packetTemplate() {
  const artifact = Buffer.from("OMI", "utf8");
  return {
    type: "logic_packet",
    version: "v0",
    id: "logic-packet-v0-omi-seed",
    description: "Minimal reconstructive packet: rebuild the text OMI from one seed plus LUT deltas.",
    preheader_commitment: [0, 27, 28, 29, 30, 31],
    preheader_stream: [0, 1, 2, 3, 15, 16, 31, 32, 46, 64],
    delta_law: {
      id: "rotl1_xor_rotl3_xor_rotr2_xor_C",
      width_bits: 8,
      rotl: [1, 3],
      rotr: [2],
      operator: "xor",
      constant: 2,
      mask: "0xff"
    },
    origin: {
      seed: 79,
      label: "ASCII O"
    },
    rule_lut: {
      "O->M": -2,
      "M->I": -4
    },
    rewrite_program: [
      { "op": "emit_seed" },
      { "op": "lut_add_emit", "key": "O->M" },
      { "op": "lut_add_emit", "key": "M->I" }
    ],
    projection: {
      target: "text",
      encoding: "utf8"
    },
    expected: {
      artifact_sha256: sha256Hex(artifact),
      artifact_text: "OMI"
    },
    repair_hints: [
      "If replay fails with E_MISSING_LUT_ENTRY, request only that LUT key from a peer.",
      "If replay fails with E_PREHEADER_REPLAY_FAILED, reject the packet before interpreting the rewrite program."
    ]
  };
}

function main() {
  const out = process.argv[2] || "logic/generated/logic_packet_v0_sample.json";
  const packet = packetTemplate();
  const firstReplay = replayLogicPacket(packet);
  if (!firstReplay.pass) {
    console.error(`ERROR: template replay failed: ${JSON.stringify(firstReplay.error)}`);
    process.exit(1);
  }
  packet.expected.preheader_witness_sha256 = firstReplay.preheader_witness_sha256;
  fs.writeFileSync(out, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  console.log(`packet=${out}`);
  console.log(`artifact_sha256=${packet.expected.artifact_sha256}`);
  console.log(`preheader_witness_sha256=${packet.expected.preheader_witness_sha256}`);
}

main();
