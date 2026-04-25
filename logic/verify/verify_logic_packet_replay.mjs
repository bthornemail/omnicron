#!/usr/bin/env node
"use strict";

import fs from "node:fs";
import path from "node:path";
import { replayLogicPacket, loadPacket } from "../runtime/logic_packet_replay.mjs";

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) fail(msg);
}

function hasRequiredShape(packet) {
  const required = [
    "type",
    "version",
    "id",
    "preheader_commitment",
    "preheader_stream",
    "delta_law",
    "origin",
    "rule_lut",
    "rewrite_program",
    "projection",
    "expected"
  ];
  return required.every((k) => Object.prototype.hasOwnProperty.call(packet, k));
}

function main() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const packetPath = path.resolve(process.argv[2] || path.join(root, "logic/generated/logic_packet_v0_sample.json"));
  const receiptPath = path.resolve(process.argv[3] || path.join(root, "logic/generated/logic_packet_v0_replay_receipt.ndjson"));

  if (!fs.existsSync(packetPath)) {
    fail(`packet not found: ${packetPath}; run make logic-packet-v0 first`);
  }

  const packet = loadPacket(packetPath);
  assert(hasRequiredShape(packet), "packet missing required top-level fields");
  assert(packet.type === "logic_packet" && packet.version === "v0", "packet type/version mismatch");

  const result = replayLogicPacket(packet);
  fs.writeFileSync(receiptPath, `${JSON.stringify(result)}\n`, "utf8");
  assert(result.pass, `packet replay failed: ${JSON.stringify(result.error)}`);
  assert(result.artifact_text === packet.expected.artifact_text, "artifact text mismatch");

  const missingPacket = JSON.parse(JSON.stringify(packet));
  delete missingPacket.rule_lut["O->M"];
  const missingResult = replayLogicPacket(missingPacket);
  assert(!missingResult.pass, "missing LUT entry unexpectedly passed");
  assert(missingResult.error && missingResult.error.code === "E_MISSING_LUT_ENTRY", "missing LUT error code mismatch");
  assert(missingResult.repair_request && missingResult.repair_request.missing_lut_key === "O->M", "repair request missing LUT key");

  const badPreheader = JSON.parse(JSON.stringify(packet));
  badPreheader.preheader_stream = [0, { byte: 46, interpret_as: "STRUCT.DOT" }, 64];
  const badPreheaderResult = replayLogicPacket(badPreheader);
  assert(!badPreheaderResult.pass, "bad pre-header unexpectedly passed");
  assert(badPreheaderResult.error && badPreheaderResult.error.code === "E_PREHEADER_REPLAY_FAILED", "bad pre-header error code mismatch");

  console.log(`OK: logic packet replay verified (${packet.id})`);
  console.log(`receipt=${receiptPath}`);
}

main();
