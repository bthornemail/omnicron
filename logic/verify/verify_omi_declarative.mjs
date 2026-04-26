#!/usr/bin/env node
"use strict";

import { evaluateStream, classifyBand, classifyDialect, getBandInfo } from "../runtime/header_ladder_runtime.mjs";
import { cons, car, cdr, consp, nilp, listp, equalGraph, makeList, NIL } from "../runtime/cons_diagram.mjs";
import { createDatalogEngine, parseDatalog, REL_CONS, REL_CAR, REL_CDR, REL_CONSP, REL_NIL, REL_LISTP } from "../runtime/datalog_engine.mjs";

const REPORT_PATH = "logic/generated/omi_tests.ndjson";
const TESTS = [];

function symToString(s) {
  return String(s).slice(7, -1);
}

function test(id, input, fn, expected) {
  let actual;
  let pass = false;
  try {
    actual = fn(input);
    pass = JSON.stringify(actual) === JSON.stringify(expected);
  } catch (e) {
    actual = { error: e.message };
  }
  const result = {
    type: "test",
    id,
    status: pass ? "PASS" : "FAIL",
    expected,
    actual
  };
  TESTS.push(result);
  console.log(`${pass ? "OK" : "FAIL"}: ${id}`);
  return pass;
}

console.log("=== Omi-Lisp Declarative Test Suite ===\n");

console.log("--- Pre-header Unary Stream Tests ---\n");
test("preheader-control-range", [0x00, 0x01, 0x1f], (i) => {
  const r = evaluateStream(i, { precision: "header8" });
  return { phase: r.steps[r.steps.length - 1].phase, steps: r.steps.length };
}, { phase: "UNARY", steps: 3 });

test("preheader-boundary-sp", [0x00, 0x01, 0x2f], (i) => {
  const r = evaluateStream(i, { precision: "header8" });
  return { phase: r.steps[r.steps.length - 1].phase, transitions: r.phase_transitions.length };
}, { phase: "UNARY", transitions: 0 });

test("preheader-boundary-0x2f", [0x00, 0x01, 0x2f], (i) => {
  const r = evaluateStream(i, { precision: "header8" });
  return { phase: r.steps[r.steps.length - 1].phase };
}, { phase: "UNARY" });

test("preheader-0x30-structural", [0x30], (i) => {
  const r = evaluateStream(i, { precision: "header8" });
  return { phase: r.steps[r.steps.length - 1].phase };
}, { phase: "STRUCTURAL" });

console.log("\n--- Structural Boundary Tests ---\n");
test("struct-space", [0x20], (i) => {
  const r = evaluateStream(i, { precision: "header8" });
  return { phase: r.steps[r.steps.length - 1].phase };
}, { phase: "UNARY" });

test("struct-list-open", [0x28], (i) => {
  const r = evaluateStream(i, { precision: "header8" });
  return { phase: r.steps[r.steps.length - 1].phase };
}, { phase: "UNARY" });

test("struct-list-close", [0x29], (i) => {
  const r = evaluateStream(i, { precision: "header8" });
  return { phase: r.steps[r.steps.length - 1].phase };
}, { phase: "UNARY" });

test("struct-dot", [0x2e], (i) => {
  const r = evaluateStream(i, { precision: "header8" });
  return { phase: r.steps[r.steps.length - 1].phase };
}, { phase: "UNARY" });

console.log("\n--- Cons Construction Tests ---\n");
test("cons-make-pair", ["a", "b"], (i) => {
  const cell = cons(Symbol.for(i[0]), Symbol.for(i[1]));
  return { consp: consp(cell), car: symToString(car(cell)), cdr: symToString(cdr(cell)) };
}, { consp: true, car: "a", cdr: "b" });

test("cons-nil", [NIL], (i) => {
  return { nilp: nilp(i[0]) };
}, { nilp: true });

test("cons-list-construction", ["rose", "violet", "buttercup"], (i) => {
  const list = makeList(Symbol.for(i[0]), Symbol.for(i[1]), Symbol.for(i[2]));
  return { consp: consp(list), len: 3 };
}, { consp: true, len: 3 });

test("cons-car", ["rose", "violet"], (i) => {
  const list = makeList(Symbol.for(i[0]), Symbol.for(i[1]));
  const c = car(list);
  return { car: c ? symToString(c) : "nil" };
}, { car: "rose" });

test("cons-cdr", ["rose", "violet"], (i) => {
  const list = makeList(Symbol.for(i[0]), Symbol.for(i[1]));
  const c = cdr(list);
  return { cdr: c && c.type === "cons" ? symToString(c.car) : "nil" };
}, { cdr: "violet" });

test("cons-equal", ["rose", "violet"], (i) => {
  const a = makeList(Symbol.for(i[0]));
  const b = makeList(Symbol.for(i[0]));
  return { equal: equalGraph(a, b) };
}, { equal: true });

console.log("\n--- Datalog Facts Tests ---\n");
test("datalog-add-fact", ["parent", "alice", "bob"], (i) => {
  const engine = createDatalogEngine();
  engine.addFact(i[0], i[1], i[2]);
  const facts = engine.allFacts();
  return { facts: facts[0] };
}, { facts: "parent(alice, bob)." });

test("datalog-query", ["parent", "alice", "_"], (i) => {
  const engine = createDatalogEngine();
  engine.addFact("parent", "alice", "bob");
  engine.addFact("parent", "alice", "carol");
  const pattern = [i[1], i[2]];
  const results = engine.query(i[0], pattern);
  return { count: results.length };
}, { count: 2 });

test("datalog-parse", "parent(a,b).", (i) => {
  const parsed = parseDatalog(i);
  return { type: parsed[0].type, relation: parsed[0].relation };
}, { type: "FACT", relation: "parent" });

console.log("\n--- Derived Rules Tests ---\n");
test("derived-cons-facts", ["c1", "rose", "c2"], (i) => {
  const engine = createDatalogEngine();
  engine.addFact(REL_CONS, i[0], i[1], i[2]);
  engine.addFact(REL_CAR, i[0], i[1]);
  engine.addFact(REL_CDR, i[0], i[2]);
  return { cons: engine.facts.has(REL_CONS), car: engine.facts.has(REL_CAR) };
}, { cons: true, car: true });

console.log("\n--- Character Band Classification ---\n");
test("band-control", [0x00], (i) => {
  const info = getBandInfo(i[0]);
  return { band: info.band, dialect: info.dialect };
}, { band: "control", dialect: "ascii" });

test("band-uppercase", [0x41], (i) => {
  const info = getBandInfo(i[0]);
  return { band: info.band, dialect: info.dialect };
}, { band: "uppercase", dialect: "ascii" });

test("band-lowercase", [0x61], (i) => {
  const info = getBandInfo(i[0]);
  return { band: info.band, dialect: info.dialect };
}, { band: "lowercase", dialect: "ascii" });

test("band-aegean", [0x80], (i) => {
  const info = getBandInfo(i[0]);
  return { band: info.band, dialect: info.dialect };
}, { band: "unknown", dialect: "aegean" });

test("band-braille", [0xc0], (i) => {
  const info = getBandInfo(i[0]);
  return { band: info.band, dialect: info.dialect };
}, { band: "unknown", dialect: "braille" });

console.log("\n--- Multi-Width Equivalence Tests ---\n");
test("width-header8-state", [0x41], (i) => {
  const r = evaluateStream(i, { precision: "header8" });
  return { state: r.steps[0].current_state };
}, { state: 6 });

test("width-header16-state", [0x41], (i) => {
  const r = evaluateStream(i, { precision: "header16" });
  return { state: r.steps[0].current_state };
}, { state: 6 });

test("width-header32-state", [0x41], (i) => {
  const r = evaluateStream(i, { precision: "header32" });
  return { state: r.steps[0].current_state };
}, { state: 6 });

test("width-header256-state", [0x41], (i) => {
  const r = evaluateStream(i, { precision: "header256" });
  return { state: r.steps[0].current_state };
}, { state: 6 });

const passed = TESTS.filter(t => t.status === "PASS").length;
const failed = TESTS.filter(t => t.status === "FAIL").length;

console.log("\n=== Results ===\n");
console.log(`Passed: ${passed}, Failed: ${failed}`);

const fs = await import("fs");
fs.writeFileSync(REPORT_PATH, TESTS.map(t => JSON.stringify(t)).join("\n") + "\n");
console.log(`Report: ${REPORT_PATH}`);

process.exit(failed > 0 ? 1 : 0);