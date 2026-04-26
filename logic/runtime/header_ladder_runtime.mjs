#!/usr/bin/env node
"use strict";

import { createRewriteState, rewriteStep } from "./dot_rewrite.mjs";

export const HEADER_PREFIXES = {
  header8: [0x00, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f],
  header16: [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
             0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f],
  header32: [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
             0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
             0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
             0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f],
  header256: [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
              0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
              0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
              0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
              0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27,
              0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f]
};

export const PREHEADER_UNARY_MAX = 0x2f;
export const STRUCTURAL_BYTES = new Set([0x20, 0x28, 0x29, 0x2e]);

export const HEADER_SIZES = {
  header8: 8,
  header16: 16,
  header32: 32,
  header256: 32
};

function hexByte(n) {
  return `0x${(n & 0xff).toString(16).padStart(2, "0").toUpperCase()}`;
}

function winner(prev, input, tick) {
  return ((prev * 17) + (input * 29) + tick) % 7;
}

function nextState(prev, input, tick) {
  const w = winner(prev, input, tick);
  return (prev + input + w + 2) % 64;
}

export function makeHeader(precision, input, curr) {
  const prefix = HEADER_PREFIXES[precision] || HEADER_PREFIXES.header8;
  return [...prefix, input & 0xff, curr & 0xff];
}

export function parseBinary256(input) {
  const view = new DataView(new ArrayBuffer(32));
  for (let i = 0; i < 32; i++) {
    view.setUint8(i, input[i] & 0xff);
  }
  const sign = (view.getUint8(0) & 0x80) >> 7;
  const exponent = view.getUint16(20, false);
  const significand = view.getBigUint64(24, false);
  return { sign, exponent, significand };
}

function validateHeaderCommitment(preset, commitment) {
  if (!commitment) return null;
  const prefix = HEADER_PREFIXES[preset] || HEADER_PREFIXES.header8;
  if (commitment.length !== prefix.length + 2) {
    return { code: "E_HEADER_COMMITMENT_SHAPE", message: `header_commitment must be ${prefix.length + 2}-byte array` };
  }
  for (let i = 0; i < prefix.length; i += 1) {
    if ((commitment[i] & 0xff) !== prefix[i]) {
      return {
        code: "E_HEADER_COMMITMENT_MISMATCH",
        message: `Header commitment mismatch at slot ${i}: expected ${hexByte(prefix[i])}, got ${hexByte(commitment[i])}`
      };
    }
  }
  return null;
}

function normalizeEntry(entry) {
  if (typeof entry === "number") return { byte: entry & 0xff };
  if (entry && typeof entry === "object" && typeof entry.byte === "number") {
    return {
      byte: entry.byte & 0xff,
      interpret_as: entry.interpret_as || null,
      expected_header: Array.isArray(entry.expected_header) ? entry.expected_header.map((n) => n & 0xff) : null
    };
  }
  throw new Error(`Invalid stream entry: ${JSON.stringify(entry)}`);
}

export function evaluateStream(stream, options = {}) {
  const precision = options.precision || "header8";
  const prefix = HEADER_PREFIXES[precision] || HEADER_PREFIXES.header8;
  const width = HEADER_SIZES[precision] || 8;

  const out = {
    pass: true,
    precision,
    width,
    phase_transitions: [],
    steps: [],
    emits: []
  };

  let phase = "UNARY";
  let tick = 0;
  let prev = 0;
  const unaryMax = Number.isInteger(options.preheader_unary_max)
    ? (options.preheader_unary_max & 0xff)
    : PREHEADER_UNARY_MAX;

  const rewriteState = createRewriteState();
  const commitmentError = validateHeaderCommitment(precision, options.header_commitment || null);
  if (commitmentError) {
    return {
      ...out,
      pass: false,
      error: {
        ...commitmentError,
        index: 0
      }
    };
  }

  for (let index = 0; index < stream.length; index += 1) {
    const entry = normalizeEntry(stream[index]);
    const b = entry.byte;

    if (phase === "UNARY" && b > unaryMax) {
      phase = "STRUCTURAL";
      out.phase_transitions.push({ index, from: "UNARY", to: "STRUCTURAL", trigger: hexByte(b) });
    }

    tick += 1;
    const curr = nextState(prev, b, tick);
    const header = makeHeader(precision, b, curr);

    if (entry.expected_header) {
      const same = JSON.stringify(entry.expected_header) === JSON.stringify(header);
      if (!same) {
        return {
          ...out,
          pass: false,
          error: {
            code: "E_HEADER_INCONGRUENT",
            message: `Expected header does not match runtime header at index ${index}`,
            index
          }
        };
      }
    }

    if (phase === "UNARY" && entry.interpret_as && entry.interpret_as.startsWith("STRUCT.")) {
      return {
        ...out,
        pass: false,
        error: {
          code: "E_UNARY_STRUCTURAL_INTERPRETATION",
          message: `Structural interpretation '${entry.interpret_as}' is disallowed during unary pre-header phase`,
          index
        }
      };
    }

    if (phase === "UNARY" && STRUCTURAL_BYTES.has(b) && entry.interpret_as) {
      return {
        ...out,
        pass: false,
        error: {
          code: "E_UNARY_DISALLOWED_TOKEN_INTERPRETATION",
          message: `Token ${hexByte(b)} has explicit interpretation during unary phase`,
          index
        }
      };
    }

    const step = {
      index,
      precision,
      phase,
      width,
      input: b,
      previous_state: prev,
      current_state: curr,
      header
    };
    out.steps.push(step);
    out.emits.push(rewriteStep(step, rewriteState));
    prev = curr;
  }

  return out;
}

export function getPrecisionInfo(precision) {
  const prefix = HEADER_PREFIXES[precision] || HEADER_PREFIXES.header8;
  const width = HEADER_SIZES[precision] || 8;
  return {
    precision,
    width,
    prefix_length: prefix.length,
    total_bytes: prefix.length + 2
  };
}