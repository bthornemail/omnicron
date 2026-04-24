#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function runCmd(cmd, cwd) {
  try {
    const out = execSync(cmd, { cwd, encoding: "utf8", stdio: "pipe" });
    return { ok: true, out: out.trim() };
  } catch (err) {
    const stdout = String(err.stdout || "");
    const stderr = String(err.stderr || "");
    return { ok: false, out: `${stdout}${stderr}`.trim() };
  }
}

function main() {
  const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const attestationPath = path.join(rootDir, "logic/generated/canonicality_attestation.ndjson");
  const revision = runCmd("git rev-parse HEAD", rootDir);
  const gitRev = revision.ok ? revision.out.split("\n").pop() : "unknown";

  const stages = [];

  const stageDefs = [
    { id: "s1", name: "pair_machine_kernel_law_check", cmd: "make test-pair-machine" },
    { id: "s2", name: "classification_manifest_verifier", cmd: "make verify-classification-manifest" },
    { id: "s3", name: "doc_layout_hygiene_verifier", cmd: "make verify-doc-layout" },
    { id: "s4", name: "declarative_lock_verifier", cmd: "make verify-locks" },
    { id: "s5", name: "surface_equivalence_verifier", cmd: "make verify-surface-equivalence" },
    { id: "s6", name: "surface_projection_derivation", cmd: "make derive-surface-projections" },
    { id: "s7", name: "devdocs_reference_soft_warning", cmd: "make report-devdocs-refs" },
    { id: "s8", name: "riscv_artifact_regeneration_check", cmd: "./logic/verify/verify_riscv_artifacts.sh" },
    { id: "s9", name: "prolog_bridge_replay_equivalence", cmd: "make verify-bridge-replay" },
    { id: "s10", name: "bitboard_authority_verifier", cmd: "make verify-bitboard-authority" },
    { id: "s11", name: "coreform_chain_verifier", cmd: "make verify-coreform-chain" },
    { id: "s12", name: "polyform_toolbox_verifier", cmd: "make verify-polyform-toolbox" },
    { id: "s13", name: "render_contract_verifier", cmd: "make verify-render-contract" },
    { id: "s14", name: "preheader_congruence_verifier", cmd: "make verify-preheader-congruence" },
    { id: "s15", name: "endian_compatibility_verifier", cmd: "make verify-endian-compatibility" },
    { id: "s16", name: "ontology_graph_verifier", cmd: "make verify-ontology-graph" }
  ];

  for (const s of stageDefs) {
    const r = runCmd(s.cmd, rootDir);
    stages.push({
      id: s.id,
      name: s.name,
      status: r.ok ? "pass" : "fail",
      detail: r.ok ? "ok" : r.out.slice(-800)
    });
  }

  const s15 = runCmd("./logic/tools/deterministic_replay.sh", rootDir);
  stages.push({
    id: "s17",
    name: "deterministic_hash_lock",
    status: s15.ok ? "pass" : "fail",
    detail: s15.ok ? "ok" : s15.out.slice(-800)
  });

  const deterministicHashOk = s15.ok;
  const renderStage = stages.find((s) => s.id === "s13");
  const renderPacketHashOk = Boolean(renderStage && renderStage.status === "pass");
  const renderPacketSchemaOk = Boolean(renderStage && renderStage.status === "pass");
  const renderPacketProvenanceOk = Boolean(renderStage && renderStage.status === "pass");
  const renderContractOk = renderPacketHashOk && renderPacketSchemaOk && renderPacketProvenanceOk;
  const provenanceComplete = renderPacketProvenanceOk;
  const canonicalityOk = stages.every((s) => s.status === "pass") && deterministicHashOk && provenanceComplete;

  const attestation = {
    type: "canonicality_attestation",
    command: "make rebuild-all",
    timestamp_utc: new Date().toISOString(),
    revision: gitRev,
    stages,
    render_packet_hash_ok: renderPacketHashOk,
    render_packet_schema_ok: renderPacketSchemaOk,
    render_packet_provenance_ok: renderPacketProvenanceOk,
    render_contract_ok: renderContractOk,
    deterministic_hash_ok: deterministicHashOk,
    provenance_complete: provenanceComplete,
    canonicality_ok: canonicalityOk
  };

  fs.writeFileSync(attestationPath, `${JSON.stringify(attestation)}\n`, "utf8");
  console.log(`attestation=${attestationPath}`);
  console.log(`canonicality_ok=${canonicalityOk ? "true" : "false"}`);

  process.exit(canonicalityOk ? 0 : 2);
}

main();
