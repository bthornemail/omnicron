#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const EXPECTED_SURFACES = ["prolog", "datalog", "s_expr", "m_expr", "f_expr"];

function sha256Hex(s) {
  return createHash("sha256").update(s).digest("hex");
}

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function loadRecords(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      try {
        return JSON.parse(l);
      } catch (err) {
        throw new Error(`Invalid NDJSON at line ${i + 1}: ${err.message}`);
      }
    });
}

function isNameStart(c) {
  return /[A-Za-z_]/.test(c);
}
function isNameChar(c) {
  return /[A-Za-z0-9_]/.test(c);
}

function parseName(input, iRef) {
  let i = iRef.i;
  if (!isNameStart(input[i] || "")) return "";
  let s = "";
  while (i < input.length && isNameChar(input[i])) {
    s += input[i];
    i += 1;
  }
  iRef.i = i;
  return s;
}

function skipWs(input, iRef) {
  while (iRef.i < input.length && /\s/.test(input[iRef.i])) iRef.i += 1;
}

function parseNumber(input, iRef) {
  let i = iRef.i;
  let s = "";
  if (input[i] === "-") {
    s += "-";
    i += 1;
  }
  let has = false;
  while (i < input.length && /[0-9]/.test(input[i])) {
    s += input[i];
    i += 1;
    has = true;
  }
  if (!has) return "";
  iRef.i = i;
  return s;
}

function listToPairs(items) {
  let out = { t: "nil" };
  for (let i = items.length - 1; i >= 0; i -= 1) {
    out = { t: "pair", car: items[i], cdr: out };
  }
  return out;
}

function app(funName, args) {
  return listToPairs([{ t: "atom", v: funName }, ...args]);
}

function parseSExpr(input) {
  const iRef = { i: 0 };
  function parseExpr() {
    skipWs(input, iRef);
    if (input[iRef.i] === "(") {
      iRef.i += 1;
      skipWs(input, iRef);
      if (input[iRef.i] === ")") {
        iRef.i += 1;
        return { t: "nil" };
      }
      const items = [];
      while (iRef.i < input.length && input[iRef.i] !== ")" && input[iRef.i] !== ".") {
        items.push(parseExpr());
        skipWs(input, iRef);
      }
      if (input[iRef.i] === ".") {
        iRef.i += 1;
        const tail = parseExpr();
        skipWs(input, iRef);
        if (input[iRef.i] !== ")") throw new Error("S-expr dotted pair missing ')'");
        iRef.i += 1;
        let out = tail;
        for (let j = items.length - 1; j >= 0; j -= 1) {
          out = { t: "pair", car: items[j], cdr: out };
        }
        return out;
      }
      if (input[iRef.i] !== ")") throw new Error("S-expr list missing ')'");
      iRef.i += 1;
      return listToPairs(items);
    }
    const n = parseNumber(input, iRef);
    if (n) return { t: "num", v: n };
    const name = parseName(input, iRef);
    if (name) return { t: "atom", v: name };
    throw new Error(`Unexpected token in S-expr at offset ${iRef.i}`);
  }
  const v = parseExpr();
  skipWs(input, iRef);
  if (iRef.i !== input.length) throw new Error("Trailing tokens in S-expr");
  return v;
}

function parseAppWithParens(input, iRef, closeChar, sepChar) {
  const args = [];
  skipWs(input, iRef);
  if (input[iRef.i] === closeChar) {
    iRef.i += 1;
    return args;
  }
  for (;;) {
    args.push(parseTerm(input, iRef));
    skipWs(input, iRef);
    if (input[iRef.i] === closeChar) {
      iRef.i += 1;
      break;
    }
    if (input[iRef.i] !== sepChar) throw new Error(`Expected '${sepChar}'`);
    iRef.i += 1;
    skipWs(input, iRef);
  }
  return args;
}

function parseTerm(input, iRef) {
  skipWs(input, iRef);
  const n = parseNumber(input, iRef);
  if (n) return { t: "num", v: n };
  const name = parseName(input, iRef);
  if (!name) throw new Error(`Expected term at offset ${iRef.i}`);
  skipWs(input, iRef);
  if (input[iRef.i] === "(") {
    iRef.i += 1;
    const args = parseAppWithParens(input, iRef, ")", ",");
    return app(name, args);
  }
  if (input[iRef.i] === "[") {
    iRef.i += 1;
    const args = parseAppWithParens(input, iRef, "]", ";");
    return app(name, args);
  }
  return { t: "atom", v: name };
}

function parsePrologLike(input, allowRule) {
  const trimmed = input.trim().replace(/\.$/, "");
  const iRef = { i: 0 };
  const head = parseTerm(trimmed, iRef);
  skipWs(trimmed, iRef);
  if (allowRule && trimmed.slice(iRef.i, iRef.i + 2) === ":-") {
    iRef.i += 2;
    const goals = [];
    for (;;) {
      goals.push(parseTerm(trimmed, iRef));
      skipWs(trimmed, iRef);
      if (trimmed[iRef.i] !== ",") break;
      iRef.i += 1;
    }
    skipWs(trimmed, iRef);
    if (iRef.i !== trimmed.length) throw new Error("Trailing tokens in Prolog rule");
    return app("rule", [head, ...goals]);
  }
  if (iRef.i !== trimmed.length) throw new Error("Trailing tokens in Prolog term");
  return head;
}

function parseMExpr(input) {
  const iRef = { i: 0 };
  const v = parseTerm(input.trim(), iRef);
  skipWs(input, iRef);
  if (iRef.i !== input.trim().length) throw new Error("Trailing tokens in M-expr");
  return v;
}

function parseFExpr(input) {
  const trimmed = input.trim();
  const lambdaMatch = trimmed.match(/^lambda\s*\(([^)]*)\)\s*->\s*(.+)$/);
  if (lambdaMatch) {
    const params = lambdaMatch[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((p) => ({ t: "atom", v: p }));
    const body = parseFExpr(lambdaMatch[2]);
    return app("lambda", [listToPairs(params), body]);
  }
  const iRef = { i: 0 };
  const v = parseTerm(trimmed, iRef);
  skipWs(trimmed, iRef);
  if (iRef.i !== trimmed.length) throw new Error("Trailing tokens in F-expr");
  return v;
}

function toDotted(node) {
  if (!node) return "nil";
  if (node.t === "nil") return "nil";
  if (node.t === "num") return node.v;
  if (node.t === "atom") return node.v;
  if (node.t === "pair") return `(${toDotted(node.car)} . ${toDotted(node.cdr)})`;
  throw new Error(`Unknown node type: ${JSON.stringify(node)}`);
}

function lower(surface, source) {
  if (surface === "s_expr") return parseSExpr(source);
  if (surface === "prolog") return parsePrologLike(source, true);
  if (surface === "datalog") return parsePrologLike(source, true);
  if (surface === "m_expr") return parseMExpr(source);
  if (surface === "f_expr") return parseFExpr(source);
  throw new Error(`Unsupported surface: ${surface}`);
}

function buildMatrix(hashesBySurface) {
  const matrix = {};
  for (const a of EXPECTED_SURFACES) {
    matrix[a] = {};
    for (const b of EXPECTED_SURFACES) {
      const ha = hashesBySurface[a] || null;
      const hb = hashesBySurface[b] || null;
      if (!ha || !hb) {
        matrix[a][b] = null;
      } else {
        matrix[a][b] = ha === hb ? 1 : 0;
      }
    }
  }
  return matrix;
}

function main() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const inPath = path.join(root, "logic/sources/surface_equivalence.ndjson");
  const outReceipts = path.join(root, "logic/generated/surface_equivalence_receipts.ndjson");
  const outSummary = path.join(root, "logic/generated/surface_equivalence_summary.ndjson");
  if (!fs.existsSync(inPath)) fail(`Missing source file: ${inPath}`);

  const rows = loadRecords(inPath);
  const byId = new Map();
  for (const r of rows) {
    if (!r || typeof r !== "object") fail("Invalid record object");
    if (!r.id || !r.surface || typeof r.source !== "string") {
      fail(`Record missing required fields: ${JSON.stringify(r)}`);
    }
    if (!EXPECTED_SURFACES.includes(r.surface)) {
      fail(`Unsupported surface '${r.surface}' for id='${r.id}'`);
    }
    if (!byId.has(r.id)) byId.set(r.id, []);
    byId.get(r.id).push(r);
  }

  const receipts = [];
  let conflicts = 0;
  for (const [id, group] of [...byId.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const bySurface = {};
    for (const row of group) {
      if (bySurface[row.surface]) fail(`Duplicate surface for id='${id}' surface='${row.surface}'`);
      const lowered = lower(row.surface, row.source);
      const dotted = toDotted(lowered);
      bySurface[row.surface] = {
        id: row.id,
        surface: row.surface,
        source: row.source,
        lowered_pair: dotted,
        pair_hash: sha256Hex(dotted),
        wordnet_anchor: typeof row.wordnet_anchor === "string" ? row.wordnet_anchor : null,
        lexical_tags: Array.isArray(row.lexical_tags) ? row.lexical_tags : []
      };
    }

    const present = Object.keys(bySurface).length;
    const counts = new Map();
    for (const s of Object.keys(bySurface)) {
      const h = bySurface[s].pair_hash;
      counts.set(h, (counts.get(h) || 0) + 1);
    }
    let canonicalPairHash = "";
    let agreeing = 0;
    for (const [h, c] of counts.entries()) {
      if (c > agreeing) {
        canonicalPairHash = h;
        agreeing = c;
      }
    }
    const conflicting = present - agreeing;
    if (conflicting > 0) conflicts += 1;

    const hashesBySurface = {};
    for (const s of EXPECTED_SURFACES) {
      hashesBySurface[s] = bySurface[s]?.pair_hash || null;
    }

    receipts.push({
      type: "surface_equivalence_receipt",
      id,
      canonical_pair_hash: canonicalPairHash,
      surfaces_present: present,
      surfaces_expected: EXPECTED_SURFACES.length,
      surfaces_agreeing: agreeing,
      surfaces_conflicting: conflicting,
      completeness_ratio: `${present}/${EXPECTED_SURFACES.length}`,
      consistency_ratio: present > 0 ? `${agreeing}/${present}` : "0/0",
      complete: present === EXPECTED_SURFACES.length && conflicting === 0,
      matrix: buildMatrix(hashesBySurface),
      profile: {
        wordnet_anchors: [...new Set(Object.values(bySurface).map((v) => v.wordnet_anchor).filter(Boolean))],
        lexical_tags: [...new Set(Object.values(bySurface).flatMap((v) => v.lexical_tags))]
      },
      surfaces: Object.fromEntries(
        Object.entries(bySurface).map(([k, v]) => [
          k,
          {
            id: v.id,
            surface: v.surface,
            source: v.source,
            lowered_pair: v.lowered_pair,
            pair_hash: v.pair_hash,
            wordnet_anchor: v.wordnet_anchor,
            lexical_tags: v.lexical_tags
          }
        ])
      )
    });
  }

  fs.mkdirSync(path.dirname(outReceipts), { recursive: true });
  fs.writeFileSync(outReceipts, receipts.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");

  const summary = {
    type: "surface_equivalence_summary",
    objects_total: receipts.length,
    objects_conflicting: conflicts,
    objects_complete: receipts.filter((r) => r.complete).length,
    verifier_version: "surface_equivalence_v1"
  };
  fs.writeFileSync(outSummary, `${JSON.stringify(summary)}\n`, "utf8");

  if (conflicts > 0) {
    fail(`Surface conflicts detected in ${conflicts} object(s). See ${outReceipts}`);
  }
  console.log("OK: surface equivalence verified");
  console.log(`receipts=${outReceipts}`);
  console.log(`summary=${outSummary}`);
}

try {
  main();
} catch (err) {
  fail(err.message);
}
