#!/usr/bin/env node
"use strict";

import { evaluateStream } from "../runtime/header8_runtime.mjs";

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) fail(msg);
}

function main() {
  // Substrate profile:
  // - unary control window is 0x00..0x1F
  // - 0x20 row becomes structural dot-notation surface
  // - 0x30 row becomes ASCII logic glyph surface
  const stream = Array.from({ length: 0x40 }, (_, i) => i);
  const result = evaluateStream(stream, {
    header_commitment: [0x00, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f],
    preheader_unary_max: 0x1f
  });

  assert(result.pass, `substrate stream unexpectedly failed: ${result.error ? result.error.code : "UNKNOWN"}`);
  assert(result.phase_transitions.length >= 1, "expected at least one phase transition");

  const t0 = result.phase_transitions[0];
  assert(t0.index === 0x20, `expected transition at index 32, got ${t0.index}`);
  assert(t0.from === "UNARY" && t0.to === "STRUCTURAL", `unexpected transition ${JSON.stringify(t0)}`);

  // Unary control line must remain unary control emits.
  for (let i = 0; i <= 0x1f; i += 1) {
    const got = result.emits[i];
    const want = `CONTROL.UNARY(0x${i.toString(16).toUpperCase().padStart(2, "0")})`;
    assert(got === want, `unary emit mismatch at 0x${i.toString(16)}: got=${got} want=${want}`);
  }

  // 0x20 row structural activation checks.
  assert(result.emits[0x20] === "STRUCT.SPACE", `0x20 should be STRUCT.SPACE, got=${result.emits[0x20]}`);
  assert(result.emits[0x28].startsWith("STRUCT.LIST-OPEN"), `0x28 should open list, got=${result.emits[0x28]}`);
  assert(result.emits[0x29].startsWith("STRUCT.LIST-CLOSE"), `0x29 should close list, got=${result.emits[0x29]}`);
  assert(result.emits[0x2e].startsWith("STRUCT.DOT"), `0x2E should be dot structural token, got=${result.emits[0x2e]}`);
  assert(result.emits[0x2f].startsWith("STRUCT.PAIR"), `0x2F should complete pair after dot, got=${result.emits[0x2f]}`);

  // 0x30 row should be plain ASCII logic glyph tokens.
  assert(result.emits[0x30] === "TOKEN.ASCII(0x30)", `0x30 emit mismatch: ${result.emits[0x30]}`);
  assert(result.emits[0x3A] === "TOKEN.ASCII(0x3A)", `0x3A emit mismatch: ${result.emits[0x3A]}`);
  assert(result.emits[0x3F] === "TOKEN.ASCII(0x3F)", `0x3F emit mismatch: ${result.emits[0x3F]}`);

  console.log("OK: ASCII substrate lexer verified (0x00..0x1F unary, 0x20/0x30 rows structural/system-lexer)");
}

main();
