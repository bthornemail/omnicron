#!/usr/bin/env node
"use strict";

import { createHash } from "node:crypto";
import fs from "node:fs";
import { evaluateStream } from "./header8_runtime.mjs";

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function maskFor(widthBits) {
  if (widthBits > 32) throw new Error("LOGIC_PACKET_V0_ONLY_SUPPORTS_WIDTH_LE_32");
  return widthBits === 32 ? 0xffffffff : ((1 << widthBits) - 1);
}

function rotl(x, n, widthBits) {
  const mask = maskFor(widthBits);
  n %= widthBits;
  return ((x << n) | (x >>> (widthBits - n))) & mask;
}

function rotr(x, n, widthBits) {
  const mask = maskFor(widthBits);
  n %= widthBits;
  return ((x >>> n) | (x << (widthBits - n))) & mask;
}

function deltaStep(x, law) {
  const width = law.width_bits;
  const mask = maskFor(width);
  let y = law.constant & mask;
  for (const n of law.rotl) y ^= rotl(x, n, width);
  for (const n of law.rotr) y ^= rotr(x, n, width);
  return y & mask;
}

function byte(n) {
  return ((n % 256) + 256) % 256;
}

export function replayLogicPacket(packet) {
  const preheader = evaluateStream(packet.preheader_stream, {
    header_commitment: packet.preheader_commitment
  });
  if (!preheader.pass) {
    return {
      pass: false,
      error: {
        code: "E_PREHEADER_REPLAY_FAILED",
        cause: preheader.error || null
      }
    };
  }

  const preheaderWitness = {
    phase_transitions: preheader.phase_transitions,
    steps: preheader.steps,
    emits: preheader.emits
  };
  const preheaderWitnessSha256 = sha256Hex(canonicalJson(preheaderWitness));

  let state = byte(packet.origin.seed);
  const out = [];
  const trace = [];

  for (let pc = 0; pc < packet.rewrite_program.length; pc += 1) {
    const ins = packet.rewrite_program[pc];
    if (ins.op === "emit_seed") {
      out.push(state);
      trace.push({ pc, op: ins.op, state, emit: state });
      continue;
    }

    if (ins.op === "add_emit") {
      state = byte(state + Number(ins.value || 0));
      out.push(state);
      trace.push({ pc, op: ins.op, value: Number(ins.value || 0), state, emit: state });
      continue;
    }

    if (ins.op === "xor_emit") {
      state = byte(state ^ byte(Number(ins.value || 0)));
      out.push(state);
      trace.push({ pc, op: ins.op, value: byte(Number(ins.value || 0)), state, emit: state });
      continue;
    }

    if (ins.op === "lut_add_emit") {
      if (!Object.prototype.hasOwnProperty.call(packet.rule_lut, ins.key)) {
        return {
          pass: false,
          error: {
            code: "E_MISSING_LUT_ENTRY",
            pc,
            key: ins.key
          },
          repair_request: {
            packet_id: packet.id,
            missing_lut_key: ins.key
          }
        };
      }
      const v = Number(packet.rule_lut[ins.key]);
      state = byte(state + v);
      out.push(state);
      trace.push({ pc, op: ins.op, key: ins.key, value: v, state, emit: state });
      continue;
    }

    if (ins.op === "delta_emit") {
      const repeat = Number(ins.repeat || 1);
      for (let i = 0; i < repeat; i += 1) {
        state = byte(deltaStep(state, packet.delta_law));
        out.push(state);
      }
      trace.push({ pc, op: ins.op, repeat, state, emit_count: repeat });
      continue;
    }

    return {
      pass: false,
      error: {
        code: "E_UNKNOWN_REWRITE_OP",
        pc,
        op: ins.op
      }
    };
  }

  const artifactBytes = Uint8Array.from(out);
  const artifactText = Buffer.from(artifactBytes).toString(packet.projection.encoding || "utf8");
  const artifactSha256 = sha256Hex(artifactBytes);
  const pass =
    artifactSha256 === packet.expected.artifact_sha256 &&
    (!packet.expected.preheader_witness_sha256 || packet.expected.preheader_witness_sha256 === preheaderWitnessSha256);

  return {
    pass,
    packet_id: packet.id,
    artifact_bytes: Array.from(artifactBytes),
    artifact_text: artifactText,
    artifact_sha256: artifactSha256,
    preheader_witness_sha256: preheaderWitnessSha256,
    trace,
    error: pass
      ? null
      : {
          code: "E_ARTIFACT_HASH_MISMATCH",
          expected: packet.expected.artifact_sha256,
          actual: artifactSha256
        }
  };
}

export function loadPacket(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const packetPath = process.argv[2];
  if (!packetPath) {
    console.error("Usage: node logic_packet_replay.mjs <logic_packet.json> [receipt.ndjson]");
    process.exit(2);
  }
  const result = replayLogicPacket(loadPacket(packetPath));
  if (process.argv[3]) fs.writeFileSync(process.argv[3], `${JSON.stringify(result)}\n`, "utf8");
  console.log(JSON.stringify(result));
  process.exit(result.pass ? 0 : 1);
}
