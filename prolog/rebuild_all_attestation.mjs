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
  const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  const attestationPath = path.join(rootDir, "prolog/canonicality_attestation.ndjson");
  const revision = runCmd("git rev-parse HEAD", rootDir);
  const gitRev = revision.ok ? revision.out.split("\n").pop() : "unknown";

  const stages = [];

  const stageDefs = [
    { id: "s1", name: "pair_machine_kernel_law_check", cmd: "make test-pair-machine" },
    { id: "s2", name: "classification_manifest_verifier", cmd: "make verify-classification-manifest" },
    { id: "s3", name: "riscv_artifact_regeneration_check", cmd: "./prolog/verify_riscv_artifacts.sh" },
    { id: "s4", name: "prolog_bridge_replay_equivalence", cmd: "make verify-bridge-replay" },
    { id: "s5", name: "bitboard_authority_verifier", cmd: "make verify-bitboard-authority" },
    { id: "s6", name: "coreform_chain_verifier", cmd: "make verify-coreform-chain" },
    { id: "s7", name: "polyform_toolbox_verifier", cmd: "make verify-polyform-toolbox" },
    { id: "s8", name: "render_contract_verifier", cmd: "make verify-render-contract" },
    { id: "s9", name: "ontology_graph_verifier", cmd: "make verify-ontology-graph" }
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

  const s10 = runCmd("./prolog/deterministic_replay.sh", rootDir);
  stages.push({
    id: "s10",
    name: "deterministic_hash_lock",
    status: s10.ok ? "pass" : "fail",
    detail: s10.ok ? "ok" : s10.out.slice(-800)
  });

  const deterministicHashOk = s10.ok;
  const renderStage = stages.find((s) => s.id === "s8");
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
