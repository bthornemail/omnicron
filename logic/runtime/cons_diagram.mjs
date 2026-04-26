#!/usr/bin/env node
"use strict";

export const NIL = Symbol.for("nil");
export const EMPTY = null;

export function cons(car, cdr) {
  return { type: "cons", car, cdr };
}

export function car(cell) {
  return cell?.type === "cons" ? cell.car : NIL;
}

export function cdr(cell) {
  return cell?.type === "cons" ? cell.cdr : NIL;
}

export function consp(x) {
  return x?.type === "cons";
}

export function nilp(x) {
  return x === NIL || x === EMPTY || x === null;
}

export function listp(x) {
  if (nilp(x)) return true;
  return consp(x) && listp(cdr(x));
}

export function atom(x) {
  return !consp(x) && !nilp(x);
}

export function length(list) {
  if (nilp(list)) return 0;
  if (!consp(list)) return 1;
  return 1 + length(cdr(list));
}

export function getCellId(cell, seen) {
  if (nilp(cell)) return "nil";
  if (atom(cell)) return `atom:${cell}`;
  if (!seen.has(cell)) seen.set(cell, seen.size + 1);
  return `cell:${seen.get(cell)}`;
}

export function diagram(x, options = {}) {
  const indent = options.indent || "  ";
  const showRefs = options.showRefs !== false;
  const seen = new Map();
  const lines = [];

  function draw(cell, depth = 0) {
    const prefix = indent.repeat(depth);

    if (nilp(cell)) {
      lines.push(`${prefix}nil`);
      return;
    }

    if (atom(cell)) {
      lines.push(`${prefix}${String(cell)}`);
      return;
    }

    if (!consp(cell)) {
      lines.push(`${prefix}?${typeof cell}:${cell}`);
      return;
    }

    if (seen.has(cell)) {
      lines.push(`${prefix}[${getCellId(cell, seen)} (ref)]`);
      return;
    }

    const carVal = cell.car;
    const cdrVal = cell.cdr;

    seen.set(cell, seen.size + 1);

    lines.push(`${prefix}+-----+-----+`);
    lines.push(`${prefix}| car | cdr |`);
    lines.push(`${prefix}| ${String(carVal).padEnd(4)} | ${String(cdrVal).padEnd(4)} |`);
    lines.push(`${prefix}+-----+-----+`);

    if (showRefs && !nilp(cdrVal) && consp(cdrVal)) {
      if (!seen.has(cdrVal)) {
        lines.push(`${prefix}  |`);
        lines.push(`${prefix}  v`);
        draw(cdrVal, depth + 1);
      }
    }
  }

  draw(x, 0);
  return lines.join("\n");
}

export function diagramCompact(x) {
  if (nilp(x)) return "()";

  const parts = [];
  let current = x;

  while (consp(current)) {
    const val = car(current);
    parts.push(atom(val) ? String(val) : "#");
    current = cdr(current);
  }

  if (!nilp(current)) {
    parts.push(".");
    parts.push(atom(current) ? String(current) : "#");
  }

  return `(${parts.join(" ")})`;
}

export function diagramToJson(x) {
  const seen = new Map();

  function toJson(cell, depth = 0) {
    if (depth > 100) return { error: "recursion limit" };
    if (nilp(cell)) return { type: "nil" };
    if (atom(cell)) return { type: "atom", value: String(cell) };
    if (!consp(cell)) return { type: "unknown" };

    const id = getCellId(cell, seen);
    if (seen.has(cell) && seen.get(cell) < seen.size) return { type: "ref", id };

    seen.set(cell, seen.size);

    return {
      type: "cons",
      id,
      car: toJson(cell.car, depth + 1),
      cdr: toJson(cell.cdr, depth + 1)
    };
  }

  return toJson(x);
}

export function makeList(...elements) {
  let result = NIL;
  for (let i = elements.length - 1; i >= 0; i--) {
    result = cons(elements[i], result);
  }
  return result;
}

export function makeDotNotation(car, cdr) {
  return cons(car, cdr);
}

export function equalGraph(a, b) {
  if (a === b) return true;
  if (nilp(a) && nilp(b)) return true;
  if (nilp(a) || nilp(b)) return false;
  if (!consp(a) || !consp(b)) return false;

  const aCar = car(a);
  const bCar = car(b);
  const aCdr = cdr(a);
  const bCdr = cdr(b);

  if (!equalGraph(aCar, bCar)) return false;
  if (!equalGraph(aCdr, bCdr)) return false;

  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("=== Cons Cell Box Diagram Tests ===\n");

  const rose = Symbol.for("rose");
  const violet = Symbol.for("violet");
  const buttercup = Symbol.for("buttercup");

  const list1 = makeList(rose, violet, buttercup);

  console.log("1. Simple list (rose violet buttercup):\n");
  console.log(diagram(list1));
  console.log("\n2. Compact form:", diagramCompact(list1));

  console.log("\n---\n");

  const a = Symbol.for("A");
  const b = cons(a, NIL);

  console.log("6. List (A):\n");
  console.log(diagram(b));
  console.log("\n7. Compact form:", diagramCompact(b));

  console.log("\n8. consp tests:");
  console.log("  consp(cons(A, NIL)):", consp(b));
  console.log("  consp(nil):", consp(NIL));
  console.log("  consp(atom):", consp(rose));
  console.log("  listp((a b c)):", listp(list1));

  const list2 = makeList(Symbol.for("A"), NIL);
  console.log("  equalGraph((A), (A)):", equalGraph(list2, b));

  console.log("\n=== All tests complete ===");
}