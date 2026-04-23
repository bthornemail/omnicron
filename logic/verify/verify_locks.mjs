#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const manifestPath = path.join(rootDir, "authority/locks_manifest.logic");
const stateOut = path.join(rootDir, "logic/generated/lock_state.ndjson");
const ALLOWED_STATES = new Set(["open", "leased", "resolved"]);

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(2);
}

function sha256Hex(buf) {
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

function parseManifest() {
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
    if (!m) fail(`Invalid fact syntax: ${line}`);
    const pred = m[1];
    const args = splitArgs(m[2]);
    if (args.length !== 2) fail(`Fact arity must be 2: ${line}`);
    const file = parseString(args[0]);
    const value = parseString(args[1]);
    if (!files.has(file)) {
      files.set(file, {
        file,
        state: "",
        holder: "",
        clock: "",
        hash: "",
        intent: "",
        resolved: false
      });
    }
    const rec = files.get(file);
    if (pred === "file_state") rec.state = value;
    if (pred === "file_holder") rec.holder = value;
    if (pred === "file_clock") rec.clock = value;
    if (pred === "file_hash") rec.hash = value;
    if (pred === "file_intent") rec.intent = value;
    if (pred === "file_resolved") rec.resolved = value === "true";
  }
  return [...files.values()].sort((a, b) => a.file.localeCompare(b.file));
}

function currentHash(relPath) {
  const abs = path.join(rootDir, relPath);
  if (!fs.existsSync(abs)) fail(`Declared lock file missing: ${relPath}`);
  return `sha256:${sha256Hex(fs.readFileSync(abs))}`;
}

function getGitChangedFiles() {
  try {
    const out = execSync("git status --porcelain", {
      cwd: rootDir,
      encoding: "utf8",
      stdio: "pipe"
    });
    return out
      .split("\n")
      .filter(Boolean)
      .map((line) => line.slice(3).trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  const records = parseManifest();
  if (records.length === 0) fail("Lock manifest has no file records");

  const byFile = new Map(records.map((r) => [r.file, r]));

  for (const r of records) {
    if (!ALLOWED_STATES.has(r.state)) fail(`Invalid state '${r.state}' for ${r.file}`);

    if (r.state === "open") {
      if (r.holder) fail(`Open file cannot have holder: ${r.file}`);
      if (r.resolved) fail(`Open file cannot be resolved=true: ${r.file}`);
    }

    if (r.state === "leased") {
      if (!r.holder) fail(`Leased file requires holder: ${r.file}`);
      if (r.resolved) fail(`Leased file cannot be resolved=true: ${r.file}`);
    }

    if (r.state === "resolved") {
      if (!r.resolved) fail(`Resolved file requires resolved=true: ${r.file}`);
      if (!r.hash) fail(`Resolved file requires locked hash: ${r.file}`);
      const cur = currentHash(r.file);
      if (cur !== r.hash) {
        fail(`Resolved file hash drift: ${r.file}\nexpected=${r.hash}\nactual=${cur}`);
      }
    }
  }

  const changedFiles = getGitChangedFiles();
  for (const rel of changedFiles) {
    if (!byFile.has(rel)) continue;
    const r = byFile.get(rel);
    if (r.state === "resolved") {
      fail(`Changed file is resolved and must be reopened first: ${rel}`);
    }
    if (r.state !== "leased") {
      fail(`Changed file is not leased: ${rel}`);
    }
  }

  const emittedAt = new Date().toISOString();
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
      emitted_at: emittedAt
    })
  );
  fs.mkdirSync(path.dirname(stateOut), { recursive: true });
  fs.writeFileSync(stateOut, `${lines.join("\n")}\n`, "utf8");

  console.log("OK: declarative locks verified");
  console.log(`state=${stateOut}`);
}

main();
