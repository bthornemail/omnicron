# SOURCE-OF-TRUTH NOTE
#
# STATUS: SUPPORT FILE
#
# This Makefile currently builds host-side ASCII interpreter prototypes. It
# does not build the bare-metal RISC-V artifacts.
#
# The goal here is to give the repo one simple, reproducible host build:
#   make
#   make test
#   make clean

CC ?= gcc
CFLAGS ?= -std=c11 -O2 -Wall -Wextra -pedantic
LDFLAGS ?=

TARGET := logic-interp
SRC := logic-interp.c
PAIR_TARGET := pair-machine
PAIR_SRC := pair-machine.c
POLYLOG := polylog
POLYLOG_SRC := logic/sources/polylog.c

.PHONY: all clean test test-pair-machine test-polylog test-polylog-bootstrap test-rule-source test-wordnet-synset-graph test-omi-lisp-surface verify-ascii-substrate-lexer verify-ged-ascii-substrate verify-preheader-congruence verify-endian-compatibility verify-multi-emulator-smoke verify-multi-emulator-smoke-strict logic-packet-v0 verify-logic-packet-replay poc-mixedbase-render poc-mixedbase-header8-render remote-node-check remote-node-check-full verify-rendering-env verify-bridge-replay verify-coreform-chain verify-bitboard-authority verify-render-contract verify-ontology-graph verify-classification-manifest verify-doc-layout verify-locks verify-surface-equivalence derive-surface-projections report-devdocs-refs checkout checkin resolve-lock reopen-lock lock-status ontology-graph ontology-graph-raster polyform-toolbox derive-polyform-patterns verify-polyform-toolbox rebuild-all bitboards graph-bitboards deterministic guix-pull guix-shell-core guix-shell-dev guix-shell-rendering guix-shell-full
VIEWER_BIN := omnicron_viewer
VIEWER_SRC := viewer/omnicron_viewer.c

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $@ $(SRC) $(LDFLAGS)

$(PAIR_TARGET): $(PAIR_SRC)
	$(CC) $(CFLAGS) -o $@ $(PAIR_SRC) $(LDFLAGS)

$(POLYLOG): $(POLYLOG_SRC)
	$(CC) $(CFLAGS) -o $@ $(POLYLOG_SRC) -lm $(LDFLAGS)

test: $(TARGET)
	printf '%s\n' '(+ 1 2 3)' | ./$(TARGET) > /tmp/logic-interp.sexpr.out
	grep -q 'sexpr> 6' /tmp/logic-interp.sexpr.out
	printf '%s\n' '(+ (esc ratio 1 3) (esc ratio 2 3))' | ./$(TARGET) > /tmp/logic-interp.ratio.out
	grep -q 'sexpr> 1' /tmp/logic-interp.ratio.out
	printf '%s\n' '(esc bcd "1234")' | ./$(TARGET) > /tmp/logic-interp.bcd.out
	grep -q 'sexpr> bcd:1234' /tmp/logic-interp.bcd.out
	printf '%s\n' '(esc factoradic "0 0 3 2 0 6")' | ./$(TARGET) > /tmp/logic-interp.factoradic.out
	grep -q 'sexpr> factoradic:0 0 3 2 0 6' /tmp/logic-interp.factoradic.out
	printf '%s\n%s\n' ':p' 'parent(john, mary).' '?- parent(X, mary).' ':q' | ./$(TARGET) > /tmp/logic-interp.prolog.out
	grep -q 'fact asserted.' /tmp/logic-interp.prolog.out
	grep -q 'X = john' /tmp/logic-interp.prolog.out

test-pair-machine: $(PAIR_TARGET)
	./$(PAIR_TARGET) > /tmp/pair-machine.out
	grep -q 'eval (car (cons 1 2)) => 1' /tmp/pair-machine.out
	grep -q 'eval (quote (1 2 3)) => (1 2 3)' /tmp/pair-machine.out
	grep -q 'atomic-kernel law check => PASS' /tmp/pair-machine.out
	grep -q 'poly P => 3\*x\^2\*y + 5\*w + 7' /tmp/pair-machine.out
	grep -q 'd/dx P => 6\*x\*y' /tmp/pair-machine.out
	grep -q 'eval P at x=2,y=3,w=4 => 63' /tmp/pair-machine.out
	grep -q 'reader dotted (x . y) => (x . y)' /tmp/pair-machine.out
	grep -q 'meta bootstrap check => PASS' /tmp/pair-machine.out

test-polylog: $(POLYLOG)
	printf '%s\n%s\n%s\n%s\n' ':p' 'parent(john, mary).' '?- parent(X, mary).' ':q' | ./$(POLYLOG) > /tmp/polylog.fact.out
	grep -q 'Fact asserted.' /tmp/polylog.fact.out
	grep -q 'X = john' /tmp/polylog.fact.out
	printf '%s\n%s\n%s\n%s\n%s\n' ':p' 'parent(john, mary).' 'ancestor(X, Y) :- parent(X, Y).' '?- ancestor(X, mary).' ':q' | ./$(POLYLOG) > /tmp/polylog.rule.out
	grep -q 'Clause asserted.' /tmp/polylog.rule.out
	grep -q 'X = john' /tmp/polylog.rule.out

test-polylog-bootstrap: $(POLYLOG)
	./$(POLYLOG) --prolog logic/sources/bootstrap_ingest.logic > /tmp/polylog.bootstrap.out
	grep -q 'Fact asserted.' /tmp/polylog.bootstrap.out
	grep -q 'Clause asserted.' /tmp/polylog.bootstrap.out
	printf '%s\n%s\n' 'header_pair(𐄀, ⠜⠝).' 'header_pair2(𐄌, ⠝⠞).' > /tmp/polylog.header.logic
	./$(POLYLOG) --prolog /tmp/polylog.header.logic > /tmp/polylog.header.out
	grep -q 'Fact asserted.' /tmp/polylog.header.out

test-rule-source: $(POLYLOG)
	./logic/tools/run_rule_source.sh

test-wordnet-synset-graph: $(POLYLOG)
	./$(POLYLOG) --prolog logic/sources/wordnet_synset_test.pl > /tmp/polylog.wordnet.out
	grep -q 'Fact asserted.' /tmp/polylog.wordnet.out
	chmod +x ./logic/tools/wordnet_prolog_to_synset_graph.mjs
	node ./logic/tools/wordnet_prolog_to_synset_graph.mjs logic/sources/wordnet_synset_test.pl logic/generated/wordnet_synset_graph.ndjson
	grep -q '"type":"wordnet_synset_graph"' logic/generated/wordnet_synset_graph.ndjson
	grep -q '"relation":"hypernym"' logic/generated/wordnet_synset_graph.ndjson

test-omi-lisp-surface: $(TARGET)
	chmod +x ./logic/verify/verify_omi_lisp_surface.sh
	./logic/verify/verify_omi_lisp_surface.sh

verify-ascii-substrate-lexer:
	chmod +x ./logic/verify/verify_ascii_substrate_lexer.mjs
	node ./logic/verify/verify_ascii_substrate_lexer.mjs

verify-ged-ascii-substrate:
	chmod +x ./logic/verify/verify_ged_ascii_substrate.mjs ./logic/runtime/ged_ascii_substrate.mjs
	node ./logic/verify/verify_ged_ascii_substrate.mjs

verify-preheader-congruence:
	chmod +x ./logic/verify/verify_preheader_congruence.mjs ./logic/runtime/header8_runtime.mjs ./logic/runtime/dot_rewrite.mjs
	node ./logic/verify/verify_preheader_congruence.mjs

verify-endian-compatibility:
	chmod +x ./logic/verify/verify_endian_compatibility.mjs
	node ./logic/verify/verify_endian_compatibility.mjs

verify-header-ladder:
	chmod +x ./logic/verify/verify_header_ladder_runtime.mjs ./logic/runtime/header_ladder_runtime.mjs ./logic/runtime/dot_rewrite.mjs
	node ./logic/verify/verify_header_ladder_runtime.mjs

verify-multi-width-equivalence:
	chmod +x ./logic/tools/make_multi_width_packet.mjs ./logic/runtime/header_ladder_runtime.mjs
	node ./logic/tools/make_multi_width_packet.mjs

verify-multi-emulator-smoke:
	chmod +x ./logic/verify/verify_multi_emulator_smoke.sh
	./logic/verify/verify_multi_emulator_smoke.sh

verify-multi-emulator-smoke-strict:
	chmod +x ./logic/verify/verify_multi_emulator_smoke.sh
	./logic/verify/verify_multi_emulator_smoke.sh --strict

logic-packet-v0:
	chmod +x ./logic/tools/make_logic_packet.mjs ./logic/runtime/logic_packet_replay.mjs
	node ./logic/tools/make_logic_packet.mjs ./logic/generated/logic_packet_v0_sample.json

verify-logic-packet-replay: logic-packet-v0
	chmod +x ./logic/verify/verify_logic_packet_replay.mjs ./logic/runtime/logic_packet_replay.mjs
	node ./logic/verify/verify_logic_packet_replay.mjs ./logic/generated/logic_packet_v0_sample.json ./logic/generated/logic_packet_v0_replay_receipt.ndjson

poc-mixedbase-render:
	chmod +x ./polyform/org/scripts/mixedbase_stream_to_render_packet_ndjson.mjs ./polyform/org/scripts/org_render_packet_to_svg.mjs
	node ./polyform/org/scripts/mixedbase_stream_to_render_packet_ndjson.mjs ./dev-docs/back-end/99-build/mixedbase_stream_sample.txt /tmp/mixedbase.render_packet.ndjson
	node ./polyform/org/scripts/org_render_packet_to_svg.mjs /tmp/mixedbase.render_packet.ndjson /tmp/mixedbase.svg
	@echo "OK: /tmp/mixedbase.render_packet.ndjson and /tmp/mixedbase.svg"

poc-mixedbase-header8-render:
	chmod +x ./polyform/org/scripts/mixedbase_header8_stream_to_render_packet_ndjson.mjs ./polyform/org/scripts/mixedbase_stream_to_render_packet_ndjson.mjs ./polyform/org/scripts/org_render_packet_to_svg.mjs
	node ./polyform/org/scripts/mixedbase_header8_stream_to_render_packet_ndjson.mjs ./dev-docs/back-end/99-build/mixedbase_stream_sample.txt /tmp/mixedbase_header8.render_packet.ndjson /tmp/mixedbase_header8.witness.ndjson
	node ./polyform/org/scripts/org_render_packet_to_svg.mjs /tmp/mixedbase_header8.render_packet.ndjson /tmp/mixedbase_header8.svg
	@echo "OK: /tmp/mixedbase_header8.render_packet.ndjson /tmp/mixedbase_header8.witness.ndjson /tmp/mixedbase_header8.svg"

remote-node-check:
	chmod +x ./logic/tools/remote_node_check.sh
	./logic/tools/remote_node_check.sh quick

remote-node-check-full:
	chmod +x ./logic/tools/remote_node_check.sh
	./logic/tools/remote_node_check.sh full

verify-rendering-env:
	chmod +x ./logic/verify/verify_rendering_env.sh
	./logic/verify/verify_rendering_env.sh

$(VIEWER_BIN): $(VIEWER_SRC)
	@if ! command -v pkg-config >/dev/null 2>&1; then \
		echo "ERROR: pkg-config not found (needed for glfw3 detection)." >&2; \
		exit 2; \
	fi
	@if ! pkg-config --exists glfw3; then \
		echo "ERROR: glfw3 development package not found (pkg-config glfw3)." >&2; \
		echo "Install GLFW dev libs, then run: make omnicron-viewer" >&2; \
		exit 2; \
	fi
	$(CC) $(CFLAGS) -o $(VIEWER_BIN) $(VIEWER_SRC) $$(pkg-config --cflags --libs glfw3) -lGL -lm $(LDFLAGS)

omnicron-viewer: $(VIEWER_BIN)

verify-bridge-replay: $(POLYLOG)
	chmod +x ./logic/verify/verify_bridge_fact_equivalence.sh
	./logic/verify/verify_bridge_fact_equivalence.sh

verify-coreform-chain:
	chmod +x ./polyform/bitboards/verify_coreform_chain.mjs ./polyform/bitboards/coreform_logic_to_canonical_ndjson.mjs
	node ./polyform/bitboards/verify_coreform_chain.mjs

verify-bitboard-authority:
	chmod +x ./polyform/bitboards/verify_bitboard_authority.mjs ./polyform/bitboards/bitboard_to_canonical_ndjson.mjs
	node ./polyform/bitboards/verify_bitboard_authority.mjs

verify-render-contract:
	chmod +x ./logic/verify/verify_render_contract.mjs ./polyform/bitboards/bitboard_to_canonical_ndjson.mjs ./polyform/bitboards/coreform_logic_to_canonical_ndjson.mjs ./polyform/org/scripts/org_canonical_to_render_packet_ndjson.mjs ./polyform/org/scripts/org_render_packet_to_svg.mjs
	node ./logic/verify/verify_render_contract.mjs

ontology-graph:
	chmod +x ./logic/tools/generate_ontology_graph.mjs
	node ./logic/tools/generate_ontology_graph.mjs

ontology-graph-raster: ontology-graph
	chmod +x ./logic/tools/ontology_graph_to_pgm.mjs
	node ./logic/tools/ontology_graph_to_pgm.mjs ./logic/generated/ontology_graph.ndjson ./logic/generated/ontology_graph.pgm

verify-ontology-graph: ontology-graph
	chmod +x ./logic/verify/verify_ontology_graph.mjs
	node ./logic/verify/verify_ontology_graph.mjs

verify-classification-manifest:
	chmod +x ./authority/verify_classification_manifest.mjs
	node ./authority/verify_classification_manifest.mjs

verify-doc-layout:
	chmod +x ./dev-docs/verify_doc_layout.mjs
	node ./dev-docs/verify_doc_layout.mjs

verify-locks:
	chmod +x ./logic/verify/verify_locks.mjs ./logic/tools/lockctl.mjs
	node ./logic/verify/verify_locks.mjs

verify-surface-equivalence:
	chmod +x ./logic/verify/verify_surface_equivalence.mjs
	node ./logic/verify/verify_surface_equivalence.mjs

derive-surface-projections: verify-surface-equivalence
	chmod +x ./logic/tools/surface_equivalence_to_projection_profile.mjs
	node ./logic/tools/surface_equivalence_to_projection_profile.mjs

report-devdocs-refs:
	chmod +x ./authority/report_devdocs_refs.mjs
	node ./authority/report_devdocs_refs.mjs

checkout:
	chmod +x ./logic/tools/lockctl.mjs
	node ./logic/tools/lockctl.mjs checkout --file "$(FILE)" --actor "$(ACTOR)" --intent "$(INTENT)"

checkin:
	chmod +x ./logic/tools/lockctl.mjs
	node ./logic/tools/lockctl.mjs checkin --file "$(FILE)" --actor "$(ACTOR)" --intent "$(INTENT)"

resolve-lock:
	chmod +x ./logic/tools/lockctl.mjs
	node ./logic/tools/lockctl.mjs resolve --file "$(FILE)" --actor "$(ACTOR)" --intent "$(INTENT)"

reopen-lock:
	chmod +x ./logic/tools/lockctl.mjs
	node ./logic/tools/lockctl.mjs reopen --file "$(FILE)" --actor "$(ACTOR)" --reason "$(REASON)"

lock-status:
	chmod +x ./logic/tools/lockctl.mjs
	node ./logic/tools/lockctl.mjs status --file "$(FILE)"

derive-polyform-patterns:
	chmod +x ./polyform/scripts/polyform_toolbox.mjs
	node ./polyform/scripts/polyform_toolbox.mjs derive-patterns ./polyform/bitboards/rules_selected.logic rules

polyform-toolbox: derive-polyform-patterns
	chmod +x ./polyform/scripts/polyform_toolbox.mjs
	node ./polyform/scripts/polyform_toolbox.mjs build ./polyform/bitboards/rules_golden.bitboard rules_golden_aztec aztec polyform
	node ./polyform/scripts/polyform_toolbox.mjs build ./polyform/bitboards/rules_golden.bitboard rules_golden_maxi maxi barcode
	node ./polyform/scripts/polyform_toolbox.mjs build ./polyform/bitboards/rules_golden.bitboard rules_golden_beecode beecode polygon
	node ./polyform/scripts/polyform_toolbox.mjs build ./polyform/bitboards/rules_golden.bitboard rules_golden_code16k code16k polyform

verify-polyform-toolbox: polyform-toolbox
	chmod +x ./polyform/scripts/polyform_toolbox.mjs
	node ./polyform/scripts/polyform_toolbox.mjs verify rules_aztec
	node ./polyform/scripts/polyform_toolbox.mjs verify rules_maxi
	node ./polyform/scripts/polyform_toolbox.mjs verify rules_beecode
	node ./polyform/scripts/polyform_toolbox.mjs verify rules_code16k_barcode
	node ./polyform/scripts/polyform_toolbox.mjs verify rules_code16k_polyform
	node ./polyform/scripts/polyform_toolbox.mjs verify rules_code16k_polygon
	node ./polyform/scripts/polyform_toolbox.mjs verify rules_golden_aztec
	node ./polyform/scripts/polyform_toolbox.mjs verify rules_golden_maxi
	node ./polyform/scripts/polyform_toolbox.mjs verify rules_golden_beecode
	node ./polyform/scripts/polyform_toolbox.mjs verify rules_golden_code16k

rebuild-all:
	chmod +x ./logic/verify/verify_riscv_artifacts.sh ./logic/tools/rebuild_all_attestation.mjs ./logic/verify/verify_render_contract.mjs ./logic/tools/generate_ontology_graph.mjs ./logic/tools/ontology_graph_to_pgm.mjs ./logic/verify/verify_ontology_graph.mjs ./authority/verify_classification_manifest.mjs ./authority/report_devdocs_refs.mjs ./dev-docs/verify_doc_layout.mjs ./logic/verify/verify_locks.mjs ./logic/verify/verify_surface_equivalence.mjs ./logic/tools/surface_equivalence_to_projection_profile.mjs ./logic/tools/lockctl.mjs ./polyform/bitboards/verify_bitboard_authority.mjs ./polyform/bitboards/bitboard_to_canonical_ndjson.mjs ./polyform/bitboards/verify_coreform_chain.mjs ./polyform/bitboards/coreform_logic_to_canonical_ndjson.mjs ./polyform/org/scripts/canonical_identity.mjs ./polyform/org/scripts/org_canonical_to_render_packet_ndjson.mjs ./polyform/org/scripts/org_render_packet_to_svg.mjs ./polyform/scripts/polyform_toolbox.mjs ./logic/verify/verify_bridge_fact_equivalence.sh ./logic/tools/deterministic_replay.sh ./logic/verify/verify_preheader_congruence.mjs ./logic/runtime/header8_runtime.mjs ./logic/runtime/dot_rewrite.mjs ./logic/verify/verify_endian_compatibility.mjs ./logic/tools/make_logic_packet.mjs ./logic/runtime/logic_packet_replay.mjs ./logic/verify/verify_logic_packet_replay.mjs
	node ./logic/tools/rebuild_all_attestation.mjs

bitboards: $(POLYLOG) test-rule-source
	chmod +x ./logic/tools/export_polyform_bitboards.sh
	./logic/tools/export_polyform_bitboards.sh

graph-bitboards: $(POLYLOG) test-rule-source
	chmod +x ./logic/tools/export_control_graph_bitboards.sh
	./logic/tools/export_control_graph_bitboards.sh

deterministic: $(POLYLOG)
	chmod +x ./logic/tools/run_rule_source.sh ./logic/verify/verify_bridge_fact_equivalence.sh ./logic/tools/export_polyform_bitboards.sh ./logic/tools/export_control_graph_bitboards.sh ./logic/tools/deterministic_replay.sh
	$(MAKE) verify-bridge-replay
	$(MAKE) verify-coreform-chain
	$(MAKE) verify-bitboard-authority
	cd ./polyform/org && npm run verify-bridge && npm run verify-bridge-golden
	./logic/tools/deterministic_replay.sh

guix-pull:
	guix pull -C guix/channels.scm

guix-shell-core:
	guix shell -m guix/manifest-core.scm

guix-shell-dev:
	guix shell -m guix/manifest-core.scm -m guix/manifest-editors.scm

guix-shell-rendering:
	guix shell -m guix/manifest-core.scm -m guix/manifest-rendering.scm

guix-shell-full:
	guix shell -m guix/manifest-core.scm -m guix/manifest-rendering.scm -m guix/manifest-editors.scm

clean:
	rm -f $(TARGET) $(PAIR_TARGET) $(POLYLOG) $(VIEWER_BIN) /tmp/logic-interp.sexpr.out /tmp/logic-interp.ratio.out /tmp/logic-interp.bcd.out /tmp/logic-interp.factoradic.out /tmp/logic-interp.prolog.out /tmp/pair-machine.out /tmp/polylog.fact.out /tmp/polylog.rule.out /tmp/polylog.bootstrap.out /tmp/polylog.wordnet.out logic/generated/lock_state.ndjson logic/generated/surface_equivalence_receipts.ndjson logic/generated/surface_equivalence_summary.ndjson logic/generated/surface_projection_profile.ndjson logic/generated/devdocs_reference_warnings.ndjson logic/generated/wordnet_synset_graph.ndjson logic/generated/logic_packet_v0_sample.json logic/generated/logic_packet_v0_replay_receipt.ndjson
