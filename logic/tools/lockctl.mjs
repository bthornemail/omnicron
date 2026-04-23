#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const manifestPath = path.join(rootDir, "authority/locks_manifest.logic");
const receiptsPath = path.join(rootDir, "logic/generated/lock_receipts.ndjson");
const statePath = path.join(rootDir, "logic/generated/lock_state.ndjson");
const ALLOWED_STATES = new Set(["open", "leased", "resolved"]);

function usage() {
  console.error(
    "Usage: node logic/tools/lockctl.mjs <checkout|checkin|resolve|reopen|status|sync-state> --file <path> [--actor <name>] [--intent <text>] [--reason <text>]"
  );
}

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(2);
}

function sha256HexBytes(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function splitArgs(raw) {
  const out = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === '"') {
      inQuote = !inQuote;
      cur += ch;
      continue;
    }
    if (ch === "," && !inQuote) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim().length > 0) out.push(cur.trim());
  return out;
}

function parseString(raw) {
  const t = raw.trim();
  if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
  return t;
}

function quote(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function readManifest() {
  if (!fs.existsSync(manifestPath)) fail(`Missing lock manifest: ${manifestPath}`);
  const raw = fs.readFileSync(manifestPath, "utf8");
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%"));

  const files = new Map();
  for (const line of lines) {
    const m = line.match(/^([a-z_]+)\((.*)\)\.$/);
    if (!m) continue;
    const pred = m[1];
    const args = splitArgs(m[2]);
    if (args.length !== 2) continue;
    const file = parseString(args[0]);
    const valueRaw = args[1].trim();
    if (!files.has(file)) {
      files.set(file, {
        file,
        state: "open",
        holder: "",
        clock: "",
        hash: "",
        intent: "",
        resolved: false
      });
    }
    const rec = files.get(file);
    if (pred === "file_state") rec.state = parseString(valueRaw);
    if (pred === "file_holder") rec.holder = parseString(valueRaw);
    if (pred === "file_clock") rec.clock = parseString(valueRaw);
    if (pred === "file_hash") rec.hash = parseString(valueRaw);
    if (pred === "file_intent") rec.intent = parseString(valueRaw);
    if (pred === "file_resolved") rec.resolved = parseString(valueRaw) === "true";
  }
  return files;
}

function writeManifest(files) {
  const records = [...files.values()].sort((a, b) => a.file.localeCompare(b.file));
  let out = "";
  out += "% Declarative lease/lock layer (authoritative)\n";
  out += "% States: open | leased | resolved\n\n";
  for (const r of records) {
    out += `file_state(${quote(r.file)}, ${r.state}).\n`;
    if (r.holder) out += `file_holder(${quote(r.file)}, ${quote(r.holder)}).\n`;
    if (r.clock) out += `file_clock(${quote(r.file)}, ${quote(r.clock)}).\n`;
    if (r.hash) out += `file_hash(${quote(r.file)}, ${quote(r.hash)}).\n`;
    if (r.intent) out += `file_intent(${quote(r.file)}, ${quote(r.intent)}).\n`;
    out += `file_resolved(${quote(r.file)}, ${r.resolved ? "true" : "false"}).\n\n`;
  }
  fs.writeFileSync(manifestPath, out, "utf8");
}

function fileSha(file) {
  const abs = path.join(rootDir, file);
  if (!fs.existsSync(abs)) fail(`File not found: ${file}`);
  const buf = fs.readFileSync(abs);
  return `sha256:${sha256HexBytes(buf)}`;
}

function emitReceipt(event) {
  const line = `${JSON.stringify(event)}\n`;
  fs.mkdirSync(path.dirname(receiptsPath), { recursive: true });
  fs.appendFileSync(receiptsPath, line, "utf8");
}

function emitState(files) {
  const now = new Date().toISOString();
  const records = [...files.values()].sort((a, b) => a.file.localeCompare(b.file));
  const lines = records.map((r) =>
    JSON.stringify({
      type: "lock_state",
      file: r.file,
      state: r.state,
      holder: r.holder || null,
      clock: r.clock || null,
      hash: r.hash || null,
      intent: r.intent || null,
      resolved: !!r.resolved,
      emitted_at: now
    })
  );
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, lines.join("\n") + (lines.length ? "\n" : ""), "utf8");
}

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : "";
}

function requireArg(name) {
  const v = getArg(name);
  if (!v) fail(`Missing required --${name}`);
  return v;
}

function main() {
  const cmd = process.argv[2];
  if (!cmd) {
    usage();
    process.exit(2);
  }

  const files = readManifest();
  if (cmd === "sync-state") {
    emitState(files);
    console.log(`OK: lock state emitted -> ${statePath}`);
    return;
  }

  const file = requireArg("file");
  const actor = getArg("actor");
  const intent = getArg("intent");
  const reason = getArg("reason");
  if (!files.has(file)) fail(`File not declared in lock manifest: ${file}`);
  const rec = files.get(file);
  const before = { ...rec };
  const now = new Date().toISOString();

  if (!ALLOWED_STATES.has(rec.state)) fail(`Invalid existing state '${rec.state}' for ${file}`);

  if (cmd === "checkout") {
    if (!actor) fail("checkout requires --actor");
    if (rec.state === "resolved") fail(`Cannot checkout resolved file without reopen: ${file}`);
    if (rec.state === "leased" && rec.holder && rec.holder !== actor) {
      fail(`Already leased by ${rec.holder}: ${file}`);
    }
    rec.state = "leased";
    rec.holder = actor;
    rec.clock = now;
    rec.hash = fileSha(file);
    if (intent) rec.intent = intent;
    rec.resolved = false;
  } else if (cmd === "checkin") {
    if (!actor) fail("checkin requires --actor");
    if (rec.state !== "leased") fail(`File is not leased: ${file}`);
    if (rec.holder !== actor) fail(`Lease holder mismatch for ${file}: expected ${rec.holder}`);
    rec.clock = now;
    rec.hash = fileSha(file);
    if (intent) rec.intent = intent;
    rec.resolved = false;
  } else if (cmd === "resolve") {
    if (!actor) fail("resolve requires --actor");
    if (rec.state !== "leased") fail(`File must be leased before resolve: ${file}`);
    if (rec.holder !== actor) fail(`Lease holder mismatch for ${file}: expected ${rec.holder}`);
    rec.state = "resolved";
    rec.clock = now;
    rec.hash = fileSha(file);
    if (intent) rec.intent = intent;
    rec.resolved = true;
  } else if (cmd === "reopen") {
    if (!actor) fail("reopen requires --actor");
    if (rec.state !== "resolved") fail(`File is not resolved: ${file}`);
    rec.state = "open";
    rec.holder = "";
    rec.clock = now;
    rec.hash = fileSha(file);
    rec.intent = reason || intent || "reopen";
    rec.resolved = false;
  } else if (cmd === "status") {
    console.log(JSON.stringify(rec));
    return;
  } else {
    usage();
    process.exit(2);
  }

  writeManifest(files);
  emitState(files);
  emitReceipt({
    type: "lock_event",
    event: cmd,
    file,
    holder: actor || null,
    clock: now,
    state_from: before.state,
    state_to: rec.state,
    hash_before: before.hash || null,
    hash_after: rec.hash || null,
    intent: rec.intent || null,
    reason: reason || null
  });
  console.log(`OK: ${cmd} ${file} -> ${rec.state}`);
}

main();
