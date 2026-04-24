#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DOC_EXTENSIONS = new Set([".md", ".pdf", ".svg", ".txt", ".rst", ".gif", ".png"]);
const DOC_PATH_EXCEPTIONS = [
  "polyform/objects/"
];

function walkFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(current, e.name);
      const rel = path.relative(rootDir, abs).replace(/\\/g, "/");
      if (rel.startsWith(".git/")) continue;
      if (rel.includes("/node_modules/") || rel.startsWith("node_modules/")) continue;
      if (e.isDirectory()) {
        stack.push(abs);
      } else if (e.isFile()) {
        out.push(rel);
      }
    }
  }
  return out.sort();
}

function isDocPath(p) {
  return DOC_EXTENSIONS.has(path.extname(p).toLowerCase());
}

function isExceptionPath(p) {
  return DOC_PATH_EXCEPTIONS.some((prefix) => p.startsWith(prefix));
}

function main() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const files = walkFiles(root);

  const tempDocsViolations = files.filter((f) => f.startsWith("temp-docs/"));
  if (tempDocsViolations.length > 0) {
    throw new Error(`temp-docs is deprecated; found files:\n${tempDocsViolations.join("\n")}`);
  }

  const misplacedDocs = files.filter(
    (f) => isDocPath(f) && !f.startsWith("docs/") && !f.startsWith("dev-docs/") && !isExceptionPath(f)
  );
  if (misplacedDocs.length > 0) {
    throw new Error(`Non-code docs must live under docs/ (canonical) or dev-docs/ (mutable); found:\n${misplacedDocs.join("\n")}`);
  }

  const docsCanonical = files.some((f) => f.startsWith("docs/reference/"));
  if (!docsCanonical) {
    throw new Error("Missing canonical docs root under docs/reference/");
  }

  console.log("OK: doc layout verified (docs is canonical; dev-docs is mutable)");
}

try {
  main();
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
}
