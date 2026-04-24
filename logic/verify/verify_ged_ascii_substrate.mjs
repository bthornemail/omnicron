#!/usr/bin/env node
"use strict";

import fs from "node:fs";
import path from "node:path";
import { buildGedAsciiSubstrateFrame } from "../runtime/ged_ascii_substrate.mjs";
import { evaluateStream } from "../runtime/header8_runtime.mjs";

function parseArgs(argv) {
  const args = {
    vectors: path.resolve("logic/sources/ged_ascii_substrate_vectors.ndjson")
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--vectors" && argv[i + 1]) {
      args.vectors = path.resolve(argv[i + 1]);
      i += 1;
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

function verifyUnaryPrefix(emits) {
  for (let i = 0; i <= 0x1f; i += 1) {
    const want = `CONTROL.UNARY(0x${i.toString(16).toUpperCase().padStart(2, "0")})`;
    if (emits[i] !== want) {
      return `unary emit mismatch at index ${i}: got=${emits[i]} want=${want}`;
    }
  }
  return null;
}

function runVector(v) {
  const built = buildGedAsciiSubstrateFrame(v.mask);
  const wantPass = Boolean(v.expected?.pass);

  if (!built.ok) {
    if (wantPass) {
      fail(`[${v.id}] expected pass but build failed: ${built.error?.code}`);
    }
    const wantCode = v.expected?.error_code;
    const gotCode = built.error?.code || "UNKNOWN";
    assert(wantCode === gotCode, `[${v.id}] expected error_code=${wantCode}, got=${gotCode}`);
    return;
  }

  if (!wantPass) {
    fail(`[${v.id}] expected fail but build succeeded`);
  }

  const evalResult = evaluateStream(built.frame.stream, {
    header_commitment: [0x00, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f],
    preheader_unary_max: 0x1f
  });

  assert(evalResult.pass, `[${v.id}] evaluateStream failed: ${evalResult.error?.code || "UNKNOWN"}`);

  const prefixErr = verifyUnaryPrefix(evalResult.emits);
  assert(!prefixErr, `[${v.id}] ${prefixErr}`);

  const t0 = evalResult.phase_transitions[0];
  const wantTransition = v.expected?.transition_index;
  if (Number.isInteger(wantTransition)) {
    assert(t0 && t0.index === wantTransition, `[${v.id}] expected transition at ${wantTransition}, got ${t0 ? t0.index : "none"}`);
  }

  const mustEmit = Array.isArray(v.expected?.must_emit) ? v.expected.must_emit : [];
  for (const token of mustEmit) {
    assert(evalResult.emits.includes(token), `[${v.id}] missing emit token: ${token}`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const vectors = loadNdjson(args.vectors);
  assert(vectors.length > 0, `No vectors in ${args.vectors}`);

  for (const v of vectors) {
    runVector(v);
  }

  console.log(`OK: GED ASCII substrate verified (${vectors.length} vectors)`);
}

main();
