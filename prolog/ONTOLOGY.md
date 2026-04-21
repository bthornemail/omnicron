# Prolog Ontology

## Source Of Truth

`prolog/constitutional_stack.pl` is the ontology file.

It does not define the boot-time machine. It defines the logical objects,
relations, closure forms, receipt forms, and surface projections that sit above
the bare-metal kernel.

`prolog/polylog.c` is the host-side parser/interpreter surface for ASCII
syntax. It is a prototype front end, not the ontology itself.

`prolog/omnitron_pipeline.h` is the C interface for the lawful projection
pipeline. It defines stage types, invariants, and projection signatures.

`prolog/omnitron_artifact_contract.h` is the guest-to-host artifact interface
for deterministic witness surfaces (PGM/SVG/NDJSON/framed binary).

`prolog/omnitron_ddc_lexicon.h` is the two-graph DDC-style classification
interface. It defines:
- Graph A: term to canonical class number
- Graph B: class number to canonical meaning and projection labels

`prolog/omnitron_declarations.lx` is the active Lisp-like declaration surface.
This is the current "what survives" layer while designs evolve.

Synced ontology graph artifacts:

- Generator: `prolog/generate_ontology_graph.mjs`
- Machine graph: `prolog/ontology_graph.ndjson`
- Legend: `prolog/ontology_legend.ndjson`
- Diagram source: `prolog/ontology_graph.dot`
- Raster witness: `prolog/ontology_graph.pgm` (lossless P5)

These are generated from live facts in `polyform/bitboards/rules_selected.logic`,
specifically:

- `substrate_stage_order/2` for substrate chain ordering
- `duodecimal_main_class/2` for DDC/duodecimal class membership

Lexicon integration is explicitly status-annotated in the graph:

- `omnitron_ddc_lexicon.h` -> `declared_partial`
- lexicon runtime implementation -> `not_integrated`

Runtime algebra sync:

- `pair-machine.c` is scanned for runtime algebra/data nodes:
  - `PairWord`, `Value`, `poly`, `vars`, `terms`, `term`, `coef`, `mons`
  - `make_term`, `make_poly`, `normalize_terms`, `poly_normalize`,
    `poly_add`, `poly_mul`, `poly_deriv`, `poly_eval`
- Graph node/edge metadata now includes:
  - `node_kind`, `edge_kind`
  - `authority_status`
  - `source_file`, `source_fact`

Canonical hardening:

- Node IDs are frozen under contract: `kind__slug`
  (e.g., `stage__raw_binary_group_ordering`, `class__05`,
  `operation__poly_add`, `artifact__ontology_graph_ndjson`)
- Edge vocabulary is frozen:
  `orders`, `classifies`, `implements`, `declares`, `emits`, `projects_to`
- Verifier:
  - `make verify-ontology-graph`
  - fails if required runtime algebra nodes disappear, are renamed, or lose
    `authoritative` status

## Current Working Mode

For now, the team is working in Lisp-like logic declarations first.

Current order of authority in this phase:
1. `prolog/omnitron_declarations.lx` for stable names and declaration intent.
2. `prolog/constitutional_stack.pl` for Prolog ontology relations.
3. `prolog/bootstrap_datalog.pl` and `prolog/bootstrap_ingest.logic` for
   bootstrap fact sets.
4. `prolog/omnicron-rule-source.org` as evolving authoring source, with
   executable subset confirmed by `prolog/run_rule_source.sh`.

## Execution Confirmation

Use the execution harness to confirm what currently survives parser/runtime
execution in the custom interpreter:

- Command: `make test-rule-source`
- Source document: `prolog/omnicron-rule-source.org`
- Candidate extraction: `prolog/omnicron-rule-source.extracted.candidates.logic`
- Parser-safe extraction: `prolog/omnicron-rule-source.extracted.logic`
- Execution log: `prolog/omnicron-rule-source.run.log`
- Fact-level bridge replay check: `make verify-bridge-replay`

Bridge-first replay wiring:

- `prolog/run_rule_source.sh` now attempts canonical bridge extraction first:
  - `/tmp/omnicron-rule-source.structural.ndjson`
  - `/tmp/omnicron-rule-source.resolved.ndjson`
  - `/tmp/omnicron-rule-source.canonical.ndjson`
- Runtime replay input is materialized from canonical artifacts via:
  - `polyform/org/scripts/org_canonical_to_replay_input.mjs`
- For legacy prose-heavy `.org` files with no explicit source blocks, the
  structural adapter emits a synthetic candidate logic block so bridge-first
  replay remains active.
- If bridge tooling is unavailable, harness falls back to the legacy
  parser-safe line filter.

This process is intentionally conservative: it keeps only top-level declarations
that `polylog` can assert today.

For runtime-visible deterministic ordering, `polylog` now supports a substrate
manifest output:

- File mode: `./polylog --manifest --prolog <file>`
- REPL mode: `:r` (or `:manifest`)

For deterministic replay lock (minimal anti-drift):

- Baseline/update: `./prolog/deterministic_replay.sh --update`
- Verify against baseline: `make deterministic`
- Baseline file: `prolog/deterministic_replay.sha256`

Control-plane graph artifacts (bitboard-only):

- `polyform/bitboards/control_graph_golden.bitboard`
- `polyform/bitboards/control_graph_negative.bitboard`
- `polyform/bitboards/control_graph_overlay_aegean.bitboard`

The executable `.org` layer keeps ASCII aliases for Aegean and DPD table facts;
Unicode Aegean glyphs live in `.lx` declaration metadata.

For software-rendering/no-SDL host mirroring, see:
- `prolog/ARTIFACT_CONTRACT.md`

## The Ontology In One Line

```text
ASCII syntax names objects,
logic relates objects,
closure settles objects,
receipts witness objects,
surfaces project objects.
```

```text
DDC index addresses objects,
pipeline projections transform objects,
invariants constrain transformations.
```

```text
raw binary groups bound objects,
canonical ASCII orders controls,
sexagesimal headers frame objects,
duodecimal classes address objects,
frame sequencing replays objects.
```

## Raw Binary Substrate

The project now carries a deterministic substrate layer that sits below the
normal text/parsing pipeline:

```text
raw_binary_group_ordering
-> canonical_ascii_ordering
-> sexagesimal_notation_headers
-> duodecimal_classification
-> frame_sequence_resolution
```

This is modeled in both declaration and executable-source layers:
- `prolog/omnitron_declarations.lx` as Lisp-like declarations
- `prolog/omnicron-rule-source.org` as parser-safe Prolog facts/rules

## Constitutional Foundation Ladder

The current algebra-to-geometry stack is explicitly modeled as:

```text
Monoid -> Zonoid -> Polyform -> Carrier -> Projection
```

Interpretation:
- Monoid: lawful identity and associative composition (`e * x = x * e = x`)
- Zonoid: continuous generated body via lawful accumulation
- Polyform: discrete sampled witness over lattice/cell surfaces
- Carrier: encoded transport surface
- Projection: human-visible/readable rendering

This distinguishes arithmetic zero (quantity) from monoid identity
(neutral action), which is critical for the `Code16k` zero-state contract.

Extended narrative/design note:
- `temp-docs/Omicron-Gnomon Computational Instrument.md`

## The Main Object Families

### 1. Structural Objects

These are the base objects that give the logic layer a shaped domain.

- `term/1`
- `slot/3`
- `root/2`
- `join/3`
- `combine/2`
- `sex60/4`

What they mean:

- a `term` is a named logical thing
- a `slot` is a coefficient at a named position
- a `root` is the degree or unit position
- `join` and `combine` describe structural grouping
- `sex60` packages left digits, a unit, and right digits into one object

These are the closest Prolog-side analogues to structured machine state.

### 2. Order And Relation Objects

- `leq/2`
- `covers/2`
- `left_of/2`
- `right_of/2`

What they mean:

- `leq` gives a partial-order reading
- `covers` says two terms share a structural position
- `left_of` and `right_of` give ordered position relations

This is the beginning of ontology as relation rather than storage.

### 3. Claim Objects

- `claim/4`
- `claim_group/2`
- `supports/2`
- `conflicts/2`
- `contradicting/3`

What they mean:

- a `claim` is a proposition in context with a status
- a `claim_group` is a family of candidate claims
- `supports` and `conflicts` are second-order relations between claims
- `contradicting` marks local incompatibility

This is where the file stops being arithmetic structure and becomes argument
structure.

### 4. World Objects

- `proposal/2`
- `candidate_world/2`
- `unique_minimal_world/1`

What they mean:

- a `proposal` collects selected claims into one world candidate
- a `candidate_world` is a consistent and minimal selection
- a `unique_minimal_world` asks whether one preferred world survives

This is the ontology of coherent selection.

### 5. Closure Objects

- `closure/4`
- `digit_constraint/1`
- `sum_constraint/3`
- `carry_propagation/3`

What they mean:

- `closure` says accepted material has been transformed into a settled result
- the constraint predicates describe lawful shape and arithmetic bounds
- the CHR rules above them define structural closure behavior

This is the ontology of what follows.

### 6. Receipt Objects

- `receipt/4`
- `lower_to_receipt/2`
- `verify_receipt/1`
- `emit_receipt/1`

What they mean:

- a receipt is a witness object for a claim/proposal/closure chain
- `lower_to_receipt` makes a canonical record
- `verify_receipt` checks the witness path
- `emit_receipt` projects that witness into readable form

This is the ontology of evidence.

### 7. Surface Objects

- `stars_bars_from_sex60/2`
- `braille_from_sex60/2`
- `hexagram_from_sex60/2`
- `render_sex60/2`

What they mean:

- these are not the truth layer
- these are projection layers for reading, inspection, and presentation

This is the ontology of derived witness surfaces.

## The Lawful Pipeline

The C sketch you pasted can be translated into the Prolog-side ontology like
this:

```text
plain ASCII text
-> parsed terms / clauses / queries
-> structural objects
-> claim objects
-> world objects
-> closure objects
-> receipt objects
-> surface objects
```

In repo terms:

```text
polylog.c
-> parsed Prolog/Datalog/S-expr/M-expr/F-expr forms
-> omnitron_pipeline.h stage contracts and invariant checks
-> constitutional_stack.pl logical objects and relations
-> receipt / surface projections
```

## The Stage Map

### Stage 0: ASCII Transport

Authority:

- host-side textual syntax
- line-oriented input
- ASCII control and separator assumptions

Current repo home:

- `prolog/polylog.c`

### Stage 1: Syntax Forms

Forms:

- Prolog
- Datalog
- S-expressions
- M-expressions
- F-expressions

Meaning:

- these are not separate ontologies
- they are alternate authoring surfaces over related structures

Current repo home:

- `prolog/polylog.c`

### Stage 2: Structural Logic Objects

Objects:

- `term`
- `slot`
- `root`
- `sex60`

Meaning:

- syntax has now been normalized into shaped logical objects

Current repo home:

- `prolog/constitutional_stack.pl`

### Stage 3: Argument And World Objects

Objects:

- `claim`
- `supports`
- `conflicts`
- `proposal`
- `candidate_world`

Meaning:

- the system has moved from structure to competing truth candidates

Current repo home:

- `prolog/constitutional_stack.pl`

### Stage 4: Closure And Receipt Objects

Objects:

- `closure`
- `receipt`
- `lower_to_receipt`
- `verify_receipt`

Meaning:

- selection is converted into settled and witnessable form

Current repo home:

- `prolog/constitutional_stack.pl`

### Stage 5: Surface Objects

Objects:

- stars and bars
- braille
- hexagram
- rendered sexagesimal strings

Meaning:

- the result becomes human-facing without becoming sovereign

Current repo home:

- `prolog/constitutional_stack.pl`

## The Invariants

No matter which syntax surface is used, the ontology should preserve:

- predicate identity
- argument order
- contextual claim identity
- conflict/support meaning
- closure provenance
- receipt provenance
- surface derivation from deeper structure

If one notation can express something another cannot preserve, the projection is
not lawful yet.

## The Practical Reading

If you are reading the Prolog section to decide what to build next, the code is
already telling you three separate jobs exist:

1. `polylog.c` is the parser and interactive syntax layer.
2. `constitutional_stack.pl` is the ontology and logical relation layer.
3. The missing middle is a clean normalized core that maps parser output into
   the ontology predicates in a disciplined way.

That missing middle is the real compiler boundary.

## The Next Concrete Step

If we keep working in `prolog/`, the most useful next implementation is:

- define a small normalized clause/term representation
- map `polylog.c` parsed facts/rules/queries into that representation
- document which predicates in `constitutional_stack.pl` are input predicates
  versus derived predicates versus witness predicates

That would turn the ontology from conceptual alignment into an explicit
compilation pipeline.
