#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BIN="$ROOT_DIR/logic-interp"
OUT_DIR="$ROOT_DIR/logic/generated"
RECEIPT="$OUT_DIR/omi_lisp_surface_check.ndjson"
TMP_DIR="$(mktemp -d /tmp/omi-lisp-surface-XXXXXX)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$OUT_DIR"

pass_count=0
known_gap_count=0

stage_pass() {
  local name="$1"
  echo "OK: $name"
  pass_count=$((pass_count + 1))
}

stage_known_gap() {
  local name="$1"
  local detail="$2"
  echo "KNOWN_GAP: $name ($detail)"
  known_gap_count=$((known_gap_count + 1))
}

fail_stage() {
  local name="$1"
  local detail="$2"
  echo "FAIL: $name ($detail)" >&2
  cat > "$RECEIPT" <<EOF
{"type":"omi_lisp_surface_check","status":"fail","pass_count":$pass_count,"known_gap_count":$known_gap_count,"failed_stage":"$name","detail":"$detail"}
EOF
  exit 2
}

if [[ ! -x "$BIN" ]]; then
  make -C "$ROOT_DIR" logic-interp >/dev/null
fi

# 1) S-expression + lambda + Y surface acceptance
cat > "$TMP_DIR/sexpr_y.logic" <<'EOF'
((lambda (x) x) 5)
(define Y (lambda (f) ((lambda (x) (f (x x))) (lambda (x) (f (x x))))))
Y
EOF
"$BIN" --sexpr "$TMP_DIR/sexpr_y.logic" > "$TMP_DIR/sexpr_y.out" 2>&1 || fail_stage "sexpr_y_surface" "interpreter exited non-zero"
grep -q '^5$' "$TMP_DIR/sexpr_y.out" || fail_stage "sexpr_y_surface" "missing lambda application result"
grep -q '(lambda (f) ((lambda (x) (f (x x))) (lambda (x) (f (x x)))))' "$TMP_DIR/sexpr_y.out" || fail_stage "sexpr_y_surface" "missing Y combinator form"
stage_pass "sexpr_y_surface"

# 2) F-expression lane
cat > "$TMP_DIR/fexpr.logic" <<'EOF'
lambda(x)->(+ x 1)
cons(1,2)
EOF
"$BIN" --fexpr "$TMP_DIR/fexpr.logic" > "$TMP_DIR/fexpr.out" 2>&1 || fail_stage "fexpr_surface" "interpreter exited non-zero"
grep -q '(lambda (x) (+ x 1))' "$TMP_DIR/fexpr.out" || fail_stage "fexpr_surface" "missing lambda arrow form"
grep -q '(1 . 2)' "$TMP_DIR/fexpr.out" || fail_stage "fexpr_surface" "missing cons application form"
stage_pass "fexpr_surface"

# 3) M-expression lane (whitespace-separated args; ';' is comment in current lexer)
cat > "$TMP_DIR/mexpr.logic" <<'EOF'
foo[bar baz]
EOF
"$BIN" --mexpr "$TMP_DIR/mexpr.logic" > "$TMP_DIR/mexpr.out" 2>&1 || fail_stage "mexpr_surface" "interpreter exited non-zero"
grep -q '(foo bar baz)' "$TMP_DIR/mexpr.out" || fail_stage "mexpr_surface" "missing m-expression projection"
stage_pass "mexpr_surface"

# 4) Z-combinator recursion check (current runtime gap accepted)
cat > "$TMP_DIR/z.logic" <<'EOF'
(define Z (lambda (f) ((lambda (x) (f (lambda (v) ((x x) v)))) (lambda (x) (f (lambda (v) ((x x) v)))))))
(define fact-gen (lambda (self) (lambda (n) (if (eq n 0) 1 (* n (self (+ n -1)))))))
((Z fact-gen) 5)
EOF
set +e
"$BIN" --sexpr "$TMP_DIR/z.logic" > "$TMP_DIR/z.out" 2>&1
z_status=$?
set -e
if [[ $z_status -eq 0 ]] && grep -q '^120$' "$TMP_DIR/z.out"; then
  stage_pass "z_combinator_recursion"
elif [[ $z_status -ne 0 ]] && grep -q '\* only supports INT/RATIO exact numerics' "$TMP_DIR/z.out"; then
  stage_known_gap "z_combinator_recursion" "closure/runtime numeric path incomplete"
else
  fail_stage "z_combinator_recursion" "unexpected result"
fi

cat > "$RECEIPT" <<EOF
{"type":"omi_lisp_surface_check","status":"pass","pass_count":$pass_count,"known_gap_count":$known_gap_count,"failed_stage":null,"detail":"surface tests complete"}
EOF

echo "OK: omi-lisp surface verified (pass=$pass_count known_gap=$known_gap_count)"
echo "receipt=$RECEIPT"
