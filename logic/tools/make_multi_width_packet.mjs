#!/usr/bin/env node
"use strict";

import { evaluateStream, HEADER_PREFIXES, HEADER_SIZES } from "../runtime/header_ladder_runtime.mjs";

function rotl(x, k) {
  return ((x << k) | (x >> (8 - k))) & 0xff;
}

function rotr(x, k) {
  return ((x >> k) | (x << (8 - k))) & 0xff;
}

function applyDeltaLaw(byte, prev, constant) {
  let x = byte ^ rotl(prev, 1) ^ rotl(prev, 3) ^ rotr(prev, 2) ^ constant;
  return x & 0xff;
}

export function compileExpressionToWidths(expression, options = {}) {
  const seed = options.seed !== undefined ? options.seed : options.seedChar.charCodeAt(0);
  const constant = options.constant !== undefined ? options.constant : 2;
  const widths = options.widths || ["header8", "header16", "header32", "header256"];

  const packets = {};

  for (const width of widths) {
    const prefix = HEADER_PREFIXES[width];
    const result = evaluateStream([seed], { precision: width });
    const state = result.steps[0].current_state;

    const packet = {
      type: "logic_packet",
      version: "v0",
      id: `logic-packet-${width}-${expression}`,
      description: `Multi-width test: ${expression} at ${width}`,
      precision: width,
      width_bits: HEADER_SIZES[width],
      preheader_commitment: prefix,
      preheader_stream: [seed],
      delta_law: {
        id: "rotl1_xor_rotl3_xor_rotr2_xor_C",
        width_bits: HEADER_SIZES[width],
        rotl: [1, 3],
        rotr: [2],
        operator: "xor",
        constant: constant,
        mask: width === "header256" ? "0xff" : `0x${(1 << HEADER_SIZES[width]) - 1}`
      },
      origin: {
        seed: seed,
        label: `seed_${seed}`
      },
      rewrite_program: [
        { op: "emit_seed" }
      ],
      runtime_state: {
        input_byte: seed,
        current_state: state,
        header: result.steps[0].header
      },
      projection: {
        target: "text",
        encoding: "utf8"
      }
    };

    packets[width] = packet;
  }

  return packets;
}

export function generateTestCorpus() {
  const corpus = [
    { expression: "atom", seed: 65, constant: 2 },
    { expression: "pair", seed: 66, constant: 2 },
    { expression: "list", seed: 67, constant: 2 },
    { expression: "quote", seed: 68, constant: 2 },
    { expression: "nested", seed: 69, constant: 2 }
  ];

  const results = {};

  for (const entry of corpus) {
    results[entry.expression] = compileExpressionToWidths(entry.expression, {
      seed: entry.seed,
      constant: entry.constant
    });
  }

  return results;
}

export function verifyEquivalence(packets) {
  const widths = Object.keys(packets);
  if (widths.length < 2) return { pass: false, error: "need at least 2 widths" };

  const baseSeed = packets[widths[0]].origin.seed;
  const baseState = packets[widths[0]].runtime_state.current_state;

  for (let i = 1; i < widths.length; i++) {
    const w = widths[i];
    if (packets[w].origin.seed !== baseSeed) {
      return { pass: false, error: `seed mismatch at ${w}` };
    }
    if (packets[w].runtime_state.current_state !== baseState) {
      return { pass: false, error: `state mismatch at ${w}` };
    }
  }

  return {
    pass: true,
    widths,
    base_seed: baseSeed,
    base_state: baseState,
    equivalence: "semantic"
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("=== Multi-Width Packet Compiler ===\n");

  const corpus = generateTestCorpus();

  console.log("Corpus generated:");
  for (const [expr, packets] of Object.entries(corpus)) {
    console.log(`  ${expr}:`);
    for (const [width, pkt] of Object.entries(packets)) {
      console.log(`    ${width}: seed=${pkt.origin.seed}, state=${pkt.runtime_state.current_state}`);
    }
  }

  console.log("=== Equivalence Checks ===\n");

  for (const [expr, packets] of Object.entries(corpus)) {
    const result = verifyEquivalence(packets);
    console.log(`${expr}: ${result.pass ? "PASS" : "FAIL"} (${result.error || result.equivalence})`);
  }
}