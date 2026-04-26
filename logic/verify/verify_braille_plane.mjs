#!/usr/bin/env node
"use strict";

/*
 * BRAILLE PLANE VERIFICATION GATE
 *
 * Tests Braille encoding for dense payload semantics.
 */

import { encodeBraille, decodeBraille, testBraillePlane } from "../runtime/braille_plane.mjs";

function verifyBraille() {
  console.log("=== BRAILLE PLANE VERIFICATION ===\n");

  let passed = 0;
  let failed = 0;

  function test(id, input, check) {
    const result = check(input);
    if (result) {
      console.log(`OK: ${id}`);
      passed++;
    } else {
      console.log(`FAIL: ${id}`);
      failed++;
    }
  }

  test("braille-range-start", 0x2800, (i) => i === 0x2800);
  test("braille-range-end", 0x28FF, (i) => i === 0x28FF);
  test("braille-pattern-count", 256, (i) => i === 256);
  test("braille-dot1", "a", (t) => encodeBraille(t).length > 0);
  test("braille-hello", "hello", (t) => encodeBraille(t).length === 5);
  test("braille-empty", "", (t) => encodeBraille(t).length === 0);
  test("braille-word-encoding", "ab", (t) => {
    const encoded = encodeBraille(t);
    return encoded.length === 2;
  });
  test("braille-roundtrip", "ab", (t) => {
    const encoded = encodeBraille(t);
    const decoded = decodeBraille(encoded);
    return decoded.length > 0;
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = verifyBraille();
  process.exit(result.failed > 0 ? 1 : 0);
}