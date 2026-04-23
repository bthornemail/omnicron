#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const NEEDLE = "dev-docs/reference/";

function main() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const manifestPath = path.join(root, "authority/classification_manifest.json");
  const reportPath = path.join(root, "logic/generated/devdocs_reference_warnings.ndjson");

  if (!fs.existsSync(manifestPath)) {
    console.error(`ERROR: missing manifest ${manifestPath}`);
    process.exit(2);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
  const scanEntries = entries.filter(
    (e) => e && typeof e.path === "string" && (e.class === "authority" || e.class === "derived")
  );

  const warnings = [];
  for (const e of scanEntries) {
    const rel = e.path;
    if (rel === "authority/report_devdocs_refs.mjs") continue;
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (!stat.isFile()) continue;
    const ext = path.extname(rel).toLowerCase();
    if (![".md", ".org", ".mjs", ".js", ".json", ".txt", ".logic", ".pl", ".sh", ".c", ".h"].includes(ext)) {
      continue;
    }
    const text = fs.readFileSync(abs, "utf8");
    if (!text.includes(NEEDLE)) continue;
    const lines = text
      .split("\n")
      .map((line, idx) => ({ line: idx + 1, text: line }))
      .filter((x) => x.text.includes(NEEDLE))
      .slice(0, 10);
    warnings.push({
      type: "devdocs_reference_warning",
      file: rel,
      class: e.class,
      needle: NEEDLE,
      matches: lines
    });
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, warnings.map((w) => JSON.stringify(w)).join("\n") + (warnings.length ? "\n" : ""), "utf8");

  if (warnings.length === 0) {
    console.log("OK: no dev-docs/reference authority references detected");
  } else {
    console.log(`WARN: ${warnings.length} file(s) reference dev-docs/reference (soft warning mode)`);
    console.log(`report=${reportPath}`);
  }
  process.exit(0);
}

main();
