#!/usr/bin/env node
"use strict";

/**
 * Deterministic dot-notation rewrite surface.
 *
 * This module intentionally does not decide phase policy. It only rewrites
 * token events according to the active phase supplied by header8_runtime.
 */

function hexByte(n) {
  return `0x${(n & 0xff).toString(16).padStart(2, "0").toUpperCase()}`;
}

function isAsciiAtom(b) {
  if (b <= 0x20) return false;
  if (b === 0x28 || b === 0x29 || b === 0x2e) return false;
  if (b >= 0x80) return false;
  return true;
}

export function createRewriteState() {
  return {
    listDepth: 0,
    dotPending: false,
    pairLeft: null,
    lastAtom: null,
    hasLastAtom: false
  };
}

function emitUnary(step) {
  return `CONTROL.UNARY(${hexByte(step.input)})`;
}

function emitStructural(step, st) {
  const b = step.input;

  if (b === 0x20) return "STRUCT.SPACE";

  if (b === 0x28) {
    st.listDepth += 1;
    st.dotPending = false;
    return `STRUCT.LIST-OPEN(depth=${st.listDepth})`;
  }

  if (b === 0x29) {
    const depth = st.listDepth;
    st.listDepth = Math.max(0, st.listDepth - 1);
    st.dotPending = false;
    return `STRUCT.LIST-CLOSE(depth=${depth})`;
  }

  if (b === 0x2e) {
    if (st.hasLastAtom) {
      st.pairLeft = st.lastAtom;
      st.dotPending = true;
      return `STRUCT.DOT(left=${hexByte(st.pairLeft)})`;
    }
    st.dotPending = false;
    return "STRUCT.DOT-DANGLING";
  }

  if (isAsciiAtom(b)) {
    if (st.dotPending) {
      const left = st.pairLeft;
      st.dotPending = false;
      st.lastAtom = b;
      st.hasLastAtom = true;
      return `STRUCT.PAIR(left=${hexByte(left)},right=${hexByte(b)})`;
    }
    st.lastAtom = b;
    st.hasLastAtom = true;
    return `TOKEN.ASCII(${hexByte(b)})`;
  }

  if (b >= 0x80 && b < 0xc0) return `TOKEN.BRAILLE(${hexByte(b)})`;
  if (b >= 0xc0) return `TOKEN.AEGEAN(${hexByte(b)})`;

  return `TOKEN.CONTROL(${hexByte(b)})`;
}

export function rewriteStep(step, rewriteState) {
  if (step.phase === "UNARY") return emitUnary(step);
  return emitStructural(step, rewriteState);
}
