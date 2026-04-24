#!/usr/bin/env node
"use strict";

import { createRewriteState, rewriteStep } from "./dot_rewrite.mjs";

export const HEADER8_PREFIX = [0x00, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f];
export const PREHEADER_UNARY_MAX = 0x2f;
export const STRUCTURAL_BYTES = new Set([0x20, 0x28, 0x29, 0x2e]);

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

export function makeHeader8(input, curr) {
  return [...HEADER8_PREFIX, input & 0xff, curr & 0xff];
}

function normalizeEntry(entry) {
  if (typeof entry === "number") return { byte: entry & 0xff };
  if (entry && typeof entry === "object" && typeof entry.byte === "number") {
    return {
      byte: entry.byte & 0xff,
      interpret_as: entry.interpret_as || null,
      expected_header8: Array.isArray(entry.expected_header8) ? entry.expected_header8.map((n) => n & 0xff) : null
    };
  }
  throw new Error(`Invalid stream entry: ${JSON.stringify(entry)}`);
}

function validateHeaderCommitment(commitment) {
  if (!commitment) return null;
  if (!Array.isArray(commitment) || commitment.length !== 6) {
    return { code: "E_HEADER_COMMITMENT_SHAPE", message: "header_commitment must be 6-byte array" };
  }
  for (let i = 0; i < 6; i += 1) {
    if ((commitment[i] & 0xff) !== HEADER8_PREFIX[i]) {
      return {
        code: "E_HEADER_COMMITMENT_MISMATCH",
        message: `Header commitment mismatch at slot ${i}: expected ${hexByte(HEADER8_PREFIX[i])}, got ${hexByte(commitment[i])}`
      };
    }
  }
  return null;
}

export function evaluateStream(stream, options = {}) {
  const out = {
    pass: true,
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
  const commitmentError = validateHeaderCommitment(options.header_commitment || null);
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
    const header8 = makeHeader8(b, curr);

    if (entry.expected_header8) {
      const same = JSON.stringify(entry.expected_header8) === JSON.stringify(header8);
      if (!same) {
        return {
          ...out,
          pass: false,
          error: {
            code: "E_HEADER_INCONGRUENT",
            message: `Expected header8 does not match runtime header8 at index ${index}`,
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
      phase,
      input: b,
      previous_state: prev,
      current_state: curr,
      header8
    };
    out.steps.push(step);
    out.emits.push(rewriteStep(step, rewriteState));
    prev = curr;
  }

  return out;
}
