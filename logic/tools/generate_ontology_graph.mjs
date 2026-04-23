#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const NODE_KINDS = new Set(["stage", "class", "file", "runtime", "lexicon", "artifact", "operation"]);
const EDGE_KINDS = new Set(["orders", "classifies", "implements", "declares", "emits", "projects_to"]);
const AUTHORITY = new Set(["authoritative", "derived", "declared_partial", "not_integrated"]);

function parseFact(line, head) {
  const t = line.trim();
  if (!t.startsWith(head)) return null;
  const end = t.lastIndexOf(").");
  if (end < 0) return null;
  return t.slice(head.length, end);
}

function splitTopLevelCSV(s) {
  const out = [];
  let cur = "";
  let depth = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim().length) out.push(cur.trim());
  return out;
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function id(kind, name) {
  return `${kind}__${slug(name)}`;
}

function q(s) {
  return String(s).replace(/"/g, '\\"');
}

function makeLegend() {
  return {
    type: "ontology_legend",
    schema_version: "1.0.0",
    node_kinds: {
      stage: "Pipeline/substrate stage node",
      class: "Classification node (duodecimal classes)",
      file: "Source file node",
      runtime: "Runtime data/type node",
      lexicon: "Lexicon API/runtime node",
      artifact: "Generated witness artifact node",
      operation: "Runtime operation/function node"
    },
    edge_kinds: {
      orders: "Ordering edge between stages",
      classifies: "Classification membership edge",
      implements: "Implementation edge from file to runtime/operation",
      declares: "Declaration/spec edge",
      emits: "Artifact/fact emission edge",
      projects_to: "Projection edge from authority to witness/readout"
    },
    authority_status: {
      authoritative: "Source of truth in current phase",
      derived: "Derived witness/projection artifact",
      declared_partial: "Declared but not fully integrated",
      not_integrated: "Known gap; not currently wired"
    }
  };
}

function main() {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const rulesPath = path.join(repoRoot, "polyform/bitboards/rules_selected.logic");
  const pairMachinePath = path.join(repoRoot, "pair-machine.c");
  const outNdjson = path.join(repoRoot, "logic/generated/ontology_graph.ndjson");
  const outDot = path.join(repoRoot, "logic/generated/ontology_graph.dot");
  const outLegend = path.join(repoRoot, "logic/generated/ontology_legend.ndjson");

  const raw = fs.readFileSync(rulesPath, "utf8");
  const lines = raw.split("\n");
  const pairSrc = fs.readFileSync(pairMachinePath, "utf8");

  const stageOrder = [];
  const duodecimal = [];

  for (const line of lines) {
    const so = parseFact(line, "substrate_stage_order(");
    if (so !== null) {
      const [a, b] = splitTopLevelCSV(so);
      if (a && b) stageOrder.push({ from: a, to: b, source_fact: line.trim() });
      continue;
    }
    const dm = parseFact(line, "duodecimal_main_class(");
    if (dm !== null) {
      const [idx, name] = splitTopLevelCSV(dm);
      if (idx && name) duodecimal.push({ index: Number(idx), name, source_fact: line.trim() });
    }
  }
  duodecimal.sort((a, b) => a.index - b.index);

  const nodes = [];
  const edges = [];

  function addNode(nodeId, label, nodeKind, authorityStatus, sourceFile, sourceFact) {
    if (!NODE_KINDS.has(nodeKind)) throw new Error(`Unknown node kind: ${nodeKind}`);
    if (!AUTHORITY.has(authorityStatus)) throw new Error(`Unknown authority status: ${authorityStatus}`);
    nodes.push({
      id: nodeId,
      label,
      node_kind: nodeKind,
      authority_status: authorityStatus,
      source_file: sourceFile || "",
      source_fact: sourceFact || ""
    });
  }

  function addEdge(from, to, edgeKind, sourceFile, sourceFact) {
    if (!EDGE_KINDS.has(edgeKind)) throw new Error(`Unknown edge kind: ${edgeKind}`);
    edges.push({
      from,
      to,
      edge_kind: edgeKind,
      source_file: sourceFile || "",
      source_fact: sourceFact || ""
    });
  }

  const fileUniversal = id("file", "the_universal_logic_page_md");
  const fileDecl = id("file", "omnitron_declarations_lx");
  const fileRules = id("file", "rules_selected_logic");
  const fileOntology = id("file", "ontology_md");
  const filePair = id("file", "pair_machine_c");
  const lexApi = id("lexicon", "omnitron_ddc_lexicon_h");
  const lexRuntime = id("lexicon", "runtime");

  addNode(fileUniversal, "The Universal Logic Page.md", "file", "authoritative", "docs/reference/root/The Universal Logic Page.md", "");
  addNode(fileDecl, "omnitron_declarations.lx", "file", "authoritative", "logic/sources/omnitron_declarations.lx", "");
  addNode(fileRules, "rules_selected.logic", "file", "authoritative", "polyform/bitboards/rules_selected.logic", "");
  addNode(fileOntology, "ONTOLOGY.md", "file", "derived", "docs/reference/logic/ONTOLOGY.md", "");
  addNode(filePair, "pair-machine.c", "file", "authoritative", "pair-machine.c", "");
  addNode(lexApi, "omnitron_ddc_lexicon.h", "lexicon", "declared_partial", "logic/contracts/omnitron_ddc_lexicon.h", "");
  addNode(lexRuntime, "lexicon runtime implementation", "lexicon", "not_integrated", "", "");

  addEdge(fileUniversal, fileDecl, "declares", "docs/reference/root/The Universal Logic Page.md", "");
  addEdge(fileDecl, fileRules, "emits", "logic/sources/omnitron_declarations.lx", "");
  addEdge(fileRules, fileOntology, "projects_to", "polyform/bitboards/rules_selected.logic", "");
  addEdge(fileDecl, lexApi, "declares", "logic/sources/omnitron_declarations.lx", "");
  addEdge(lexApi, lexRuntime, "declares", "logic/contracts/omnitron_ddc_lexicon.h", "runtime implementation missing");

  // Stage chain from live facts.
  const stageIds = new Set();
  for (const st of stageOrder) {
    const fromId = id("stage", st.from);
    const toId = id("stage", st.to);
    stageIds.add(fromId);
    stageIds.add(toId);
    addNode(fromId, st.from, "stage", "authoritative", "polyform/bitboards/rules_selected.logic", st.source_fact);
    addNode(toId, st.to, "stage", "authoritative", "polyform/bitboards/rules_selected.logic", st.source_fact);
    addEdge(fromId, toId, "orders", "polyform/bitboards/rules_selected.logic", st.source_fact);
    addEdge(fileRules, fromId, "emits", "polyform/bitboards/rules_selected.logic", st.source_fact);
    addEdge(fileRules, toId, "emits", "polyform/bitboards/rules_selected.logic", st.source_fact);
  }

  // Duodecimal classes from live facts.
  const classRoot = id("class", "duodecimal_classification");
  addNode(classRoot, "duodecimal_classification", "class", "authoritative", "polyform/bitboards/rules_selected.logic", "");
  addEdge(fileRules, classRoot, "emits", "polyform/bitboards/rules_selected.logic", "");
  for (const dc of duodecimal) {
    const classId = id("class", String(dc.index).padStart(2, "0"));
    addNode(classId, `${dc.index}: ${dc.name}`, "class", "authoritative", "polyform/bitboards/rules_selected.logic", dc.source_fact);
    addEdge(classRoot, classId, "classifies", "polyform/bitboards/rules_selected.logic", dc.source_fact);
  }

  // Runtime algebra sync from pair-machine.c.
  const runtimeTokens = ["PairWord", "Value", "poly", "vars", "terms", "term", "coef", "mons"];
  const opTokens = ["make_term", "make_poly", "normalize_terms", "poly_normalize", "poly_add", "poly_mul", "poly_deriv", "poly_eval"];

  for (const t of runtimeTokens) {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`);
    const present = re.test(pairSrc);
    const rid = id("runtime", t);
    addNode(rid, t, "runtime", present ? "authoritative" : "not_integrated", "pair-machine.c", present ? `${t} token found` : "");
    addEdge(filePair, rid, "implements", "pair-machine.c", `${t} runtime token`);
  }

  for (const op of opTokens) {
    const re = new RegExp(`\\b${op}\\s*\\(`);
    const present = re.test(pairSrc);
    const oid = id("operation", op);
    addNode(oid, op, "operation", present ? "authoritative" : "not_integrated", "pair-machine.c", present ? `${op}(...) found` : "");
    addEdge(filePair, oid, "implements", "pair-machine.c", `${op}(...)`);
    addEdge(fileRules, oid, "projects_to", "polyform/bitboards/rules_selected.logic", "declared polynomial semantics -> runtime operation");
  }

  // Artifact nodes: machine graph, raster witness, optional dot projection.
  const artGraph = id("artifact", "ontology_graph_ndjson");
  const artPgm = id("artifact", "ontology_graph_pgm");
  const artDot = id("artifact", "ontology_graph_dot");
  addNode(artGraph, "ontology_graph.ndjson", "artifact", "derived", "logic/generated/ontology_graph.ndjson", "");
  addNode(artPgm, "ontology_graph.pgm", "artifact", "derived", "logic/generated/ontology_graph.pgm", "");
  addNode(artDot, "ontology_graph.dot", "artifact", "derived", "logic/generated/ontology_graph.dot", "");
  addEdge(fileRules, artGraph, "emits", "polyform/bitboards/rules_selected.logic", "ontology graph generated from live facts");
  addEdge(filePair, artGraph, "emits", "pair-machine.c", "runtime algebra sync included");
  addEdge(artGraph, artPgm, "projects_to", "logic/tools/ontology_graph_to_pgm.mjs", "ndjson -> pgm");
  addEdge(artGraph, artDot, "projects_to", "logic/tools/generate_ontology_graph.mjs", "ndjson -> dot");

  // Deduplicate
  const seenNode = new Set();
  const dedupNodes = nodes.filter((n) => {
    if (seenNode.has(n.id)) return false;
    seenNode.add(n.id);
    return true;
  });
  const seenEdge = new Set();
  const dedupEdges = edges.filter((e) => {
    const k = `${e.from}|${e.to}|${e.edge_kind}|${e.source_fact}`;
    if (seenEdge.has(k)) return false;
    seenEdge.add(k);
    return true;
  });

  const graph = {
    type: "ontology_graph",
    schema_version: "1.1.0",
    generated_from: "polyform/bitboards/rules_selected.logic",
    id_contract: "kind__slug",
    vocab_contract: {
      node_kinds: Array.from(NODE_KINDS),
      edge_kinds: Array.from(EDGE_KINDS),
      authority_status: Array.from(AUTHORITY)
    },
    sync_contract: {
      stage_order_source: "substrate_stage_order/2",
      duodecimal_source: "duodecimal_main_class/2",
      runtime_algebra_source: "pair-machine.c",
      lexicon_status: {
        api: "declared_partial",
        runtime: "not_integrated"
      }
    },
    nodes: dedupNodes,
    edges: dedupEdges
  };

  fs.writeFileSync(outNdjson, `${JSON.stringify(graph)}\n`, "utf8");
  fs.writeFileSync(outLegend, `${JSON.stringify(makeLegend())}\n`, "utf8");

  const dot = [];
  dot.push("digraph ontology_graph {");
  dot.push("  rankdir=LR;");
  dot.push("  graph [fontname=\"monospace\"];");
  dot.push("  node [shape=box, fontname=\"monospace\", style=filled, fillcolor=\"#0f172a\", fontcolor=\"#e2e8f0\", color=\"#334155\"];");
  dot.push("  edge [fontname=\"monospace\", color=\"#64748b\", fontcolor=\"#94a3b8\"];");
  for (const n of dedupNodes) {
    const lbl = `${n.label}\\n(kind:${n.node_kind})\\n(status:${n.authority_status})`;
    dot.push(`  "${n.id}" [label="${q(lbl)}"];`);
  }
  for (const e of dedupEdges) {
    dot.push(`  "${e.from}" -> "${e.to}" [label="${q(e.edge_kind)}"];`);
  }
  dot.push("}");
  fs.writeFileSync(outDot, `${dot.join("\n")}\n`, "utf8");

  console.log(`OK: wrote ${outNdjson}`);
  console.log(`OK: wrote ${outLegend}`);
  console.log(`OK: wrote ${outDot}`);
}

main();
