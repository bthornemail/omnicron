#!/usr/bin/env node
"use strict";

/*
 * AEGEAN PLANE ENCODER/DECODER (U+10100-U+1013F)
 *
 * Linear B syllabary extended as header/exponent encoding.
 * 
 * Codepoint range: U+10100 (aegean_00) to U+1013F (aegean_3F)
 * Structure: 64 tile values (6-bit precision)
 * 
 * Tile layout:
 *   - U+10100-U+1010F: sign + exponent (16 tiles)
 *   - U+10110-U+1011F: exponent continuation (16 tiles) 
 *   - U+10120-U+1012F: significand (16 tiles)
 *   - U+10130-U+1013F: control/cohort (16 tiles)
 */

export const AEGEAN_START = 0x10100;
export const AEGEAN_END = 0x1013F;
export const AEGEAN_TILES = 64;

const AEGEAN_TILE_MAP = new Map([
  [0x00, { name: "aegean_00", category: "sign", card: 0 }],
  [0x01, { name: "aegean_01", category: "sign", card: 1 }],
  [0x02, { name: "aegean_02", category: "sign", card: 2 }],
  [0x03, { name: "aegean_03", category: "sign", card: 3 }],
  [0x04, { name: "aegean_04", category: "sign", card: 4 }],
  [0x05, { name: "aegean_05", category: "sign", card: 5 }],
  [0x06, { name: "aegean_06", category: "sign", card: 6 }],
  [0x07, { name: "aegean_07", category: "sign", card: 7 }],
  [0x08, { name: "aegean_08", category: "sign", card: 8 }],
  [0x09, { name: "aegean_09", category: "sign", card: 9 }],
  [0x0a, { name: "aegean_0a", category: "exponent", card: 10 }],
  [0x0b, { name: "aegean_0b", category: "exponent", card: 11 }],
  [0x0c, { name: "aegean_0c", category: "exponent", card: 12 }],
  [0x0d, { name: "aegean_0d", category: "exponent", card: 13 }],
  [0x0e, { name: "aegean_0e", category: "exponent", card: 14 }],
  [0x0f, { name: "aegean_0f", category: "exponent", card: 15 }],
  [0x10, { name: "aegean_10", category: "exponent", card: 16 }],
  [0x11, { name: "aegean_11", category: "exponent", card: 17 }],
  [0x12, { name: "aegean_12", category: "exponent", card: 18 }],
  [0x13, { name: "aegean_13", category: "exponent", card: 19 }],
  [0x14, { name: "aegean_14", category: "exponent", card: 20 }],
  [0x15, { name: "aegean_15", category: "exponent", card: 21 }],
  [0x16, { name: "aegean_16", category: "exponent", card: 22 }],
  [0x17, { name: "aegean_17", category: "exponent", card: 23 }],
  [0x18, { name: "aegean_18", category: "exponent", card: 24 }],
  [0x19, { name: "aegean_19", category: "exponent", card: 25 }],
  [0x1a, { name: "aegean_1a", category: "significand", card: 26 }],
  [0x1b, { name: "aegean_1b", category: "significand", card: 27 }],
  [0x1c, { name: "aegean_1c", category: "significand", card: 28 }],
  [0x1d, { name: "aegean_1d", category: "significand", card: 29 }],
  [0x1e, { name: "aegean_1e", category: "significand", card: 30 }],
  [0x1f, { name: "aegean_1f", category: "significand", card: 31 }],
  [0x20, { name: "aegean_20", category: "significand", card: 32 }],
  [0x21, { name: "aegean_21", category: "significand", card: 33 }],
  [0x22, { name: "aegean_22", category: "significand", card: 34 }],
  [0x23, { name: "aegean_23", category: "significand", card: 35 }],
  [0x24, { name: "aegean_24", category: "significand", card: 36 }],
  [0x25, { name: "aegean_25", category: "significand", card: 37 }],
  [0x26, { name: "aegean_26", category: "significand", card: 38 }],
  [0x27, { name: "aegean_27", category: "significand", card: 39 }],
  [0x28, { name: "aegean_28", category: "significand", card: 40 }],
  [0x29, { name: "aegean_29", category: "significand", card: 41 }],
  [0x2a, { name: "aegean_2a", category: "control", card: 42 }],
  [0x2b, { name: "aegean_2b", category: "control", card: 43 }],
  [0x2c, { name: "aegean_2c", category: "control", card: 44 }],
  [0x2d, { name: "aegean_2d", category: "control", card: 45 }],
  [0x2e, { name: "aegean_2e", category: "control", card: 46 }],
  [0x2f, { name: "aegean_2f", category: "control", card: 47 }],
  [0x30, { name: "aegean_30", category: "control", card: 48 }],
  [0x31, { name: "aegean_31", category: "control", card: 49 }],
  [0x32, { name: "aegean_32", category: "control", card: 50 }],
  [0x33, { name: "aegean_33", category: "control", card: 51 }],
  [0x34, { name: "aegean_34", category: "control", card: 52 }],
  [0x35, { name: "aegean_35", category: "control", card: 53 }],
  [0x36, { name: "aegean_36", category: "control", card: 54 }],
  [0x37, { name: "aegean_37", category: "control", card: 55 }],
  [0x38, { name: "aegean_38", category: "control", card: 56 }],
  [0x39, { name: "aegean_39", category: "control", card: 57 }],
  [0x3a, { name: "aegean_3a", category: "cohort", card: 58 }],
  [0x3b, { name: "aegean_3b", category: "cohort", card: 59 }],
  [0x3c, { name: "aegean_3c", category: "cohort", card: 60 }],
  [0x3d, { name: "aegean_3d", category: "cohort", card: 61 }],
  [0x3e, { name: "aegean_3e", category: "cohort", card: 62 }],
  [0x3f, { name: "aegean_3f", category: "cohort", card: 63 }],
]);

export function encodeAegean(tileIndex) {
  if (tileIndex < 0 || tileIndex > 63) {
    return null;
  }
  return AEGEAN_START + tileIndex;
}

export function decodeAegean(codepoint) {
  if (codepoint < AEGEAN_START || codepoint > AEGEAN_END) {
    return null;
  }
  return codepoint - AEGEAN_START;
}

export function getAegeanTile(tileIndex) {
  return AEGEAN_TILE_MAP.get(tileIndex) || null;
}

export function getCategoryForCard(cardinality) {
  if (cardinality < 10) return "sign";
  if (cardinality < 26) return "exponent";
  if (cardinality < 42) return "significand";
  return "cohort";
}

export function encodeFloat(sign, exponent, significand) {
  const signTile = Math.min(Math.max(sign, 0), 9);
  const expTile = 10 + Math.min(Math.max(exponent - 10, 0), 15);
  const sigTile = 26 + Math.min(Math.max(significand - 26, 0), 15);
  return {
    tiles: [signTile, expTile, sigTile],
    codepoints: [encodeAegean(signTile), encodeAegean(expTile), encodeAegean(sigTile)]
  };
}

export function testAegeanPlane() {
  console.log("=== AEGEAN PLANE ENCODER ===\n");

  console.log("Range: U+10100 - U+1013F (64 tiles)");
  console.log("Categories:");
  console.log("  0x00-0x0F: sign (10 tiles)");
  console.log("  0x10-0x1F: exponent (16 tiles)");
  console.log("  0x20-0x29: significand (10 tiles)");
  console.log("  0x2A-0x39: control (16 tiles)");
  console.log("  0x3A-0x3F: cohort (6 tiles)");

  console.log("\n--- Sample Encodings ---");
  for (const [idx, info] of AEGEAN_TILE_MAP) {
    if (idx < 5 || idx === 0x0c || idx === 0x12 || idx === 0x1a || idx === 0x23) {
      console.log(`  ${info.name}: U+${(0x10100 + idx).toString(16).toUpperCase()} (${info.category})`);
    }
  }

  console.log("\n--- Float Encoding ---");
  const float = encodeFloat(1, 15, 30);
  console.log(`  sign=1, exp=15, sig=30`);
  console.log(`  tiles: [${float.tiles.join(", ")}]`);
  console.log(`  codepoints: ${float.codepoints.map(c => "U+" + c.toString(16).toUpperCase()).join(", ")}`);

  console.log("\n=== Aegean Plane Ready ===");
  return { tiles: 64, range: `${0x10100.toString(16)}-${0x1013F.toString(16)}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAegeanPlane();
}