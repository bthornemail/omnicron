# Org Bridge Schema

This file defines the seam between:

1. `tree-sitter-org` structural parsing
2. Org semantic interpretation/tangling
3. Canonical artifact emission

Pipeline:

```text
org text
-> org_structural_record (tree-sitter)
-> resolved_org_block (semantic interpreter)
-> canonical_artifact (runtime/replay inputs)
```

Contract version: `bridge_contract_v0_1`.

## 1) `org_structural_record` (structural front pass)

Produced by tree-sitter query results. This layer is syntax and addressability
only; no inheritance/tangling decisions.

Fields:

- `schema_version`: schema version string
- `file_path`: source org path
- `document_id`: stable document id
- `headline_path`: ordered heading labels from root to local block
- `headline_level`: local heading depth
- `tags`: parsed org tags on headline
- `properties_local`: property drawer values at local scope only
- `directives_local`: local/directive surface values
- `block_kind`: source block or other executable unit kind
- `block_language`: org source block language token
- `block_name`: `#+NAME` value when present
- `block_body`: raw block payload bytes/text
- `byte_span`: `{start,end}` byte offsets in file
- `line_span`: `{start,end}` 1-based line offsets
- `structural_fingerprint`: stable hash over structural coordinates
- `local_order`: deterministic ordinal among extracted executable blocks
- `payload_hash`: hash of raw block payload

## 2) `resolved_org_block` (semantic/tangle pass)

Produced by interpreter walk over structural records with parent inheritance.
This layer decides meaning and extraction policy.

Fields:

- `schema_version`
- `source`: embedded `org_structural_record` identity subset
- `step_identity`: deterministic semantic step id
- `address_seed`: canonical routing seed derived from `step_identity`
- `virtual_address`: deterministic sparse/runtime route
- `balanced_address`: deterministic symmetry/closure route
- `receipt_anchor`: deterministic proof-facing anchor
- `inherited_context`: merged heading ancestry context
- `properties_resolved`: resolved property map after inheritance
- `source_file`: resolved target file path
- `source_directory`: resolved target directory
- `artifact_role`: semantic purpose (logic, c_fragment, receipt, witness, etc.)
- `language_surface`: normalized language surface
- `canonical_payload`: normalized payload text/bytes
- `compile_policy`: compile/tangle policy tuple
- `receipt_requirements`: required receipt metadata fields
- `semantic_fingerprint`: hash over semantic identity and resolved payload

## 3) `canonical_artifact` (runtime/replay pass)

Produced by lowering resolved blocks into replay-sovereign artifacts.

Fields:

- `schema_version`
- `artifact_id`: deterministic artifact id
- `artifact_hash`: deterministic content hash
- `artifact_kind`: one of:
  - `prolog_fact_set`
  - `sexpr_payload`
  - `mexpr_payload`
  - `fexpr_payload`
  - `c_fragment`
  - `bitboard`
  - `pgm`
  - `svg`
  - `ndjson_receipt`
- `producer_step_identity`
- `content_path`: filesystem path
- `content_sha256`: content hash
- `content_bytes`: byte length
- `payload_kind`: normalized payload class
- `canonical_payload`: normalized payload bytes/text
- `projection_hints`: non-authoritative rendering/projection hints
- `provenance`: deterministic provenance object
- `replay_stage`: stage binding (`extract`, `compile`, `emit`, `receipt`)
- `receipt`: optional embedded receipt object

## Deterministic Rules

1. `tree-sitter` layer must not perform property inheritance.
2. semantic layer must not mutate structural spans.
3. `step_identity` must be derivable from stable coordinates and inherited
   context only.
4. canonical artifact bytes are hash authority for replay checks.
5. host/view layers are projections only and cannot alter artifact semantics.
6. `step_identity` SHALL be sufficient to derive address seed and both address
   forms without projection-specific semantics.
7. `canonical_artifact` SHALL be derivable from `resolved_org_block` alone.

## Authority Classification Table

### Authoritative inputs (affect canonical truth)

- stable source path (current policy)
- structural scope (`headline_path`, `headline_level`)
- inherited authoritative properties
- normalized payload bytes
- local block order
- routing witness fields:
  - `address_seed`
  - `virtual_address`
  - `balanced_address`
  - `receipt_anchor`

### Non-authoritative inputs (must not affect canonical truth)

- whitespace-only formatting noise
- harmless trailing text outside captured executable structure
- projection hints
- receipt-policy options
- display-only metadata
- byte/line spans (locator-only, not truth-authoritative)

## Path Sovereignty Policy

Current policy: filesystem path is authoritative and participates in identity
derivation. Renaming/moving a source file changes identity/routing unless a
future logical-source-id policy supersedes path identity.

## Suggested `step_identity` Construction

```text
step_identity = sha256(
  file_path
  + headline_path
  + inherited_context_fingerprint
  + block_kind
  + block_language
  + block_name
  + payload_hash
  + local_order
  + source_file/source_directory
)
```

## Address Derivation Law

```text
address_seed = sha256("seed|" + step_identity + "|" + frame_law)
virtual_address = V(address_seed, lane_law, channel_law, slot_law)
balanced_address = B(address_seed, balance_law, chirality_law)
receipt_anchor = sha256("receipt|" + step_identity + "|" + address_seed)
```

This keeps identity canonical while allowing multiple lawful address
projections.

### Address Range Parameters (Normative v0.1)

`org_structural_to_resolved_ndjson.mjs` derives addresses with these exact
constraints:

- `lane = hex(address_seed[0..2]) mod 16`  -> `lane in [0,15]`
- `channel = hex(address_seed[2..4]) mod 16` -> `channel in [0,15]`
- `slot = hex(address_seed[4..8]) mod 60` -> `slot in [0,59]`
- `page = hex(address_seed[8..16])` -> formatted as 8 hex chars
- `raw_balance = hex(address_seed[16..24]) mod 8192`
- `balanced_signed = raw_balance - 4096` -> `balanced_signed in [-4096,+4095]`
- `chirality_bit = hex(address_seed[24..26]) & 0x1`
- `chirality = "left"` when `chirality_bit = 0`; `"right"` when `chirality_bit = 1`

Encoded forms:

- `virtual_address = "va:<page_hex8>:<lane>.<channel>.<slot>"`
- `balanced_address = "ba:<chirality>:<signed_int>"`

### Truth Hash Formula (Normative v0.1)

`org_resolved_to_canonical_ndjson.mjs` computes truth hashes as:

```text
artifact_id =
SHA256(step_identity | address_seed | virtual_address | balanced_address | source_file | artifact_kind)

artifact_hash =
SHA256(artifact_id | content_sha256 | payload_kind | receipt_anchor | semantic_fingerprint)
```

Where `|` denotes literal string concatenation with pipe separators.

## C-Style Routing Shape (Reference)

```c
typedef struct {
  char step_identity[65];    /* hex sha256 */
  char address_seed[65];     /* hex sha256 */
  char virtual_address[64];  /* va:page:lane.channel.slot */
  char balanced_address[64]; /* ba:chirality:signed */
  char receipt_anchor[65];   /* hex sha256 */
} StepRoutingIdentity;
```

## Minimal Example (JSONL)

```json
{"type":"org_structural_record","file_path":"prolog/omnicron-rule-source.org","headline_path":["OMICRON","CONTROL"],"headline_level":2,"block_kind":"src","block_language":"prolog","block_name":"control_header","byte_span":{"start":1024,"end":1210},"line_span":{"start":44,"end":67},"structural_fingerprint":"..."}
{"type":"resolved_org_block","step_identity":"...","address_seed":"...","virtual_address":"...","balanced_address":"...","receipt_anchor":"...","source_file":"prolog/omnicron-rule-source.extracted.logic","source_directory":"prolog","artifact_role":"logic_fact_block","language_surface":"prolog","semantic_fingerprint":"..."}
{"type":"canonical_artifact","artifact_id":"...","artifact_hash":"...","artifact_kind":"prolog_fact_set","payload_kind":"logic_text","producer_step_identity":"...","content_path":"prolog/omnicron-rule-source.extracted.logic","content_sha256":"...","content_bytes":73378,"canonical_payload":"...","replay_stage":"emit"}
```
