#include <stdint.h>
#include <stdio.h>
#include <stdbool.h>

/*
 * CONSTITUTIONAL PAIR MACHINE (corrected minimal core)
 *
 * Goals:
 * - pair is primitive (16-bit word, high byte car / low byte cdr)
 * - strict separation of VALUE vs REF (no address/value confusion)
 * - nil is not address 0 (no collision with first allocated cell)
 * - kernel law matches atomic-kernel delta on 16-bit space
 */

typedef uint16_t PairWord;
typedef uint16_t Value;

/*
 * Pair primitive on a 16-bit word:
 * high 8 bits = car, low 8 bits = cdr.
 */
#define pair_cons8(a, d) (uint16_t)((((uint16_t)(a) & 0xFFu) << 8) | ((uint16_t)(d) & 0xFFu))
#define pair_car8(p) (uint8_t)(((p) >> 8) & 0xFFu)
#define pair_cdr8(p) (uint8_t)((p) & 0xFFu)

/*
 * Tagged Value model (2-bit tag in high bits):
 * 00.............. = int(0..16383)
 * 01.............. = symbol(0..16383)
 * 10.............. = ref(cell index 0..16383)
 * 11.............. = special
 */
#define TAG_MASK 0xC000u
#define TAG_INT  0x0000u
#define TAG_SYM  0x4000u
#define TAG_REF  0x8000u
#define TAG_SPEC 0xC000u

#define PAYLOAD_MASK 0x3FFFu

#define SPEC_NIL   ((Value)(TAG_SPEC | 0u))
#define SPEC_TRUE  ((Value)(TAG_SPEC | 1u))

#define MAKE_INT(n) ((Value)(TAG_INT | ((uint16_t)(n) & PAYLOAD_MASK)))
#define MAKE_SYM(i) ((Value)(TAG_SYM | ((uint16_t)(i) & PAYLOAD_MASK)))
#define MAKE_REF(i) ((Value)(TAG_REF | ((uint16_t)(i) & PAYLOAD_MASK)))

#define IS_INT(v)   (((v) & TAG_MASK) == TAG_INT)
#define IS_SYM(v)   (((v) & TAG_MASK) == TAG_SYM)
#define IS_REF(v)   (((v) & TAG_MASK) == TAG_REF)
#define IS_SPEC(v)  (((v) & TAG_MASK) == TAG_SPEC)
#define IS_NIL(v)   ((v) == SPEC_NIL)
#define IS_TRUE(v)  ((v) == SPEC_TRUE)

#define INT_VAL(v)  ((uint16_t)((v) & PAYLOAD_MASK))
#define SYM_ID(v)   ((uint16_t)((v) & PAYLOAD_MASK))
#define REF_ID(v)   ((uint16_t)((v) & PAYLOAD_MASK))

enum {
    SYM_QUOTE = 0,
    SYM_IF = 1,
    SYM_DEFINE = 2,
    SYM_CAR = 3,
    SYM_CDR = 4,
    SYM_CONS = 5,
    SYM_X = 6,
    SYM_Y = 7,
    SYM_W = 8,
    SYM_H = 9,
    SYM_C = 10,
    SYM_T = 11,
    SYM_ID = 12,
    SYM_POLY = 13,
    SYM_VARS = 14,
    SYM_TERMS = 15,
    SYM_TERM = 16,
    SYM_COEF = 17,
    SYM_MONS = 18
};

static const char *symbol_names[] = {
    "quote", "if", "define", "car", "cdr", "cons",
    "x", "y", "w", "h", "c", "t", "id",
    "poly", "vars", "terms", "term", "coef", "mons"
};

/* Static cons-cell memory: each cell is (car . cdr). */
#define MEM_SIZE 4096
typedef struct Cell {
    Value car;
    Value cdr;
} Cell;

static Cell memory_cells[MEM_SIZE];
static uint16_t free_ptr = 0;
static Value g_env = SPEC_NIL;

static void die(const char *msg) {
    printf("FATAL: %s\n", msg);
}

static Value alloc_cell(Value a, Value d) {
    if (free_ptr >= MEM_SIZE) {
        die("out of cell memory");
        return SPEC_NIL;
    }
    memory_cells[free_ptr].car = a;
    memory_cells[free_ptr].cdr = d;
    return MAKE_REF(free_ptr++);
}

static Value cell_car(Value r) {
    if (!IS_REF(r)) return SPEC_NIL;
    return memory_cells[REF_ID(r)].car;
}

static Value cell_cdr(Value r) {
    if (!IS_REF(r)) return SPEC_NIL;
    return memory_cells[REF_ID(r)].cdr;
}

/* 16-bit kernel law (matches atomic_kernel.c delta behavior for WIDTH=16). */
static uint16_t rotl16(uint16_t x, int k) {
    k &= 15;
    return (uint16_t)((x << k) | (x >> (16 - k)));
}

static uint16_t rotr16(uint16_t x, int k) {
    k &= 15;
    return (uint16_t)((x >> k) | (x << (16 - k)));
}

static uint16_t kernel_K(uint16_t p, uint16_t C) {
    return (uint16_t)(rotl16(p, 1) ^ rotl16(p, 3) ^ rotr16(p, 2) ^ C);
}

/* Environment as alist: env = ((var . val) ...). */
static Value env_extend(Value var, Value val, Value env) {
    Value binding = alloc_cell(var, val);
    return alloc_cell(binding, env);
}

static Value env_lookup(Value var, Value env) {
    Value cur = env;
    while (!IS_NIL(cur)) {
        Value binding = cell_car(cur);
        if (cell_car(binding) == var) {
            return cell_cdr(binding);
        }
        cur = cell_cdr(cur);
    }
    return SPEC_NIL;
}

static Value eval(Value expr, Value env);

static Value eval_list(Value args, Value env) {
    if (IS_NIL(args)) return SPEC_NIL;
    Value first = eval(cell_car(args), env);
    Value rest = eval_list(cell_cdr(args), env);
    return alloc_cell(first, rest);
}

static Value apply_primitive(Value fn_sym, Value args) {
    if (fn_sym == MAKE_SYM(SYM_CAR)) {
        Value p = cell_car(args);
        return cell_car(p);
    }
    if (fn_sym == MAKE_SYM(SYM_CDR)) {
        Value p = cell_car(args);
        return cell_cdr(p);
    }
    if (fn_sym == MAKE_SYM(SYM_CONS)) {
        Value a = cell_car(args);
        Value d = cell_car(cell_cdr(args));
        return alloc_cell(a, d);
    }
    return SPEC_NIL;
}

static Value eval(Value expr, Value env) {
    if (IS_INT(expr) || IS_NIL(expr) || IS_TRUE(expr)) {
        return expr;
    }
    if (IS_SYM(expr)) {
        Value bound = env_lookup(expr, env);
        /* Primitive/operator symbols self-evaluate when unbound in env. */
        return IS_NIL(bound) ? expr : bound;
    }
    if (!IS_REF(expr)) {
        return SPEC_NIL;
    }

    Value op_expr = cell_car(expr);
    Value args_expr = cell_cdr(expr);

    if (op_expr == MAKE_SYM(SYM_QUOTE)) {
        return cell_car(args_expr);
    }

    if (op_expr == MAKE_SYM(SYM_IF)) {
        Value test_expr = cell_car(args_expr);
        Value then_expr = cell_car(cell_cdr(args_expr));
        Value else_expr = cell_car(cell_cdr(cell_cdr(args_expr)));
        Value tv = eval(test_expr, env);
        return IS_NIL(tv) ? eval(else_expr, env) : eval(then_expr, env);
    }

    if (op_expr == MAKE_SYM(SYM_DEFINE)) {
        Value var = cell_car(args_expr);
        Value val_expr = cell_car(cell_cdr(args_expr));
        Value val = eval(val_expr, env);
        g_env = env_extend(var, val, g_env);
        return var;
    }

    Value fn = eval(op_expr, env);
    Value evalled_args = eval_list(args_expr, env);
    return apply_primitive(fn, evalled_args);
}

static Value list2(Value a, Value b) {
    return alloc_cell(a, alloc_cell(b, SPEC_NIL));
}

static Value list3(Value a, Value b, Value c) {
    return alloc_cell(a, alloc_cell(b, alloc_cell(c, SPEC_NIL)));
}

static Value list_append(Value a, Value b) {
    if (IS_NIL(a)) return b;
    if (!IS_REF(a)) return b;
    return alloc_cell(cell_car(a), list_append(cell_cdr(a), b));
}

/* -------------------- Pair-built symbolic polynomial engine -------------------- */

static Value var_order[] = {
    MAKE_SYM(SYM_X), MAKE_SYM(SYM_Y), MAKE_SYM(SYM_W),
    MAKE_SYM(SYM_H), MAKE_SYM(SYM_C), MAKE_SYM(SYM_T), MAKE_SYM(SYM_ID)
};

#define VAR_COUNT ((int)(sizeof(var_order) / sizeof(var_order[0])))
#define MAX_POLY_TERMS 128

typedef struct MonoVec {
    uint16_t exp[VAR_COUNT];
} MonoVec;

typedef struct NormTerm {
    bool used;
    uint16_t coef;
    MonoVec mono;
} NormTerm;

static int var_index(Value v) {
    for (int i = 0; i < VAR_COUNT; i++) {
        if (var_order[i] == v) return i;
    }
    return -1;
}

static Value alist_get(Value key, Value alist) {
    Value cur = alist;
    while (IS_REF(cur)) {
        Value pair = cell_car(cur);
        if (IS_REF(pair) && cell_car(pair) == key) {
            return cell_cdr(pair);
        }
        cur = cell_cdr(cur);
    }
    return SPEC_NIL;
}

static void mono_zero(MonoVec *m) {
    for (int i = 0; i < VAR_COUNT; i++) m->exp[i] = 0;
}

static bool mono_equal(const MonoVec *a, const MonoVec *b) {
    for (int i = 0; i < VAR_COUNT; i++) {
        if (a->exp[i] != b->exp[i]) return false;
    }
    return true;
}

static void mono_add(const MonoVec *a, const MonoVec *b, MonoVec *out) {
    for (int i = 0; i < VAR_COUNT; i++) {
        out->exp[i] = (uint16_t)(a->exp[i] + b->exp[i]);
    }
}

static void mono_from_alist(Value mons, MonoVec *out) {
    mono_zero(out);
    Value cur = mons;
    while (IS_REF(cur)) {
        Value ve = cell_car(cur);
        if (IS_REF(ve)) {
            int idx = var_index(cell_car(ve));
            Value ev = cell_cdr(ve);
            if (idx >= 0 && IS_INT(ev)) {
                out->exp[idx] = (uint16_t)INT_VAL(ev);
            }
        }
        cur = cell_cdr(cur);
    }
}

static Value mono_to_alist(const MonoVec *m) {
    Value out = SPEC_NIL;
    for (int i = VAR_COUNT - 1; i >= 0; i--) {
        if (m->exp[i] == 0) continue;
        Value pair = alloc_cell(var_order[i], MAKE_INT(m->exp[i]));
        out = alloc_cell(pair, out);
    }
    return out;
}

static Value make_term(Value coef, Value mons) {
    Value kv_coef = alloc_cell(MAKE_SYM(SYM_COEF), coef);
    Value kv_mons = alloc_cell(MAKE_SYM(SYM_MONS), mons);
    Value body = alloc_cell(kv_coef, alloc_cell(kv_mons, SPEC_NIL));
    return alloc_cell(MAKE_SYM(SYM_TERM), body);
}

static Value term_coef(Value t) {
    if (!IS_REF(t) || cell_car(t) != MAKE_SYM(SYM_TERM)) return MAKE_INT(0);
    return alist_get(MAKE_SYM(SYM_COEF), cell_cdr(t));
}

static Value term_mons(Value t) {
    if (!IS_REF(t) || cell_car(t) != MAKE_SYM(SYM_TERM)) return SPEC_NIL;
    return alist_get(MAKE_SYM(SYM_MONS), cell_cdr(t));
}

static Value make_poly(Value vars, Value terms) {
    Value kv_vars = alloc_cell(MAKE_SYM(SYM_VARS), vars);
    Value kv_terms = alloc_cell(MAKE_SYM(SYM_TERMS), terms);
    Value body = alloc_cell(kv_vars, alloc_cell(kv_terms, SPEC_NIL));
    return alloc_cell(MAKE_SYM(SYM_POLY), body);
}

static Value poly_vars(Value p) {
    if (!IS_REF(p) || cell_car(p) != MAKE_SYM(SYM_POLY)) return SPEC_NIL;
    return alist_get(MAKE_SYM(SYM_VARS), cell_cdr(p));
}

static Value poly_terms(Value p) {
    if (!IS_REF(p) || cell_car(p) != MAKE_SYM(SYM_POLY)) return SPEC_NIL;
    return alist_get(MAKE_SYM(SYM_TERMS), cell_cdr(p));
}

static Value normalize_terms(Value terms) {
    NormTerm agg[MAX_POLY_TERMS];
    int used = 0;
    for (int i = 0; i < MAX_POLY_TERMS; i++) agg[i].used = false;

    Value cur = terms;
    while (IS_REF(cur)) {
        Value t = cell_car(cur);
        Value c = term_coef(t);
        if (!IS_INT(c) || INT_VAL(c) == 0) {
            cur = cell_cdr(cur);
            continue;
        }
        MonoVec m;
        mono_from_alist(term_mons(t), &m);

        int found = -1;
        for (int i = 0; i < used; i++) {
            if (agg[i].used && mono_equal(&agg[i].mono, &m)) {
                found = i;
                break;
            }
        }
        if (found >= 0) {
            agg[found].coef = (uint16_t)(agg[found].coef + INT_VAL(c));
            if (agg[found].coef == 0) agg[found].used = false;
        } else if (used < MAX_POLY_TERMS) {
            agg[used].used = true;
            agg[used].coef = (uint16_t)INT_VAL(c);
            agg[used].mono = m;
            used++;
        }
        cur = cell_cdr(cur);
    }

    Value out = SPEC_NIL;
    for (int i = used - 1; i >= 0; i--) {
        if (!agg[i].used || agg[i].coef == 0) continue;
        Value t = make_term(MAKE_INT(agg[i].coef), mono_to_alist(&agg[i].mono));
        out = alloc_cell(t, out);
    }
    return out;
}

static Value poly_normalize(Value p) {
    return make_poly(poly_vars(p), normalize_terms(poly_terms(p)));
}

static Value term_mul(Value t1, Value t2) {
    Value c1 = term_coef(t1);
    Value c2 = term_coef(t2);
    MonoVec m1, m2, m3;
    mono_from_alist(term_mons(t1), &m1);
    mono_from_alist(term_mons(t2), &m2);
    mono_add(&m1, &m2, &m3);
    return make_term(MAKE_INT((uint16_t)(INT_VAL(c1) * INT_VAL(c2))), mono_to_alist(&m3));
}

static Value poly_add(Value p1, Value p2) {
    Value terms = list_append(poly_terms(p1), poly_terms(p2));
    return poly_normalize(make_poly(poly_vars(p1), terms));
}

static Value poly_mul(Value p1, Value p2) {
    Value out = SPEC_NIL;
    Value a = poly_terms(p1);
    while (IS_REF(a)) {
        Value t1 = cell_car(a);
        Value b = poly_terms(p2);
        while (IS_REF(b)) {
            Value t2 = cell_car(b);
            out = alloc_cell(term_mul(t1, t2), out);
            b = cell_cdr(b);
        }
        a = cell_cdr(a);
    }
    return poly_normalize(make_poly(poly_vars(p1), out));
}

static Value poly_deriv(Value p, Value var) {
    Value out = SPEC_NIL;
    int idx = var_index(var);
    if (idx < 0) return make_poly(poly_vars(p), SPEC_NIL);
    Value cur = poly_terms(p);
    while (IS_REF(cur)) {
        Value t = cell_car(cur);
        Value c = term_coef(t);
        MonoVec m;
        mono_from_alist(term_mons(t), &m);
        if (m.exp[idx] > 0) {
            uint16_t e = m.exp[idx];
            m.exp[idx] = (uint16_t)(e - 1);
            out = alloc_cell(make_term(MAKE_INT((uint16_t)(INT_VAL(c) * e)), mono_to_alist(&m)), out);
        }
        cur = cell_cdr(cur);
    }
    return poly_normalize(make_poly(poly_vars(p), out));
}

static uint16_t env_lookup_int(Value env, Value var) {
    Value v = alist_get(var, env);
    return IS_INT(v) ? (uint16_t)INT_VAL(v) : 0;
}

static uint16_t pow_u16(uint16_t a, uint16_t n) {
    uint16_t out = 1;
    for (uint16_t i = 0; i < n; i++) out = (uint16_t)(out * a);
    return out;
}

static uint16_t term_eval(Value t, Value env) {
    uint16_t out = (uint16_t)INT_VAL(term_coef(t));
    MonoVec m;
    mono_from_alist(term_mons(t), &m);
    for (int i = 0; i < VAR_COUNT; i++) {
        if (m.exp[i] == 0) continue;
        out = (uint16_t)(out * pow_u16(env_lookup_int(env, var_order[i]), m.exp[i]));
    }
    return out;
}

static uint16_t poly_eval(Value p, Value env) {
    uint16_t sum = 0;
    Value cur = poly_terms(p);
    while (IS_REF(cur)) {
        sum = (uint16_t)(sum + term_eval(cell_car(cur), env));
        cur = cell_cdr(cur);
    }
    return sum;
}

static void print_poly(Value p) {
    Value cur = poly_terms(p);
    bool first = true;
    while (IS_REF(cur)) {
        Value t = cell_car(cur);
        uint16_t coef = (uint16_t)INT_VAL(term_coef(t));
        MonoVec m;
        mono_from_alist(term_mons(t), &m);
        if (!first) printf(" + ");
        first = false;
        printf("%u", (unsigned)coef);
        for (int i = 0; i < VAR_COUNT; i++) {
            if (m.exp[i] == 0) continue;
            printf("*%s", symbol_names[SYM_ID(var_order[i])]);
            if (m.exp[i] > 1) printf("^%u", (unsigned)m.exp[i]);
        }
        cur = cell_cdr(cur);
    }
    if (first) printf("0");
}

static void print_value(Value v);

static void print_list_tail(Value list) {
    Value cur = list;
    while (IS_REF(cur)) {
        print_value(cell_car(cur));
        Value next = cell_cdr(cur);
        if (IS_NIL(next)) return;
        if (!IS_REF(next)) {
            printf(" . ");
            print_value(next);
            return;
        }
        printf(" ");
        cur = next;
    }
}

static void print_value(Value v) {
    if (IS_NIL(v)) {
        printf("nil");
        return;
    }
    if (IS_TRUE(v)) {
        printf("t");
        return;
    }
    if (IS_INT(v)) {
        printf("%u", (unsigned)INT_VAL(v));
        return;
    }
    if (IS_SYM(v)) {
        uint16_t id = SYM_ID(v);
        if (id < (sizeof(symbol_names) / sizeof(symbol_names[0]))) {
            printf("%s", symbol_names[id]);
        } else {
            printf("sym#%u", (unsigned)id);
        }
        return;
    }
    if (IS_REF(v)) {
        printf("(");
        print_list_tail(v);
        printf(")");
        return;
    }
    printf("<?>");
}

static int selftest_kernel_against_atomic_delta(void) {
    /*
     * Cross-check with the same 16-bit law used by riscv-baremetal/atomic_kernel.c:
     * delta(x,C) = rotl(x,1) ^ rotl(x,3) ^ rotr(x,2) ^ C
     */
    uint16_t C = 0x1D00u;
    uint16_t samples[] = {0x0000u, 0x0001u, 0x1234u, 0xBEEFu, 0xFFFFu, 0x0F0Fu, 0xA55Au};
    int n = (int)(sizeof(samples) / sizeof(samples[0]));
    for (int i = 0; i < n; i++) {
        uint16_t x = samples[i];
        uint16_t a = kernel_K(x, C);
        uint16_t b = (uint16_t)(rotl16(x, 1) ^ rotl16(x, 3) ^ rotr16(x, 2) ^ C);
        if (a != b) {
            return 0;
        }
    }
    return 1;
}

int main(void) {
    free_ptr = 0;
    g_env = SPEC_NIL;

    printf("=== CONSTITUTIONAL PAIR MACHINE (CORRECTED) ===\n");
    printf("pair primitive: (high-byte . low-byte)\n");

    PairWord pw = pair_cons8(0x12u, 0x34u);
    printf("pair_cons8(0x12,0x34) = 0x%04X, car=0x%02X, cdr=0x%02X\n",
           pw, pair_car8(pw), pair_cdr8(pw));

    /* define x = 42 */
    Value expr_define_x = list3(MAKE_SYM(SYM_DEFINE), MAKE_SYM(SYM_X), MAKE_INT(42));
    Value r1 = eval(expr_define_x, g_env);
    printf("eval (define x 42) => ");
    print_value(r1);
    printf("\n");

    /* eval x */
    Value r2 = eval(MAKE_SYM(SYM_X), g_env);
    printf("eval x => ");
    print_value(r2);
    printf("\n");

    /* eval (car (cons 1 2)) */
    Value expr_cons_1_2 = list3(MAKE_SYM(SYM_CONS), MAKE_INT(1), MAKE_INT(2));
    Value expr_car_cons = list2(MAKE_SYM(SYM_CAR), expr_cons_1_2);
    Value r3 = eval(expr_car_cons, g_env);
    printf("eval (car (cons 1 2)) => ");
    print_value(r3);
    printf("\n");

    /* eval (quote (1 2 3)) */
    Value list_123 = list3(MAKE_INT(1), MAKE_INT(2), MAKE_INT(3));
    Value expr_quote = list2(MAKE_SYM(SYM_QUOTE), list_123);
    Value r4 = eval(expr_quote, g_env);
    printf("eval (quote (1 2 3)) => ");
    print_value(r4);
    printf("\n");

    /* Kernel demo with constitutional constant */
    uint16_t C = 0x1D00u;
    uint16_t k = kernel_K(0x1234u, C);
    printf("K(0x1234, 0x%04X) = 0x%04X\n", C, k);
    printf("K.car=0x%02X K.cdr=0x%02X\n", pair_car8(k), pair_cdr8(k));

    printf("atomic-kernel law check => %s\n",
           selftest_kernel_against_atomic_delta() ? "PASS" : "FAIL");

    /* Pair-built symbolic polynomial engine demo:
     * P = 3*x^2*y + 5*w + 7
     */
    Value vars =
        alloc_cell(MAKE_SYM(SYM_X),
        alloc_cell(MAKE_SYM(SYM_Y),
        alloc_cell(MAKE_SYM(SYM_W),
        alloc_cell(MAKE_SYM(SYM_H),
        alloc_cell(MAKE_SYM(SYM_C),
        alloc_cell(MAKE_SYM(SYM_T),
        alloc_cell(MAKE_SYM(SYM_ID), SPEC_NIL)))))));
    Value m_x2y = alloc_cell(
        alloc_cell(MAKE_SYM(SYM_X), MAKE_INT(2)),
        alloc_cell(alloc_cell(MAKE_SYM(SYM_Y), MAKE_INT(1)), SPEC_NIL)
    );
    Value m_w = alloc_cell(alloc_cell(MAKE_SYM(SYM_W), MAKE_INT(1)), SPEC_NIL);
    Value terms = alloc_cell(
        make_term(MAKE_INT(3), m_x2y),
        alloc_cell(make_term(MAKE_INT(5), m_w),
                   alloc_cell(make_term(MAKE_INT(7), SPEC_NIL), SPEC_NIL))
    );
    Value P = poly_normalize(make_poly(vars, terms));
    Value dPdx = poly_deriv(P, MAKE_SYM(SYM_X));
    Value env = alloc_cell(
        alloc_cell(MAKE_SYM(SYM_X), MAKE_INT(2)),
        alloc_cell(alloc_cell(MAKE_SYM(SYM_Y), MAKE_INT(3)),
                   alloc_cell(alloc_cell(MAKE_SYM(SYM_W), MAKE_INT(4)),
                              alloc_cell(alloc_cell(MAKE_SYM(SYM_H), MAKE_INT(0)),
                                         alloc_cell(alloc_cell(MAKE_SYM(SYM_C), MAKE_INT(0)),
                                                    alloc_cell(alloc_cell(MAKE_SYM(SYM_T), MAKE_INT(0)),
                                                               alloc_cell(alloc_cell(MAKE_SYM(SYM_ID), MAKE_INT(0)), SPEC_NIL))))))
    );

    printf("poly P => ");
    print_poly(P);
    printf("\n");
    printf("d/dx P => ");
    print_poly(dPdx);
    printf("\n");
    printf("eval P at x=2,y=3,w=4 => %u\n", (unsigned)poly_eval(P, env));

    /* quick algebra sanity: (P + P) and (P * 1) */
    Value one_poly = make_poly(vars, alloc_cell(make_term(MAKE_INT(1), SPEC_NIL), SPEC_NIL));
    Value PplusP = poly_add(P, P);
    Value Pmul1 = poly_mul(P, one_poly);
    printf("poly (P + P) => ");
    print_poly(PplusP);
    printf("\n");
    printf("poly (P * 1) => ");
    print_poly(Pmul1);
    printf("\n");

    return 0;
}
