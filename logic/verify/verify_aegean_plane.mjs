#!/usr/bin/env node
"use strict";

/*
 * AEGEAN PLANE VERIFICATION GATE
 *
 * Tests Aegean encoding for header/exponent semantics.
 */

import { encodeAegean, decodeAegean, testAegeanPlane } from "../runtime/aegean_plane.mjs";

function verifyAegean() {
  console.log("=== AEGEAN PLANE VERIFICATION ===\n");

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

  test("aegean-00-encoding", 0, (i) => encodeAegean(i) === 0x10100);
  test("aegean-3f-encoding", 63, (i) => encodeAegean(i) === 0x1013F);
  test("aegean-00-decoding", 0x10100, (i) => decodeAegean(i) === 0);
  test("aegean-3f-decoding", 0x1013F, (i) => decodeAegean(i) === 63);
  test("aegean-out-of-range", 64, (i) => encodeAegean(i) === null);
  test("aegean-invalid-cp", 0x10000, (i) => decodeAegean(i) === null);
  test("aegean-float-encoding", 1, (i) => encodeAegean(i) !== null);
  test("aegean-range-valid", 32, (i) => encodeAegean(i) >= 0x10120 && encodeAegean(i) <= 0x1013F);

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = verifyAegean();
  process.exit(result.failed > 0 ? 1 : 0);
}