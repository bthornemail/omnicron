#!/usr/bin/env node
"use strict";

/*
 * BRAILLE PLANE ENCODER/DECODER (U+2800-U+28FF)
 *
 * 6-dot Braille pattern for dense payload encoding.
 * 
 * Codepoint range: U+2800 (⠀) to U+28FF (⠿)
 * Structure: 256 patterns (8-bit, 2^8)
 * 
 * Layout:
 *   - Dot positions: 1-6 (standard Braille)
 *   - Patterns 0x00-0x3F: Standard 64 patterns
 *   - Patterns 0x40-0xFF: Extended/contractions
 *   - U+2800: empty (no dots)
 *   - U+2801-U+2808: single dots
 *   - patterns support grade 1/2 Braille
 */

export const BRAILLE_START = 0x2800;
export const BRAILLE_END = 0x28FF;
export const BRAILLE_PATTERNS = 256;

const BRAILLE_DOT_LAYOUT = [
  [1, 0, 0],
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
  [0, 0, 2],
];

function patternToDots(pattern) {
  const dots = [];
  for (let i = 0; i < 6; i++) {
    if ((pattern >> i) & 1) {
      dots.push(i + 1);
    }
  }
  return dots;
}

function dotsToPattern(dots) {
  let pattern = 0;
  for (const d of dots) {
    if (d >= 1 && d <= 6) {
      pattern |= 1 << (d - 1);
    }
  }
  return pattern;
}

function patternToUnicode(pattern) {
  return BRAILLE_START + pattern;
}

function unicodeToPattern(codepoint) {
  if (codepoint < BRAILLE_START || codepoint > BRAILLE_END) {
    return null;
  }
  return codepoint - BRAILLE_START;
}

const BRAILLE_CONTRACTIONS = new Map([
  [0x00, { name: "braille_00", dots: [], meaning: "empty" }],
  [0x01, { name: "braille_01", dots: [1], meaning: "a" }],
  [0x02, { name: "braille_02", dots: [2], meaning: "b" }],
  [0x03, { name: "braille_03", dots: [1, 2], meaning: "ab" }],
  [0x04, { name: "braille_04", dots: [3], meaning: "c" }],
  [0x05, { name: "braille_05", dots: [1, 3], meaning: "ac" }],
  [0x06, { name: "braille_06", dots: [2, 3], meaning: "bc" }],
  [0x07, { name: "braille_07", dots: [1, 2, 3], meaning: "abc" }],
  [0x08, { name: "braille_08", dots: [4], meaning: "d" }],
  [0x09, { name: "braille_09", dots: [1, 4], meaning: "ad" }],
  [0x0a, { name: "braille_0a", dots: [2, 4], meaning: "bd" }],
  [0x0b, { name: "braille_0b", dots: [1, 2, 4], meaning: "abd" }],
  [0x0c, { name: "braille_0c", dots: [3, 4], meaning: "cd" }],
  [0x0d, { name: "braille_0d", dots: [1, 3, 4], meaning: "acd" }],
  [0x0e, { name: "braille_0e", dots: [2, 3, 4], meaning: "bcd" }],
  [0x0f, { name: "braille_0f", dots: [1, 2, 3, 4], meaning: "abcd" }],
  [0x10, { name: "braille_10", dots: [5], meaning: "e" }],
  [0x11, { name: "braille_11", dots: [1, 5], meaning: "ae" }],
  [0x12, { name: "braille_12", dots: [2, 5], meaning: "be" }],
  [0x13, { name: "braille_13", dots: [1, 2, 5], meaning: "abe" }],
  [0x14, { name: "braille_14", dots: [3, 5], meaning: "ce" }],
  [0x15, { name: "braille_15", dots: [1, 3, 5], meaning: "ace" }],
  [0x16, { name: "braille_16", dots: [2, 3, 5], meaning: "bce" }],
  [0x17, { name: "braille_17", dots: [1, 2, 3, 5], meaning: "abce" }],
]);

export function encodeBraille(text) {
  const result = [];
  for (const char of text) {
    const lower = char.toLowerCase();
    const code = lower.charCodeAt(0);
    if (code >= 97 && code <= 122) {
      const idx = code - 97;
      if (BRAILLE_CONTRACTIONS.has(idx)) {
        result.push(patternToUnicode(idx));
      }
    }
  }
  return result;
}

export function decodeBraille(codepoints) {
  const result = [];
  for (const cp of codepoints) {
    const pattern = unicodeToPattern(cp);
    if (pattern !== null && pattern >= 0 && pattern < 64) {
      const info = BRAILLE_CONTRACTIONS.get(pattern);
      if (info && info.meaning !== "empty") {
        result.push(info.meaning);
      }
    }
  }
  return result.join("");
}

export function testBraillePlane() {
  console.log("=== BRAILLE PLANE ENCODER ===\n");

  console.log("Range: U+2800 - U+28FF (256 patterns)");
  console.log("Dot positions: 1-6 (standard Braille)");
  console.log("Patterns: 64 standard + 192 extended");

  console.log("\n--- Grade 1 Contractions ---");
  for (const [pat, info] of BRAILLE_CONTRACTIONS) {
    if (pat < 8) {
      console.log(`  U+${(0x2800 + pat).toString(16).toUpperCase()}: ${info.dots.join(",") || "(empty)"} → ${info.meaning}`);
    }
  }

  console.log("\n--- Text Encoding ---");
  const test = "hello";
  const encoded = encodeBraille(test);
  console.log(`  "${test}" → ${encoded.map(c => "U+" + c.toString(16).toUpperCase()).join(" ")}`);
  
  const decoded = decodeBraille(encoded);
  console.log(`  decoded: ${decoded}`);

  console.log("\n=== Braille Plane Ready ===");
  return { patterns: 256, range: `${0x2800.toString(16)}-${0x28FF.toString(16)}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testBraillePlane();
}