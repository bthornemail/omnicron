#!/usr/bin/env node
"use strict";

import { evaluateStream, getPrecisionInfo, HEADER_PREFIXES, HEADER_SIZES } from "../runtime/header_ladder_runtime.mjs";

const HEADER8_PREFIX = [0x00, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f];

function test(name, pass, details = null) {
  if (pass) {
    console.log(`OK: ${name}`);
    return true;
  }
  console.log(`FAIL: ${name}`);
  if (details) console.log(`  -> ${details}`);
  return false;
}

let passed = 0;
let failed = 0;

const info = getPrecisionInfo("header8");
if (test("header8 precision info", info.precision === "header8" && info.width === 8)) passed++; else failed++;
if (test("header8 prefix length", info.prefix_length === 6)) passed++; else failed++;

const info16 = getPrecisionInfo("header16");
if (test("header16 precision info", info16.precision === "header16" && info16.width === 16)) passed++; else failed++;
if (test("header16 prefix length", info16.prefix_length === 16)) passed++; else failed++;

const info32 = getPrecisionInfo("header32");
if (test("header32 precision info", info32.precision === "header32" && info32.width === 32)) passed++; else failed++;
if (test("header32 prefix length", info32.prefix_length === 32)) passed++; else failed++;

const info256 = getPrecisionInfo("header256");
if (test("header256 precision info", info256.precision === "header256" && info256.width === 32)) passed++; else failed++;
if (test("header256 prefix length", info256.prefix_length === 48)) passed++; else failed++;

const stream8 = evaluateStream([0x01, 0x02, 0x03], { precision: "header8" });
if (test("header8 basic stream", stream8.pass && stream8.precision === "header8")) passed++; else failed++;
let t = stream8.emits[0].startsWith("CONTROL.UNARY");
if (test("header8 emits UNARY phase", t)) passed++; else failed++;

const stream16 = evaluateStream([0x01, 0x02, 0x03], { precision: "header16" });
if (test("header16 basic stream", stream16.pass && stream16.precision === "header16")) passed++; else failed++;

const stream32 = evaluateStream([0x01, 0x02, 0x03], { precision: "header32" });
if (test("header32 basic stream", stream32.pass && stream32.precision === "header32")) passed++; else failed++;

const streamTransition = evaluateStream([0x01, 0x02, 0x03, 0x30, 0x28, 0x29], { precision: "header8" });
let t0 = streamTransition.phase_transitions.length === 1;
if (test("UNARY->STRUCTURAL transition", t0)) passed++; else failed++;
let t1 = streamTransition.phase_transitions[0].trigger === "0x30";
if (test("transition at 0x30", t1)) passed++; else failed++;

const streamEmit = evaluateStream([0x01, 0x02, 0x03, 0x30, 0x2e, 0x41, 0x42], { precision: "header8" });
let te0 = streamEmit.emits[0].startsWith("CONTROL.UNARY");
let te1 = streamEmit.emits[3].startsWith("TOKEN.ASCII");
if (test("stream emits control then struct", te0 && te1)) passed++; else failed++;

const streamDot = evaluateStream([0x01, 0x02, 0x03, 0x41, 0x2e, 0x42], { precision: "header8" });
if (test("dot pair emission",
    streamDot.emits.some(e => e.startsWith("STRUCT.PAIR")))) passed++; else failed++;

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);