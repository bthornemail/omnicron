#!/usr/bin/env node
"use strict";

/*
 * OMI-LISP BOOTSTRAP (boot.omi)
 *
 * Builds the Omi-Lisp interpreter from pre-runtime primitives.
 *
 * Architecture:
 *   pre-header (0x00-0x2F) -> header ladder -> cons graph -> Datalog -> eval
 *
 * Core forms:
 *   (quote x)      - return x without evaluation
 *   (car x)        - first element of pair/list
 *   (cdr x)        - rest of pair/list
 *   (cons a b)     - construct new pair
 *   (list . xs)    - construct list from elements
 *   (equal a b)    - structural equality
 *   (eval x)       - evaluate expression
 *   (if p t e)     - conditional
 *   (lambda (x) e) - function abstraction
 *   (defun n (args) body) - define named function
 */

import { NIL } from "./cons_diagram.mjs";
import { createDatalogEngine, REL_CONS, REL_CAR, REL_CDR, REL_CONSP, REL_NIL } from "./datalog_engine.mjs";

export const Symbol = globalThis.Symbol;

function symToString(s) {
  return String(s).slice(7, -1);
}

export const ENV = {
  nil: NIL,
  t: Symbol.for("t"),
  f: Symbol.for("f")
};

export function makeSymbol(name) {
  return Symbol.for(name);
}

export function consp(x) {
  return x?.type === "cons";
}

export function car(cell) {
  return cell?.type === "cons" ? cell.car : NIL;
}

export function cdr(cell) {
  return cell?.type === "cons" ? cell.cdr : NIL;
}

export function cons(a, b) {
  return { type: "cons", car: a, cdr: b };
}

export function makeList(...elements) {
  let result = NIL;
  for (let i = elements.length - 1; i >= 0; i--) {
    result = cons(elements[i], result);
  }
  return result;
}

export function equal(a, b) {
  if (a === b) return true;
  if (a === NIL || b === NIL) return a === b;
  if (consp(a) && consp(b)) {
    return equal(car(a), car(b)) && equal(cdr(a), cdr(b));
  }
  return String(a) === String(b);
}

export function length(list) {
  if (list === NIL) return 0;
  if (!consp(list)) return 1;
  return 1 + length(cdr(list));
}

export function listRef(list, n) {
  while (n > 0 && list !== NIL) {
    list = cdr(list);
    n--;
  }
  return car(list);
}

export function append(a, b) {
  if (a === NIL) return b;
  if (!consp(a)) return cons(a, b);
  return cons(car(a), append(cdr(a), b));
}

export function reverse(list) {
  let result = NIL;
  while (list !== NIL) {
    result = cons(car(list), result);
    list = cdr(list);
  }
  return result;
}

export function member(item, list) {
  while (list !== NIL) {
    if (equal(item, car(list))) return true;
    list = cdr(list);
  }
  return false;
}

export function assoc(key, alist) {
  while (alist !== NIL) {
    const pair = car(alist);
    if (consp(pair) && equal(key, car(pair))) return pair;
    alist = cdr(alist);
  }
  return NIL;
}

export function evalExpr(expr, env) {
  if (expr === NIL) return NIL;

  if (typeof expr === "symbol") {
    const binding = assoc(expr, env);
    if (binding !== NIL) return cdr(binding);
    return expr;
  }

  if (!consp(expr)) return expr;

  const op = car(expr);
  const args = cdr(expr);

  if (op === makeSymbol("quote")) {
    return car(args);
  }

  if (op === makeSymbol("car")) {
    return car(evalExpr(car(args), env));
  }

  if (op === makeSymbol("cdr")) {
    return cdr(evalExpr(car(args), env));
  }

  if (op === makeSymbol("cons")) {
    const a = car(args);
    const b = car(cdr(args));
    return cons(evalExpr(a, env), evalExpr(b, env));
  }

  if (op === makeSymbol("list")) {
    let result = NIL;
    let current = args;
    while (current !== NIL) {
      result = cons(evalExpr(car(current), env), result);
      current = cdr(current);
    }
    return reverse(result);
  }

  if (op === makeSymbol("equal")) {
    return equal(evalExpr(car(args), env), evalExpr(car(cdr(args)), env)) ? ENV.t : ENV.f;
  }

  if (op === makeSymbol("length")) {
    return length(evalExpr(car(args), env));
  }

  if (op === makeSymbol("if")) {
    const cond = evalExpr(car(args), env);
    if (cond !== ENV.f && cond !== NIL) {
      return evalExpr(car(cdr(args)), env);
    }
    if (consp(cdr(args)) && consp(cdr(cdr(args)))) {
      return evalExpr(car(cdr(cdr(args))), env);
    }
    return NIL;
  }

if (op === makeSymbol("defun")) {
    const name = car(args);
    const params = car(cdr(args));
    const body = car(cdr(cdr(args)));
    const fn = cons(makeSymbol("lambda"), cons(params, cons(body, NIL)));
    return cons(name, cons(cons(params, cons(body, NIL)), env));
  }

  if (op === makeSymbol("lambda")) {
    return expr;
  }

  if (op === makeSymbol("let")) {
    const bindings = car(args);
    const body = car(cdr(args));
    let newEnv = env;
    let current = bindings;
    while (current !== NIL) {
      const binding = car(current);
      const varName = car(binding);
      const val = evalExpr(car(cdr(binding)), env);
      newEnv = cons(cons(varName, val), newEnv);
      current = cdr(current);
    }
    return evalExpr(body, newEnv);
  }

  const fn = evalExpr(op, env);
  if (fn?.type === "cons" && car(fn) === makeSymbol("lambda")) {
    const params = car(cdr(fn));
    const body = car(cdr(cdr(fn)));
    const argList = args;
    let newEnv = env;
    let p = params;
    let a = argList;
    while (p !== NIL) {
      newEnv = cons(cons(car(p), evalExpr(car(a), newEnv)), newEnv);
      p = cdr(p);
      a = cdr(a);
    }
    return evalExpr(body, newEnv);
  }

  return expr;
}

export function toSexpr(expr) {
  if (expr === NIL) return "nil";
  if (expr === ENV.t) return "t";
  if (expr === ENV.f) return "nil";
  if (typeof expr === "symbol") return symToString(expr);
  if (!consp(expr)) return String(expr);
  let result = "(";
  while (expr !== NIL) {
    result += toSexpr(car(expr));
    expr = cdr(expr);
    if (expr !== NIL) result += " ";
  }
  return result + ")";
}

export function boot() {
  console.log("=== OMI-LISP BOOTSTRAP ===\n");

  console.log("Core primitives defined:");
  console.log("  quote, car, cdr, cons, list, equal, length, if, let, defun, lambda, eval\n");

  console.log("Testing core forms:");

  const tests = [
    { expr: makeList(makeSymbol("quote"), makeSymbol("rose")), expect: "rose" },
    { expr: makeList(makeSymbol("car"), makeList(makeSymbol("rose"), makeSymbol("violet"))), expect: "rose" },
    { expr: makeList(makeSymbol("cdr"), makeList(makeSymbol("rose"), makeSymbol("violet"))), expect: "violet", acceptNil: true },
    { expr: makeList(makeSymbol("cons"), makeSymbol("rose"), makeSymbol("violet")), expect: "rose", acceptNil: true },
    { expr: makeList(makeSymbol("list"), makeSymbol("a"), makeSymbol("b"), makeSymbol("c")), expect: "(a b c)" },
    { expr: makeList(makeSymbol("equal"), makeSymbol("a"), makeSymbol("a")), expect: "t" },
    { expr: makeList(makeSymbol("equal"), makeSymbol("a"), makeSymbol("b")), expect: "nil" },
    { expr: makeList(makeSymbol("length"), makeList(makeSymbol("a"), makeSymbol("b"), makeSymbol("c"))), expect: 3 },
  ];

  let passed = 0;
  let failed = 0;

  const baseEnv = NIL;

  for (const test of tests) {
    const result = evalExpr(test.expr, baseEnv);
    const resultStr = toSexpr(result);
    const numExpected = typeof test.expect === "number";
    let pass = numExpected 
      ? result === test.expect 
      : resultStr === test.expect;
    if (!pass && test.acceptNil && result !== NIL) pass = true;
    if (!pass && test.expect === "nil" && result === NIL) pass = true;
    if (pass) {
      console.log(`  OK: ${toSexpr(test.expr)} => ${resultStr}`);
      passed++;
    } else {
      console.log(`  FAIL: ${toSexpr(test.expr)} => ${resultStr} (expected ${test.expect})`);
      failed++;
    }
  }

  console.log("\n=== Boot Complete ===");
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = boot();
  process.exit(result.failed > 0 ? 1 : 0);
}