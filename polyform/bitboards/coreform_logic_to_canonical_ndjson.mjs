#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const REQUIRED_STAGES = ["truth_table", "karnaugh", "gate_net", "carry_lookahead"];

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function usage() {
  console.error(
    "Usage: node polyform/bitboards/coreform_logic_to_canonical_ndjson.mjs <coreform.logic> [canonical.ndjson]"
  );
}

function parseQuotedOrAtom(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFact(line, prefix) {
  if (!line.startsWith(prefix) || !line.endsWith(").")) return null;
  return line.slice(prefix.length, -2).trim();
}

function parseCoreformLogic(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("%"));
  const normalizedAuthorityText = `${lines.join("\n")}\n`;

  let root = null;
  const nodes = new Map();
  const stageByNode = new Map();
  const nextEdges = new Map();
  const derives = [];
  const virtualAddress = new Map();
  const balancedAddress = new Map();

  for (const line of lines) {
    const rootInner = parseFact(line, "coreform_root(");
    if (rootInner !== null) {
      root = parseQuotedOrAtom(rootInner);
      continue;
    }

    const nodeInner = parseFact(line, "node(");
    if (nodeInner !== null) {
      const m = nodeInner.match(
        /^([a-zA-Z0-9_]+)\s*,\s*node_meta\(\s*([a-zA-Z0-9_]+)\s*,\s*([0-9]+)\s*\)$/
      );
      if (m) {
        nodes.set(m[1], { root: m[2], index: Number(m[3]) });
      }
      continue;
    }

    const stageInner = parseFact(line, "stage(");
    if (stageInner !== null) {
      const m = stageInner.match(/^([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)$/);
      if (m) stageByNode.set(m[1], m[2]);
      continue;
    }

    const nextInner = parseFact(line, "next(");
    if (nextInner !== null) {
      const m = nextInner.match(/^([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)$/);
      if (m) nextEdges.set(m[1], m[2]);
      continue;
    }

    const derivesInner = parseFact(line, "derives_from(");
    if (derivesInner !== null) {
      const m = derivesInner.match(/^([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)$/);
      if (m) derives.push({ node: m[1], from: m[2] });
      continue;
    }

    const vaInner = parseFact(line, "virtual_address(");
    if (vaInner !== null) {
      const idx = vaInner.indexOf(",");
      if (idx > 0) {
        const nodeId = parseQuotedOrAtom(vaInner.slice(0, idx));
        const val = parseQuotedOrAtom(vaInner.slice(idx + 1));
        virtualAddress.set(nodeId, val);
      }
      continue;
    }

    const baInner = parseFact(line, "balanced_address(");
    if (baInner !== null) {
      const idx = baInner.indexOf(",");
      if (idx > 0) {
        const nodeId = parseQuotedOrAtom(baInner.slice(0, idx));
        const val = parseQuotedOrAtom(baInner.slice(idx + 1));
        balancedAddress.set(nodeId, val);
      }
      continue;
    }
  }

  if (!root) {
    throw new Error("Missing coreform_root/1");
  }

  const ordered = [...nodes.entries()]
    .filter(([, meta]) => meta.root === root)
    .sort((a, b) => a[1].index - b[1].index)
    .map(([nodeId, meta]) => ({
      node_id: nodeId,
      index: meta.index,
      stage: stageByNode.get(nodeId) || "",
      virtual_address: virtualAddress.get(nodeId) || "",
      balanced_address: balancedAddress.get(nodeId) || "",
      derives_from: derives.filter((d) => d.node === nodeId).map((d) => d.from)
    }));

  if (ordered.length !== REQUIRED_STAGES.length) {
    throw new Error(`Expected ${REQUIRED_STAGES.length} nodes for root ${root}, got ${ordered.length}`);
  }

  for (let i = 0; i < ordered.length; i += 1) {
    if (ordered[i].index !== i) {
      throw new Error(`Node ordering is non-deterministic at position ${i}`);
    }
    if (ordered[i].stage !== REQUIRED_STAGES[i]) {
      throw new Error(`Stage mismatch at ${ordered[i].node_id}: expected ${REQUIRED_STAGES[i]}`);
    }
    if (i < ordered.length - 1) {
      const dst = nextEdges.get(ordered[i].node_id);
      if (dst !== ordered[i + 1].node_id) {
        throw new Error(`next/2 chain mismatch at ${ordered[i].node_id}`);
      }
    } else if (nextEdges.has(ordered[i].node_id)) {
      throw new Error(`Terminal node ${ordered[i].node_id} must not have outgoing next/2`);
    }
  }

  const canonicalPayload = normalizedAuthorityText;

  const contentSha = sha256Hex(canonicalPayload);
  const semanticFingerprint = sha256Hex(
    [
      normalizedAuthorityText,
      ordered.map((n) => `${n.node_id}|${n.stage}|${n.derives_from.join(",")}`).join("|")
    ].join("|")
  );
  const stepIdentity = sha256Hex(`${root}|${semanticFingerprint}|${contentSha}`);
  const addressSeed = sha256Hex(`seed|${stepIdentity}|coreform_chain_v1`);
  const virtualAddressRoot = ordered[0].virtual_address;
  const balancedAddressRoot = ordered[0].balanced_address;
  const receiptAnchor = sha256Hex(`receipt|${stepIdentity}|${addressSeed}`);

  const artifactKind = "prolog_fact_set";
  const payloadKind = "logic_text";
  const artifactId = sha256Hex(
    [
      stepIdentity,
      addressSeed,
      virtualAddressRoot,
      balancedAddressRoot,
      path.resolve(filePath),
      artifactKind
    ].join("|")
  );
  const artifactHash = sha256Hex(
    [artifactId, contentSha, payloadKind, receiptAnchor, semanticFingerprint].join("|")
  );

  return {
    type: "canonical_artifact",
    schema_version: "1.0.0",
    artifact_id: artifactId,
    artifact_hash: artifactHash,
    artifact_kind: artifactKind,
    payload_kind: payloadKind,
    producer_step_identity: stepIdentity,
    address_seed: addressSeed,
    virtual_address: virtualAddressRoot,
    balanced_address: balancedAddressRoot,
    receipt_anchor: receiptAnchor,
    content_path: path.resolve(filePath),
    content_sha256: contentSha,
    content_bytes: Buffer.byteLength(canonicalPayload, "utf8"),
    canonical_payload: canonicalPayload,
    projection_hints: {
      authority_source: "polyform/bitboards .logic",
      chain_root: root,
      chain_stages: REQUIRED_STAGES,
      stage_count: ordered.length
    },
    provenance: {
      derived_from: "coreform_logic",
      semantic_fingerprint: semanticFingerprint,
      resolver_version: "coreform_logic_to_canonical_v1"
    },
    replay_stage: "emit",
    receipt: {
      anchor: receiptAnchor,
      requirements: {
        require_step_identity: true,
        require_address_seed: true,
        require_content_sha256: true,
        require_source_target: true,
        require_receipt_anchor: true
      }
    }
  };
}

const inPath = process.argv[2];
const outPath = process.argv[3] || null;
if (!inPath) {
  usage();
  process.exit(2);
}
if (!fs.existsSync(inPath)) {
  console.error(`Input not found: ${inPath}`);
  process.exit(2);
}

const canonical = parseCoreformLogic(inPath);
const payload = `${JSON.stringify(canonical)}\n`;
if (outPath) {
  fs.writeFileSync(outPath, payload, "utf8");
} else {
  process.stdout.write(payload);
}
