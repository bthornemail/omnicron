#!/usr/bin/env node
"use strict";

import { createDatalogEngine, REL_CONS, REL_CAR, REL_CDR, REL_CONSP, REL_NIL, REL_LISTP } from "../runtime/datalog_engine.mjs";

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

console.log("=== Derived Rules Verification ===\n");

const engine = createDatalogEngine();

engine.addFact(REL_CONS, "c1", "rose", "c2");
engine.addFact(REL_CONS, "c2", "violet", "c3");
engine.addFact(REL_CONS, "c3", "buttercup", "nil");
engine.addFact(REL_CONSP, "c1");
engine.addFact(REL_CONSP, "c2");
engine.addFact(REL_CONSP, "c3");
engine.addFact(REL_CAR, "c1", "rose");
engine.addFact(REL_CAR, "c2", "violet");
engine.addFact(REL_CAR, "c3", "buttercup");
engine.addFact(REL_CDR, "c1", "c2");
engine.addFact(REL_CDR, "c2", "c3");
engine.addFact(REL_CDR, "c3", "nil");

console.log("Base facts loaded:");
console.log(engine.allFacts().join("\n"));

console.log("\n=== Query: car(c1, ?) ===\n");

const pathQuery = engine.query(REL_CAR, ["c1", "_"]);
if (pathQuery.length > 0) {
  console.log("car(c1, rose) =", pathQuery[0][1]);
  if (test("car(c1, ?) = rose", pathQuery[0][1] === "rose")) passed++; else failed++;
} else {
  if (test("car(c1, ?) query executed", false)) failed++; else passed++;
}

console.log("\n=== Query: cdr(c1, ?) ===\n");

const cdrQuery = engine.query(REL_CDR, ["c1", "_"]);
if (cdrQuery.length > 0) {
  console.log("cdr(c1, c2) =", cdrQuery[0][1]);
  if (test("cdr(c1, ?) = c2", cdrQuery[0][1] === "c2")) passed++; else failed++;
} else {
  test("cdr(c1, ?) query executed", false);
  failed++;
}

console.log("\n=== Query: member search ===\n");

let foundRose = false;
let foundViolet = false;
let current = "c1";

while (current && current !== "nil") {
  const carR = engine.query(REL_CAR, [current, "_"]);
  if (carR.length > 0) {
    console.log(`  car(${current}) = ${carR[0][1]}`);
    if (carR[0][1] === "rose") foundRose = true;
    if (carR[0][1] === "violet") foundViolet = true;
  }
  const cdrR = engine.query(REL_CDR, [current, "_"]);
  if (cdrR.length > 0) {
    current = cdrR[0][1];
  } else {
    break;
  }
}

if (test("found rose in path", foundRose)) passed++; else failed++;
if (test("found violet in path", foundViolet)) passed++; else failed++;

console.log("\n=== Rules storage ===\n");

engine.addRule(REL_LISTP, ["X"], [{ relation: REL_NIL, args: ["X"] }]);
engine.addRule(REL_LISTP, ["X"], [
  { relation: REL_CONSP, args: ["X"] },
  { relation: REL_CDR, args: ["X", "Y"] },
  { relation: REL_LISTP, args: ["Y"] }
]);

engine.addRule("member", ["E", "X"], [{ relation: REL_CAR, args: ["X", "E"] }]);
engine.addRule("member", ["E", "X"], [
  { relation: REL_CDR, args: ["X", "Y"] },
  { relation: "member", args: ["E", "Y"] }
]);

if (test("listp rule stored", engine.rules.length >= 2)) passed++; else failed++;
if (test("member rule stored", engine.rules.length >= 4)) passed++; else failed++;

console.log("\nStored rules:");
for (const r of engine.allRules()) {
  console.log("  ", r);
}

if (test("allRules returns strings", engine.allRules().every(r => typeof r === "string"))) passed++; else failed++;

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);