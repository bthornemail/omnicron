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
POLYLOG_SRC := prolog/polylog.c

.PHONY: all clean test test-pair-machine test-polylog test-polylog-bootstrap test-rule-source verify-bridge-replay verify-coreform-chain verify-bitboard-authority verify-render-contract verify-ontology-graph verify-classification-manifest ontology-graph ontology-graph-raster polyform-toolbox derive-polyform-patterns verify-polyform-toolbox rebuild-all bitboards graph-bitboards deterministic
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
	grep -qx '6' /tmp/logic-interp.sexpr.out
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

test-polylog: $(POLYLOG)
	printf '%s\n%s\n%s\n%s\n' ':p' 'parent(john, mary).' '?- parent(X, mary).' ':q' | ./$(POLYLOG) > /tmp/polylog.fact.out
	grep -q 'Fact asserted.' /tmp/polylog.fact.out
	grep -q 'X = john' /tmp/polylog.fact.out
	printf '%s\n%s\n%s\n%s\n%s\n' ':p' 'parent(john, mary).' 'ancestor(X, Y) :- parent(X, Y).' '?- ancestor(X, mary).' ':q' | ./$(POLYLOG) > /tmp/polylog.rule.out
	grep -q 'Clause asserted.' /tmp/polylog.rule.out
	grep -q 'X = john' /tmp/polylog.rule.out

test-polylog-bootstrap: $(POLYLOG)
	./$(POLYLOG) --prolog prolog/bootstrap_ingest.logic > /tmp/polylog.bootstrap.out
	grep -q 'Fact asserted.' /tmp/polylog.bootstrap.out
	grep -q 'Clause asserted.' /tmp/polylog.bootstrap.out

test-rule-source: $(POLYLOG)
	./prolog/run_rule_source.sh

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
	chmod +x ./prolog/verify_bridge_fact_equivalence.sh
	./prolog/verify_bridge_fact_equivalence.sh

verify-coreform-chain:
	chmod +x ./polyform/bitboards/verify_coreform_chain.mjs ./polyform/bitboards/coreform_logic_to_canonical_ndjson.mjs
	node ./polyform/bitboards/verify_coreform_chain.mjs

verify-bitboard-authority:
	chmod +x ./polyform/bitboards/verify_bitboard_authority.mjs ./polyform/bitboards/bitboard_to_canonical_ndjson.mjs
	node ./polyform/bitboards/verify_bitboard_authority.mjs

verify-render-contract:
	chmod +x ./prolog/verify_render_contract.mjs ./polyform/bitboards/bitboard_to_canonical_ndjson.mjs ./polyform/bitboards/coreform_logic_to_canonical_ndjson.mjs ./polyform/org/scripts/org_canonical_to_render_packet_ndjson.mjs ./polyform/org/scripts/org_render_packet_to_svg.mjs
	node ./prolog/verify_render_contract.mjs

ontology-graph:
	chmod +x ./prolog/generate_ontology_graph.mjs
	node ./prolog/generate_ontology_graph.mjs

ontology-graph-raster: ontology-graph
	chmod +x ./prolog/ontology_graph_to_pgm.mjs
	node ./prolog/ontology_graph_to_pgm.mjs ./prolog/ontology_graph.ndjson ./prolog/ontology_graph.pgm

verify-ontology-graph: ontology-graph
	chmod +x ./prolog/verify_ontology_graph.mjs
	node ./prolog/verify_ontology_graph.mjs

verify-classification-manifest:
	chmod +x ./authority/verify_classification_manifest.mjs
	node ./authority/verify_classification_manifest.mjs

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
	chmod +x ./prolog/verify_riscv_artifacts.sh ./prolog/rebuild_all_attestation.mjs ./prolog/verify_render_contract.mjs ./prolog/generate_ontology_graph.mjs ./prolog/ontology_graph_to_pgm.mjs ./prolog/verify_ontology_graph.mjs ./authority/verify_classification_manifest.mjs ./polyform/bitboards/verify_bitboard_authority.mjs ./polyform/bitboards/bitboard_to_canonical_ndjson.mjs ./polyform/bitboards/verify_coreform_chain.mjs ./polyform/bitboards/coreform_logic_to_canonical_ndjson.mjs ./polyform/org/scripts/canonical_identity.mjs ./polyform/org/scripts/org_canonical_to_render_packet_ndjson.mjs ./polyform/org/scripts/org_render_packet_to_svg.mjs ./polyform/scripts/polyform_toolbox.mjs ./prolog/verify_bridge_fact_equivalence.sh ./prolog/deterministic_replay.sh
	node ./prolog/rebuild_all_attestation.mjs

bitboards: $(POLYLOG) test-rule-source
	chmod +x ./prolog/export_polyform_bitboards.sh
	./prolog/export_polyform_bitboards.sh

graph-bitboards: $(POLYLOG) test-rule-source
	chmod +x ./prolog/export_control_graph_bitboards.sh
	./prolog/export_control_graph_bitboards.sh

deterministic: $(POLYLOG)
	chmod +x ./prolog/run_rule_source.sh ./prolog/verify_bridge_fact_equivalence.sh ./prolog/export_polyform_bitboards.sh ./prolog/export_control_graph_bitboards.sh ./prolog/deterministic_replay.sh
	$(MAKE) verify-bridge-replay
	$(MAKE) verify-coreform-chain
	$(MAKE) verify-bitboard-authority
	cd ./polyform/org && npm run verify-bridge && npm run verify-bridge-golden
	./prolog/deterministic_replay.sh

clean:
	rm -f $(TARGET) $(PAIR_TARGET) $(POLYLOG) $(VIEWER_BIN) /tmp/logic-interp.sexpr.out /tmp/logic-interp.prolog.out /tmp/pair-machine.out /tmp/polylog.fact.out /tmp/polylog.rule.out /tmp/polylog.bootstrap.out
