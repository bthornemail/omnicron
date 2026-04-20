# Bridge Contract v0.1

Status: frozen baseline for the Org bridge authority boundary.

Scope:

```text
org source -> org_structural_record -> resolved_org_block -> canonical_artifact
```

Additional normative lane (coreform/bitboards):

```text
polyform/bitboards/coreform_chain.logic -> canonical_artifact -> render_packet -> viewer
```

Normative references:
- `ORG_BRIDGE_SCHEMA.md`
- `schema/org_bridge.schema.json`
- `scripts/verify_bridge_invariants.mjs`

## Authoritative Surface

The following inputs are identity/routing authoritative in v0.1:

- source path (path-sovereign mode)
- structural scope (`headline_path`, `headline_level`)
- inherited authoritative properties
- normalized payload bytes
- local order
- routing witnesses (`address_seed`, `virtual_address`, `balanced_address`, `receipt_anchor`)

## Non-Authoritative Surface

The following are non-authoritative in v0.1:

- parser-stable whitespace noise
- harmless trailing non-captured text
- projection hints
- receipt-policy options
- display metadata
- locator spans (byte/line offsets)

## Known Frontend Scope

- CRLF/LF behavior is parser-front-end dependent.
- v0.1 guarantees parser-stable whitespace invariance, not universal newline invariance.

## Normative Formulas (Frozen in v0.1)

Truth identity:

```text
artifact_id =
SHA256(step_identity | address_seed | virtual_address | balanced_address | source_file | artifact_kind)
```

Truth hash:

```text
artifact_hash =
SHA256(artifact_id | content_sha256 | payload_kind | receipt_anchor | semantic_fingerprint)
```

Address ranges:

- `lane`: mod 16 (`0..15`)
- `channel`: mod 16 (`0..15`)
- `slot`: mod 60 (`0..59`)
- `balanced_signed`: `raw(mod 8192) - 4096` (`-4096..+4095`)
- `chirality_bit`: `address_seed[24..26] & 0x1` (`0=left`, `1=right`)

See: `scripts/org_structural_to_resolved_ndjson.mjs` and
`scripts/org_resolved_to_canonical_ndjson.mjs`.

## Source Sovereignty Modes

| Mode | Rule | Effect on rename/move |
| --- | --- | --- |
| Path Sovereign (current v0.1) | filesystem `file_path` participates in `step_identity` | rename/move changes identity and routing |
| Logical Source Sovereign (future option) | stable logical source id replaces path identity | rename/move can preserve identity |

## Projection Authority Rules (Normative v0.1)

The projection stack is constitutionally downstream:

```text
canonical_artifact -> render_packet -> viewer backends (SVG/WebGL/OpenGL)
```

Authority constraints:

1. Canonical artifacts are authoritative.
2. Render packets are derived witness artifacts only.
3. Viewers are non-authoritative projection surfaces.
4. Viewer interaction MUST NOT mutate canonical authority.
5. Rendering failures or backend divergence MUST NOT alter canonical truth.
6. Coreform authority is `.logic` composer terms; NDJSON/render packets remain
   witness/projection surfaces only.

## Golden Fixture

Fixture input:
- `corpus/omnicron_profile.tst` (copied to `.org` for query extraction)

Golden outputs:
- `golden/omnicron_profile.structural.ndjson`
- `golden/omnicron_profile.resolved.ndjson`
- `golden/omnicron_profile.canonical.ndjson`

Expected canonical file SHA-256:

```text
793d8ffc6cf3dda3f3dfe13452fdbf952095105210229708087b6baa7a064aed
```
