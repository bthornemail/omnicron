#!/usr/bin/env node
"use strict";

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    vectors: path.resolve("logic/sources/endian_compatibility_vectors.ndjson")
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--vectors" && argv[i + 1]) {
      args.vectors = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
  }
  return args;
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) fail(msg);
}

function loadNdjson(file) {
  const raw = fs.readFileSync(file, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => JSON.parse(line));
}

function parseHexBigInt(hex) {
  if (typeof hex !== "string" || !/^0x[0-9A-Fa-f]+$/.test(hex)) {
    throw new Error(`Invalid hex literal: ${hex}`);
  }
  return BigInt(hex);
}

function toHex(n, widthBits) {
  const widthNibbles = widthBits / 4;
  return `0x${n.toString(16).toUpperCase().padStart(widthNibbles, "0")}`;
}

function maskForWidth(widthBits) {
  return (1n << BigInt(widthBits)) - 1n;
}

function encodeBytes(value, widthBits, order) {
  const count = widthBits / 8;
  const bytes = new Array(count);
  let v = value & maskForWidth(widthBits);
  for (let i = 0; i < count; i += 1) {
    const b = Number(v & 0xffn);
    if (order === "LE") {
      bytes[i] = b;
    } else {
      bytes[count - 1 - i] = b;
    }
    v >>= 8n;
  }
  return bytes;
}

function decodeBytes(bytes, order) {
  let v = 0n;
  if (order === "LE") {
    for (let i = bytes.length - 1; i >= 0; i -= 1) {
      v = (v << 8n) | BigInt(bytes[i] & 0xff);
    }
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      v = (v << 8n) | BigInt(bytes[i] & 0xff);
    }
  }
  return v;
}

function byteSwap(value, widthBits) {
  const be = encodeBytes(value, widthBits, "BE");
  const le = [...be].reverse();
  return decodeBytes(le, "BE");
}

function sameBytes(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function main() {
  const args = parseArgs(process.argv);
  const vectors = loadNdjson(args.vectors);
  assert(vectors.length > 0, `No vectors found in ${args.vectors}`);

  for (const v of vectors) {
    assert([8, 16, 32, 64].includes(v.width_bits), `[${v.id}] unsupported width_bits=${v.width_bits}`);
    assert(v.order === "BE" || v.order === "LE", `[${v.id}] unsupported order=${v.order}`);

    const value = parseHexBigInt(v.value_hex) & maskForWidth(v.width_bits);
    const encoded = encodeBytes(value, v.width_bits, v.order);
    assert(
      sameBytes(encoded, v.expected_bytes),
      `[${v.id}] byte encoding mismatch: expected=${JSON.stringify(v.expected_bytes)} got=${JSON.stringify(encoded)}`
    );

    const decoded = decodeBytes(encoded, v.order);
    assert(
      decoded === value,
      `[${v.id}] roundtrip mismatch: expected=${toHex(value, v.width_bits)} got=${toHex(decoded, v.width_bits)}`
    );

    if (typeof v.expected_swap_hex === "string") {
      const expectedSwap = parseHexBigInt(v.expected_swap_hex) & maskForWidth(v.width_bits);
      const swapped = byteSwap(value, v.width_bits);
      assert(
        swapped === expectedSwap,
        `[${v.id}] byte-swap mismatch: expected=${toHex(expectedSwap, v.width_bits)} got=${toHex(swapped, v.width_bits)}`
      );
    }

    if (v.expect_cross_decode_unequal) {
      const opposite = v.order === "BE" ? "LE" : "BE";
      const crossDecoded = decodeBytes(encoded, opposite);
      assert(
        crossDecoded !== value,
        `[${v.id}] expected opposite-endian decode to differ, but got equal value=${toHex(value, v.width_bits)}`
      );
    }
  }

  console.log(`OK: endian compatibility verified (${vectors.length} vectors)`);
}

main();
