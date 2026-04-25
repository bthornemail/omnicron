# Federated Logic Delivery

This document defines the first working shape of the decentralized delivery
idea.

Instead of sending a finished artifact, a node sends a framed packet containing
enough logic to reconstruct the artifact.

```text
send:    frame + seed + LUT rules + rewrite program + witness hash
rebuild: replay the packet locally
verify: compare reconstructed artifact hash
repair: request only missing rules or LUT entries
```

## Why This Matters

Ordinary content delivery moves bytes. This model moves reconstruction logic.

The receiving node can answer:

- Did the pre-header pass before interpretation started?
- Did `header8` replay produce the committed witness?
- Did the local LUT contain every rule needed by the packet?
- Did the reconstructed artifact hash match?
- If not, what is the smallest missing piece to ask from a peer?

That is the start of a self-correcting federated system.

## Packet v0

Schema:

- `logic/contracts/logic_packet_v0.schema.json`

Tools:

- `logic/tools/make_logic_packet.mjs`
- `logic/runtime/logic_packet_replay.mjs`
- `logic/verify/verify_logic_packet_replay.mjs`

Sample generated packet:

- `logic/generated/logic_packet_v0_sample.json`

Replay receipt:

- `logic/generated/logic_packet_v0_replay_receipt.ndjson`

## Current Minimal Example

The v0 sample reconstructs the text `OMI` from:

- one seed byte: `O`
- two LUT entries: `O->M = -2`, `M->I = -4`
- a rewrite program:

```json
[
  { "op": "emit_seed" },
  { "op": "lut_add_emit", "key": "O->M" },
  { "op": "lut_add_emit", "key": "M->I" }
]
```

This is deliberately tiny. It proves the shape:

```text
logic packet -> local replay -> artifact hash -> repair request if missing LUT
```

## Run

```bash
make logic-packet-v0
make verify-logic-packet-replay
```

## Failure Modes

| Error | Meaning | Repair path |
|---|---|---|
| `E_PREHEADER_REPLAY_FAILED` | Packet tried to interpret before the boot gate was congruent | Reject packet or request corrected pre-header |
| `E_MISSING_LUT_ENTRY` | Local node lacks a named rewrite rule | Request only that LUT key from a peer |
| `E_ARTIFACT_HASH_MISMATCH` | Replay completed but reconstructed artifact differs | Request witness trace comparison |

## Next Step

The next useful bridge is to replay the same packet through a QEMU/shared-memory
lane and verify that the host replay hash and guest replay hash match.

