# Decentralized Remote Workflow (Atomic-Kernel Logic Clock)

This guide documents how to run and edit `omnicron` remotely while preserving
the core invariants:

- unary pre-header gate is strict and fail-fast
- endianness is a feature, verified explicitly
- `7! = 5040` logic-clock framing from `atomic-kernel` is treated as a shared
  coordination invariant across nodes

## 1. Network model

Use one repo, many nodes:

- **Steward node**: canonical branch and review gate.
- **Builder nodes**: run compile/test/verify.
- **Observer nodes**: attach GDB/QMP/read mirrors.

Every node runs the same verification gates before publishing.

## 2. Remote node bootstrap (Guix)

On each remote machine:

```bash
cd /path/to/omnicron
make guix-pull
```

Enter portable toolchain shell:

```bash
make guix-shell-core
```

Or with optional editor/UI packages:

```bash
make guix-shell-dev
```

## 3. Remote editing patterns

### Pattern A (recommended): Git-over-SSH collaboration

Edit locally, sync by branch:

```bash
git checkout -b feature/<topic>
# edit files
make verify-preheader-congruence
make verify-endian-compatibility
git commit -am "..."
git push origin feature/<topic>
```

This is the most reliable decentralized mode because every node can re-run the
same gates.

### Pattern B: Live remote editing session

If you want a direct remote editor session:

1. SSH into remote node.
2. Start a persistent `tmux` session.
3. Open editor inside that session (`atom`, `pulsar`, `vim`, etc.).

```bash
ssh user@remote-host
cd /path/to/omnicron
tmux new -s omnicron
```

Then run verification in another tmux pane so edits and checks stay coupled.

## 4. Remote QEMU + debug access

Run QEMU on a remote builder, expose only via SSH tunnels.

### On remote builder (inside repo)

```bash
cd /path/to/omnicron/riscv-baremetal
./run_omicron.sh
```

### From your local machine: tunnel debug/control ports

```bash
# GDB port tunnel
ssh -L 1234:127.0.0.1:1234 user@remote-host
```

If using QMP on a TCP port, tunnel it similarly. Prefer loopback bindings on
remote host and SSH forwarding over open external ports.

Attach debugger locally:

```bash
gdb-multiarch -ex "target remote localhost:1234"
```

## 5. Shared verification contract (all nodes)

Run these on every node before publishing artifacts:

```bash
make test test-pair-machine test-polylog
make test-wordnet-synset-graph
make verify-preheader-congruence
make verify-endian-compatibility
```

Canonical full attestation:

```bash
make rebuild-all
```

## 6. 7! logic-clock as decentralized invariant

Treat `7! = 5040` from `atomic-kernel` as a logical coordination period:

- each node produces receipts against the same law checks
- phase/chirality/BOM stepping must remain deterministic under replay
- disagreement is a hard fault, not an interpretation choice

Practical rule:

1. If two nodes produce different verification outputs for the same commit,
   stop promotion.
2. Resolve mismatch first (toolchain drift, runtime drift, or stream/header
   incongruence).
3. Only then promote.

## 7. Fail-fast policy (must hold remotely too)

The remote workflow does not relax invariants:

- pre-header mismatch -> fail on first violation
- header/stream incongruence -> fail on first violation
- endian contract mismatch -> fail on first violation

No fallback path is allowed in distributed mode.

## 8. Minimal daily decentralized loop

```bash
git pull --rebase
make guix-shell-core
make verify-preheader-congruence
make verify-endian-compatibility
make test-pair-machine
git push
```

That loop keeps the logic clock, unary gate, and endian semantics aligned
across collaborators.

## 9. One-command remote node receipt

Quick gate (recommended default):

```bash
make remote-node-check
```

Full gate:

```bash
make remote-node-check-full
```

Receipt artifact:

- `logic/generated/remote_node_check.ndjson`

Status field values:

- `CLOCK_CONGRUENT`
- `NOT_CONGRUENT`
