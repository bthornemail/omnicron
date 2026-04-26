#!/usr/bin/env node
"use strict";

import { createDatalogEngine, parseDatalog, REL_CONS, REL_CAR, REL_CDR, REL_CONSP, REL_NIL } from "../runtime/datalog_engine.mjs";

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

console.log("=== Datalog Engine Verification ===\n");

const engine = createDatalogEngine();

engine.addFact("parent", "alice", "bob");
engine.addFact("parent", "alice", "carol");
engine.addFact("parent", "bob", "dave");

if (test("addFact", engine.facts.has("parent"))) passed++; else failed++;
if (test("facts count", engine.facts.get("parent").length === 3)) passed++; else failed++;

engine.addRule("grandparent", ["?x", "?y"], [
  { relation: "parent", args: ["?x", "?z"] },
  { relation: "parent", args: ["?z", "?y"] }
]);

if (test("addRule", engine.rules.length === 1)) passed++; else failed++;

const queryResults = engine.query("parent", ["alice", "_"]);
if (test("query with wildcard", queryResults.length === 2)) passed++; else failed++;

const parsed = parseDatalog(`
parent(a,b).
parent(b,c).
ancestor(x,y) :- parent(x,y).
ancestor(x,z) :- parent(x,y), ancestor(y,z).
`);
if (test("parseDatalog facts", parsed.filter(p => p.type === "FACT").length === 2)) passed++; else failed++;
if (test("parseDatalog rules", parsed.filter(p => p.type === "RULE").length === 2)) passed++; else failed++;

const engine2 = createDatalogEngine();
engine2.addFact(REL_CONS, "c1", "rose", "c2");
engine2.addFact(REL_CONS, "c2", "violet", "nil");
engine2.addFact(REL_CONSP, "c1");
engine2.addFact(REL_CONSP, "c2");
engine2.addFact(REL_CAR, "c1", "rose");
engine2.addFact(REL_CAR, "c2", "violet");
engine2.addFact(REL_CDR, "c1", "c2");
engine2.addFact(REL_CDR, "c2", "nil");

if (test("cons fact", engine2.facts.has(REL_CONS))) passed++; else failed++;
if (test("car fact", engine2.facts.has(REL_CAR))) passed++; else failed++;
if (test("cdr fact", engine2.facts.has(REL_CDR))) passed++; else failed++;

const carQuery = engine2.query(REL_CAR, ["_", "rose"]);
if (test("car query", carQuery[0]?.[0] === "c1")) passed++; else failed++;

const cdrQuery = engine2.query(REL_CDR, ["c1", "_"]);
if (test("cdr query", cdrQuery[0]?.[1] === "c2")) passed++; else failed++;

if (test("allFacts output", engine2.allFacts().length > 0)) passed++; else failed++;

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);