#!/usr/bin/env node
"use strict";

const NIL_SYM = Symbol.for("nil");
export { NIL_SYM };

const REL_ATOM = "atom";
const REL_CONS = "cons";
const REL_CAR = "car";
const REL_CDR = "cdr";
const REL_NIL = "nil";
const REL_CONSP = "consp";
const REL_LISTP = "listp";
export { REL_ATOM, REL_CONS, REL_CAR, REL_CDR, REL_NIL, REL_CONSP, REL_LISTP };

class DatalogEngine {
  constructor() {
    this.facts = new Map();
    this.rules = [];
    this.idCounter = 0;
  }

  freshId() {
    this.idCounter += 1;
    return `c${this.idCounter}`;
  }

  termToString(term) {
    if (term === NIL_SYM) return "nil";
    if (typeof term === "symbol") return String(term).slice(7, -1);
    if (typeof term === "number") return String(term);
    if (typeof term === "string") return term;
    return String(term);
  }

  addFact(relation, ...args) {
    const key = relation;
    if (!this.facts.has(key)) this.facts.set(key, []);
    this.facts.get(key).push(args.map(t => this.termToString(t)));
    return { relation, args };
  }

  addRule(headRelation, headArgs, bodyGoals) {
    this.rules.push({
      head: { relation: headRelation, args: headArgs },
      body: bodyGoals
    });
    return { head: headRelation, body: bodyGoals };
  }

  query(relation, pattern) {
    const matching = this.facts.get(relation) || [];
    if (!pattern) return matching;

    return matching.filter(factArgs => {
      for (let i = 0; i < pattern.length; i++) {
        const pat = pattern[i];
        if (pat === "_") continue;
        if (pat === "?") continue;
        if (pat !== factArgs[i]) return false;
      }
      return true;
    });
  }

  allFacts() {
    const out = [];
    for (const [rel, argsList] of this.facts) {
      for (const args of argsList) {
        out.push(`${rel}(${args.join(", ")}).`);
      }
    }
    return out;
  }

  allRules() {
    return this.rules.map(rule => {
      const headArgs = rule.head.args.join(", ");
      const bodyArgs = rule.body.map(g => `${g.relation}(${g.args.join(", ")})`).join(", ");
      return `${rule.head.relation}(${headArgs}):-${bodyArgs}.`;
    });
  }

  clear() {
    this.facts.clear();
    this.rules.length = 0;
    this.idCounter = 0;
  }
}

export function createDatalogEngine() {
  return new DatalogEngine();
}

export function termToString(term) {
  if (term === NIL_SYM) return "nil";
  if (typeof term === "symbol") return String(term).slice(7, -1);
  if (typeof term === "number") return String(term);
  return String(term);
}

export function consToFacts(engine, cell, id = null) {
  const cellId = id || engine.freshId();

  if (cell === NIL_SYM) {
    engine.addFact(REL_NIL, cellId);
    return { id: cellId, isNil: true };
  }

  if (typeof cell === "object" && cell?.type === "cons") {
    const carId = typeof cell.car === "object" && cell.car?.type === "cons"
      ? consToFacts(engine, cell.car).id
      : termToString(cell.car);

    const cdrId = typeof cell.cdr === "object" && cell.cdr?.type === "cons"
      ? consToFacts(engine, cell.cdr).id
      : (cell.cdr === NIL_SYM ? "nil" : termToString(cell.cdr));

    engine.addFact(REL_CONS, cellId, carId, cdrId);
    engine.addFact(REL_CONSP, cellId);
    engine.addFact(REL_CAR, cellId, carId);
    engine.addFact(REL_CDR, cellId, cdrId);

    return { id: cellId, car: carId, cdr: cdrId };
  }

  return { id: cellId };
}

export function makeFactsFromList(engine, list) {
  if (list === NIL_SYM || list === null) {
    return { id: "nil", isNil: true };
  }

  if (typeof list !== "object" || list.type !== "cons") {
    return { id: termToString(list), isAtom: true };
  }

  let current = list;
  let firstId = null;
  let prevId = null;

  while (current && typeof current === "object" && current.type === "cons") {
    const carVal = typeof current.car === "object" && current.car?.type === "cons"
      ? makeFactsFromList(engine, current.car).id
      : (current.car === NIL_SYM ? "nil" : termToString(current.car));

    const cdrVal = typeof current.cdr === "object" && current.cdr?.type === "cons"
      ? null
      : (current.cdr === NIL_SYM ? "nil" : termToString(current.cdr));

    const id = engine.freshId();

    if (!firstId) firstId = id;
    if (prevId) {
      engine.addFact(REL_CDR, prevId, id);
    }

    engine.addFact(REL_CONS, id, carVal, cdrVal || "nil");
    engine.addFact(REL_CAR, id, carVal);

    if (cdrVal) {
      engine.addFact(REL_CDR, id, cdrVal);
      break;
    }

    prevId = id;
    current = current.cdr;
  }

  return { id: firstId };
}

export function parseDatalog(text) {
  const statements = [];
  const lines = text.split("\n").filter(l => l.trim() && !l.trim().startsWith("%"));

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.endsWith(".")) {
      if (trimmed.includes(":-")) {
        const colonDash = trimmed.indexOf(":-");
        const head = trimmed.slice(0, colonDash).trim();
        const body = trimmed.slice(colonDash + 2, -1).trim();

        const headMatch = head.match(/^(\w+)\(([^)]+)\)$/);
        const bodyGoals = body.split(",").map(g => g.trim()).filter(g => g);

        if (headMatch) {
          statements.push({
            type: "RULE",
            headRelation: headMatch[1],
            headArgs: headMatch[2].split(",").map(a => a.trim()),
            bodyGoals
          });
        }
      } else {
        const match = trimmed.match(/^(\w+)\(([^)]+)\)\.$/);
        if (match) {
          statements.push({
            type: "FACT",
            relation: match[1],
            args: match[2].split(",").map(a => a.trim())
          });
        }
      }
    } else if (trimmed.endsWith("?")) {
      const q = trimmed.slice(0, -1).trim();
      const match = q.match(/^(\w+)\(([^)]+)\)$/);
      if (match) {
        statements.push({
          type: "QUERY",
          relation: match[1],
          args: match[2].split(",").map(a => a.trim())
        });
      }
    }
  }

  return statements;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("=== Minimal Datalog Tests ===\n");

  const engine = createDatalogEngine();

  engine.addFact("parent", "alice", "bob");
  engine.addFact("parent", "alice", "carol");
  engine.addFact("parent", "bob", "dave");

  console.log("Facts:");
  console.log(engine.allFacts().join("\n"));

  console.log("\nQuery parent(alice, _):");
  console.log(engine.query("parent", ["alice", "_"]));

  console.log("\nAdd rule:");
  engine.addRule("grandparent", ["?x", "?y"], [
    { relation: "parent", args: ["?x", "?z"] },
    { relation: "parent", args: ["?z", "?y"] }
  ]);
  console.log(engine.allRules().join("\n"));

  console.log("\nQuery grandparent(alice, X):");
  const gpResults = engine.query("parent", ["alice", "_"]);
  for (const r of gpResults) {
    const grandchild = engine.query("parent", [r[1], "_"]);
    console.log(`  alice -> ${r[1]} -> ${grandchild[0]?.[1]}`);
  }

  console.log("\n=== Cons to Facts Demo ===\n");

  console.log("Cons facts would map cons cells to relations:");
  console.log("  cons(cell1, rose, cell2).");
  console.log("  cons(cell2, violet, cell3).");
  console.log("  cons(cell3, buttercup, nil).");
  console.log("  car(cell1, rose).");
  console.log("  cdr(cell1, cell2).");

  console.log("\n=== Parse Datalog Text ===\n");

  const text = `
parent(a,b).
parent(b,c).
grandparent(x,y) :- parent(x,z), parent(z,y).
grandparent(a,?).
  `.trim();

  const parsed = parseDatalog(text);
  console.log("Parsed statements:", parsed.length);
  for (const s of parsed) {
    console.log(`  ${s.type}: ${s.relation || s.headRelation}`);
  }

  console.log("\n=== All tests complete ===");
}