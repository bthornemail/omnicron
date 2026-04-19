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
POLYLOG := polylog
POLYLOG_SRC := prolog/polylog.c

.PHONY: all clean test test-polylog test-polylog-bootstrap test-rule-source bitboards graph-bitboards deterministic

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $@ $(SRC) $(LDFLAGS)

$(POLYLOG): $(POLYLOG_SRC)
	$(CC) $(CFLAGS) -o $@ $(POLYLOG_SRC) -lm $(LDFLAGS)

test: $(TARGET)
	printf '%s\n' '(+ 1 2 3)' | ./$(TARGET) > /tmp/logic-interp.sexpr.out
	grep -qx '6' /tmp/logic-interp.sexpr.out
	printf '%s\n%s\n' ':p' 'parent(john, mary).' '?- parent(X, mary).' ':q' | ./$(TARGET) > /tmp/logic-interp.prolog.out
	grep -q 'fact asserted.' /tmp/logic-interp.prolog.out
	grep -q 'X = john' /tmp/logic-interp.prolog.out

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

bitboards: $(POLYLOG) test-rule-source
	chmod +x ./prolog/export_polyform_bitboards.sh
	./prolog/export_polyform_bitboards.sh

graph-bitboards: $(POLYLOG) test-rule-source
	chmod +x ./prolog/export_control_graph_bitboards.sh
	./prolog/export_control_graph_bitboards.sh

deterministic: $(POLYLOG)
	chmod +x ./prolog/run_rule_source.sh ./prolog/export_polyform_bitboards.sh ./prolog/export_control_graph_bitboards.sh ./prolog/deterministic_replay.sh
	./prolog/deterministic_replay.sh

clean:
	rm -f $(TARGET) $(POLYLOG) /tmp/logic-interp.sexpr.out /tmp/logic-interp.prolog.out /tmp/polylog.fact.out /tmp/polylog.rule.out /tmp/polylog.bootstrap.out
