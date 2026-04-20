#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error(
    "Usage: node scripts/org_query_to_structural_ndjson.mjs <input.org> [output.ndjson]"
  );
}

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function decodeCaptureText(text) {
  return text
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, "\"")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

function countNewlines(s) {
  let n = 0;
  for (let i = 0; i < s.length; i += 1) {
    if (s[i] === "\n") n += 1;
  }
  return n;
}

function normalizeBodyForIdentity(payload) {
  let lines = String(payload ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));
  while (lines.length > 0 && lines[0] === "") {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  const s = lines.join("\n");
  return s.endsWith("\n") ? s : `${s}\n`;
}

function lineOffsetsFromSource(source) {
  const lines = source.split("\n");
  const offsets = [];
  let off = 0;
  for (let i = 0; i < lines.length; i += 1) {
    offsets.push(off);
    off += Buffer.byteLength(lines[i], "utf8") + 1;
  }
  return { lines, offsets };
}

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? null;

if (!inputPath) {
  usage();
  process.exit(2);
}

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const orgRoot = path.resolve(scriptDir, "..");
const tsBin = path.resolve(orgRoot, "node_modules/.bin/tree-sitter");
const queryPath = path.resolve(orgRoot, "queries/omnicron.scm");
const absoluteInput = path.resolve(inputPath);

if (!fs.existsSync(absoluteInput)) {
  console.error(`Input not found: ${absoluteInput}`);
  process.exit(2);
}
if (!fs.existsSync(tsBin)) {
  console.error(`tree-sitter binary not found: ${tsBin}`);
  process.exit(2);
}
if (!fs.existsSync(queryPath)) {
  console.error(`Query file not found: ${queryPath}`);
  process.exit(2);
}

const source = fs.readFileSync(absoluteInput, "utf8");
const { lines, offsets } = lineOffsetsFromSource(source);

const queryOut = execFileSync(
  tsBin,
  ["query", "-c", queryPath, absoluteInput],
  { cwd: orgRoot, encoding: "utf8" }
);

const directives = {};
const properties = {};
const sectionsByRow = new Map();
const blocksByRow = new Map();
let lastBlockRow = null;

const directiveNameByRow = new Map();
const propertyNameByRow = new Map();

const captureRe =
  /^\s*pattern:\s*\d+,\s*capture:\s*([^,]+),\s*row:\s*(\d+),\s*text:\s*"(.*)"$/;

for (const line of queryOut.split("\n")) {
  const m = line.match(captureRe);
  if (!m) continue;
  const capture = m[1];
  const row = Number.parseInt(m[2], 10);
  const text = decodeCaptureText(m[3]);

  if (capture === "omni.directive.name") {
    directiveNameByRow.set(row, text);
    continue;
  }
  if (capture === "omni.directive.value") {
    const k = directiveNameByRow.get(row);
    if (k) directives[k] = text;
    continue;
  }
  if (capture === "omni.property.name") {
    propertyNameByRow.set(row, text);
    continue;
  }
  if (capture === "omni.property.value") {
    const k = propertyNameByRow.get(row);
    if (k) properties[k] = text;
    continue;
  }
  if (capture === "omni.section.name") {
    const s = sectionsByRow.get(row) ?? { name: "", tags: [] };
    s.name = text;
    sectionsByRow.set(row, s);
    continue;
  }
  if (capture === "omni.section.tag") {
    const s = sectionsByRow.get(row) ?? { name: "", tags: [] };
    s.tags.push(text);
    sectionsByRow.set(row, s);
    continue;
  }
  if (capture === "omni.block") {
    const b =
      blocksByRow.get(row) ?? { kind: "src", language: "", name: "", body: "", text: "" };
    b.text = text;
    blocksByRow.set(row, b);
    lastBlockRow = row;
    continue;
  }
  if (capture === "omni.block.name") {
    const targetRow = blocksByRow.has(row) ? row : lastBlockRow ?? row;
    const b =
      blocksByRow.get(targetRow) ?? { kind: "src", language: "", name: "", body: "", text: "" };
    b.kind = text || "src";
    blocksByRow.set(targetRow, b);
    continue;
  }
  if (capture === "omni.block.parameter") {
    const targetRow = blocksByRow.has(row) ? row : lastBlockRow ?? row;
    const b =
      blocksByRow.get(targetRow) ?? { kind: "src", language: "", name: "", body: "", text: "" };
    b.language = text;
    blocksByRow.set(targetRow, b);
    continue;
  }
  if (capture === "omni.block.contents") {
    const targetRow = blocksByRow.has(row) ? row : lastBlockRow ?? row;
    const b =
      blocksByRow.get(targetRow) ?? { kind: "src", language: "", name: "", body: "", text: "" };
    b.body = text;
    blocksByRow.set(targetRow, b);
    continue;
  }
}

const sectionRows = [...sectionsByRow.keys()].sort((a, b) => a - b);
function sectionForRow(row) {
  let found = null;
  for (const r of sectionRows) {
    if (r <= row) found = r;
    if (r > row) break;
  }
  if (found === null) return { name: "", tags: [], level: 0 };
  const section = sectionsByRow.get(found) ?? { name: "", tags: [] };
  const headline = lines[found] ?? "";
  const starMatch = headline.match(/^(\*+)/);
  const level = starMatch ? starMatch[1].length : 0;
  return { name: section.name, tags: section.tags, level };
}

const records = [];
const sortedRows = [...blocksByRow.keys()].sort((a, b) => a - b);
for (let idx = 0; idx < sortedRows.length; idx += 1) {
  const row = sortedRows[idx];
  const block = blocksByRow.get(row);
  const body = block.body || block.text || "";
  const sec = sectionForRow(row);
  const lineStart = row + 1;
  const lineEnd = lineStart + countNewlines(body);
  const byteStart = offsets[row] ?? 0;
  const byteEnd = byteStart + Buffer.byteLength(body, "utf8");
  const fp = sha256Hex(
    [
      absoluteInput,
      sec.name,
      String(sec.level),
      block.kind,
      block.language,
      String(lineStart),
      String(byteStart),
      String(byteEnd)
    ].join("|")
  );

  records.push({
    type: "org_structural_record",
    schema_version: "1.0.0",
    file_path: absoluteInput,
    document_id: sha256Hex(absoluteInput),
    headline_path: sec.name ? [sec.name] : [],
    headline_level: sec.level,
    tags: sec.tags,
    properties_local: properties,
    directives_local: directives,
    block_kind: block.kind || "src",
    block_language: block.language || "",
    block_name: block.name || "",
    block_body: body,
    local_order: idx,
    payload_hash: sha256Hex(normalizeBodyForIdentity(body)),
    byte_span: { start: byteStart, end: byteEnd },
    line_span: { start: lineStart, end: lineEnd },
    structural_fingerprint: fp
  });
}

const out = records.map((r) => JSON.stringify(r)).join("\n") + (records.length ? "\n" : "");
if (outputPath) {
  fs.writeFileSync(path.resolve(outputPath), out, "utf8");
} else {
  process.stdout.write(out);
}
