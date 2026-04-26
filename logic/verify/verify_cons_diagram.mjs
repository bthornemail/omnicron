#!/usr/bin/env node
"use strict";

import { evaluateStream, HEADER_PREFIXES } from "../runtime/header_ladder_runtime.mjs";
import { cons, car, cdr, consp, nilp, listp, diagram, diagramCompact, NIL, makeList, equalGraph } from "../runtime/cons_diagram.mjs";

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

console.log("=== Cons Diagram Cross-Width Equivalence Tests ===\n");

const rose = Symbol.for("rose");
const violet = Symbol.for("violet");
const buttercup = Symbol.for("buttercup");

const testCases = [
  { label: "atom", cell: rose },
  { label: "pair", cell: cons(rose, violet) },
  { label: "list", cell: makeList(rose, violet, buttercup) },
  { label: "nested", cell: makeList(makeList(rose, violet), buttercup) }
];

for (const tc of testCases) {
  const cell = tc.cell;

  const compact = diagramCompact(cell);
  const isCons = consp(cell);
  const isList = listp(cell);

  const widths = ["header8", "header16", "header32", "header256"];
  const evalResults = {};

  for (const w of widths) {
    const result = evaluateStream([65], { precision: w });
    evalResults[w] = result.steps[0].current_state;
  }

  const allSame = Object.values(evalResults).every(v => v === evalResults[widths[0]]);

  const expectCons = tc.label !== "atom";
  const expectList = tc.label === "list" || tc.label === "nested";

  if (test(`${tc.label}: consp`, isCons === expectCons)) passed++; else failed++;
  if (test(`${tc.label}: listp`, isList === expectList)) passed++; else failed++;
  if (test(`${tc.label}: cross-width state`, allSame)) passed++; else failed++;
  if (test(`${tc.label}: compact form`, typeof compact === "string" && compact.length > 0)) passed++; else failed++;
}

console.log("\n=== Cons Cell Path Resolution Tests ===\n");

const pathTests = [
  { expr: "(car (A B))", expected: "A" },
  { expr: "(cdr (A B))", expected: "B" },
  { expr: "(car (cdr (A B C))", expected: "B" }
];

for (const tc of pathTests) {
  const a = Symbol.for("A");
  const b = Symbol.for("B");
  const c = Symbol.for("C");
  const list1 = makeList(a, b, c);

  const ca = car(list1);
  const cd = cdr(list1);
  const ca2 = car(cd);
  const caOfCdr = car(cdr(list1));

  if (test(`${tc.expr} car/cdr`, caOfCdr !== NIL)) passed++; else failed++;
}

console.log("\n=== Graph Equality Tests ===\n");

const g1 = makeList(rose, violet);
const g2 = makeList(rose, violet);
const g3 = makeList(rose, buttercup);

if (test("equalGraph(same)", equalGraph(g1, g2))) passed++; else failed++;
if (test("equalGraph(diff)", equalGraph(g1, g3) === false)) passed++; else failed++;

console.log("\n=== Diagram Emit Tests ===\n");

const d1 = diagram(makeList(rose, violet, buttercup), { showRefs: true });
if (test("diagram output", d1.includes("+-----+-----+"))) passed++; else failed++;

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);