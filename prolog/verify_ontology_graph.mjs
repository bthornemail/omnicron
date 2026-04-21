#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const REQUIRED_RUNTIME = [
  "runtime__pairword",
  "runtime__value",
  "runtime__poly",
  "runtime__vars",
  "runtime__terms",
  "runtime__term",
  "runtime__coef",
  "runtime__mons",
  "operation__make_term",
  "operation__make_poly",
  "operation__normalize_terms",
  "operation__poly_normalize",
  "operation__poly_add",
  "operation__poly_mul",
  "operation__poly_deriv",
  "operation__poly_eval"
];

const EDGE_VOCAB = new Set(["orders", "classifies", "implements", "declares", "emits", "projects_to"]);

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(2);
}

function main() {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const graphPath = path.join(root, "prolog/ontology_graph.ndjson");
  const legendPath = path.join(root, "prolog/ontology_legend.ndjson");

  if (!fs.existsSync(graphPath)) fail(`missing graph artifact: ${graphPath}`);
  if (!fs.existsSync(legendPath)) fail(`missing legend artifact: ${legendPath}`);

  const graph = JSON.parse(fs.readFileSync(graphPath, "utf8").trim().split("\n")[0]);
  const legend = JSON.parse(fs.readFileSync(legendPath, "utf8").trim().split("\n")[0]);

  if (graph.type !== "ontology_graph") fail("ontology graph type mismatch");
  if (legend.type !== "ontology_legend") fail("ontology legend type mismatch");

  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  for (const id of REQUIRED_RUNTIME) {
    const n = byId.get(id);
    if (!n) fail(`required runtime node missing: ${id}`);
    if (n.authority_status !== "authoritative") {
      fail(`required runtime node not authoritative: ${id} status=${n.authority_status}`);
    }
  }

  for (const e of edges) {
    if (!EDGE_VOCAB.has(e.edge_kind)) {
      fail(`edge kind outside canonical vocabulary: ${e.edge_kind}`);
    }
  }

  const idRx = /^(stage|class|file|runtime|lexicon|artifact|operation)__[a-z0-9_]+$/;
  for (const n of nodes) {
    if (!idRx.test(n.id)) fail(`node id violates canonical contract: ${n.id}`);
  }

  if (!legend.node_kinds || !legend.edge_kinds || !legend.authority_status) {
    fail("legend missing required sections");
  }

  console.log("OK: ontology graph verified (ids, vocab, required runtime authority, legend)");
}

main();
