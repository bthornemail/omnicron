#!/usr/bin/env node
"use strict";

import fs from "node:fs";
import path from "node:path";
import { evaluateStream } from "../runtime/header8_runtime.mjs";

function parseArgs(argv) {
  const args = {
    vectors: path.resolve("logic/sources/preheader_congruence_vectors.ndjson"),
    parityFixtures: path.resolve("third_party/omi-lisp/fixtures/sample_streams.ndjson")
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--vectors" && argv[i + 1]) {
      args.vectors = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (argv[i] === "--parity-fixtures" && argv[i + 1]) {
      args.parityFixtures = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (argv[i] === "--no-parity") {
      args.parityFixtures = null;
      continue;
    }
  }
  return args;
}

function loadNdjson(file) {
  const raw = fs.readFileSync(file, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => JSON.parse(line));
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) fail(msg);
}

function sameTransitions(actual, expected) {
  if (!expected) return true;
  const simplify = (xs) => xs.map((x) => ({ index: x.index, from: x.from, to: x.to }));
  return JSON.stringify(simplify(actual)) === JSON.stringify(simplify(expected));
}

function runVectorContract(vectorsPath) {
  const vectors = loadNdjson(vectorsPath);
  assert(vectors.length > 0, `No vectors found in ${vectorsPath}`);

  let passed = 0;
  for (const v of vectors) {
    const result = evaluateStream(v.stream, { header_commitment: v.header_commitment });
    const wantPass = Boolean(v.expected && v.expected.pass);

    if (wantPass !== result.pass) {
      fail(`[${v.id}] expected pass=${wantPass} but got pass=${result.pass} (${result.error ? result.error.code : "NO_ERROR"})`);
    }

    if (!wantPass) {
      const wantCode = v.expected.error_code;
      const gotCode = result.error ? result.error.code : null;
      assert(wantCode === gotCode, `[${v.id}] expected error_code=${wantCode}, got=${gotCode}`);
    }

    if (wantPass && v.expected.phase_transitions) {
      assert(
        sameTransitions(result.phase_transitions, v.expected.phase_transitions),
        `[${v.id}] phase transitions mismatch; expected=${JSON.stringify(v.expected.phase_transitions)} got=${JSON.stringify(result.phase_transitions)}`
      );
    }
    passed += 1;
  }
  return passed;
}

function runParityFixture(parityPath) {
  if (!parityPath) return 0;
  if (!fs.existsSync(parityPath)) return 0;

  const fixtures = loadNdjson(parityPath);
  let passed = 0;
  for (const f of fixtures) {
    const result = evaluateStream(f.stream, {
      header_commitment: f.header_commitment || [0, 27, 28, 29, 30, 31]
    });
    assert(result.pass, `[PARITY:${f.id}] stream failed unexpectedly: ${result.error ? result.error.code : "UNKNOWN"}`);
    assert(
      JSON.stringify(result.emits) === JSON.stringify(f.expected_emits),
      `[PARITY:${f.id}] emit mismatch; expected=${JSON.stringify(f.expected_emits)} got=${JSON.stringify(result.emits)}`
    );
    passed += 1;
  }
  return passed;
}

function main() {
  const args = parseArgs(process.argv);
  const contractCount = runVectorContract(args.vectors);
  const parityCount = runParityFixture(args.parityFixtures);
  console.log(`OK: pre-header congruence verified (${contractCount} vectors, ${parityCount} parity fixtures)`);
}

main();
