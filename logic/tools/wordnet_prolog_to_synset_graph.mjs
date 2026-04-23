#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(2);
}

function readLines(file) {
  return fs.readFileSync(file, "utf8").split(/\r?\n/);
}

function parseFact(line, name) {
  const re = new RegExp(`^\\s*${name}\\(([^)]*)\\)\\s*\\.\\s*$`);
  const m = line.match(re);
  if (!m) return null;
  return m[1].split(",").map((s) => s.trim());
}

function main() {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const inPath = process.argv[2] || path.join(repoRoot, "logic/sources/wordnet_synset_test.pl");
  const outPath = process.argv[3] || path.join(repoRoot, "logic/generated/wordnet_synset_graph.ndjson");

  if (!fs.existsSync(inPath)) fail(`input not found: ${inPath}`);

  const synsets = new Map();
  const lemmas = new Map();
  const hypernyms = [];

  for (const raw of readLines(inPath)) {
    const line = raw.trim();
    if (!line || line.startsWith("%")) continue;

    const s = parseFact(line, "synset");
    if (s && s.length === 3) {
      const [id, pos, canonicalLemma] = s;
      synsets.set(id, { id, pos, canonicalLemma });
      continue;
    }

    const l = parseFact(line, "lemma");
    if (l && l.length === 2) {
      const [id, lemma] = l;
      if (!lemmas.has(id)) lemmas.set(id, []);
      lemmas.get(id).push(lemma);
      continue;
    }

    const h = parseFact(line, "hypernym");
    if (h && h.length === 2) {
      const [child, parent] = h;
      hypernyms.push({ child, parent });
      continue;
    }
  }

  const nodes = [];
  for (const [id, data] of synsets.entries()) {
    nodes.push({
      id: `synset:${id}`,
      synset_id: id,
      pos: data.pos,
      canonical_lemma: data.canonicalLemma,
      lemmas: lemmas.get(id) || [data.canonicalLemma]
    });
  }

  const edges = [];
  for (const rel of hypernyms) {
    if (!synsets.has(rel.child) || !synsets.has(rel.parent)) {
      fail(`hypernym relation references unknown synset: ${rel.child} -> ${rel.parent}`);
    }
    edges.push({
      from: `synset:${rel.child}`,
      to: `synset:${rel.parent}`,
      relation: "hypernym"
    });
  }

  const graph = {
    type: "wordnet_synset_graph",
    schema_version: "1.0.0",
    source: path.relative(repoRoot, inPath),
    node_count: nodes.length,
    edge_count: edges.length,
    nodes,
    edges
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(graph)}\n`, "utf8");
  console.log(`OK: wrote ${path.relative(repoRoot, outPath)} (${nodes.length} synsets, ${edges.length} hypernyms)`);
}

main();
