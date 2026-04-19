/*
 * ttc_tal.h - Typed Assembly Language for Stars & Bars
 *
 * Constitutional Law Enforcement at the Assembly Level:
 *   - Every value has a type annotation
 *   - Type checker can prove safety statically
 *   - No bytecode interpreter - native execution
 *   - Trusted execution environment via type verification
 *
 * TAL Instruction Set for Stars & Bars:
 *   ★ (JOIN)   -> pair construction / struct composition
 *   | (COMPOSE) -> union construction / sequence concatenation
 *   _ (EMPTY)  -> unit type / null pointer
 *
 * Type System (with Wallis Accents):
 *   τ ::= unit | addr240 | braille | hexagram 
 *        | τ × τ | τ + τ | list τ
 *        | 60⁰ (DEGREE) | 60⁻¹ (PRIME) | 60⁻² (SECOND) | 60⁻³ (TIERCE)
 *
 * Registers:
 *   %acc   - accumulator (current surface node)
 *   %ctx   - witness context (address, incidence)
 *   %stack - evaluation stack
 *   %pc    - program counter (type-annotated)
 */

#ifndef TTC_TAL_H
#define TTC_TAL_H

#include <stdint.h>
#include <stddef.h>

/* ============================================================================
 * TYPES (First-class type tags) - INCLUDING WALLIS ACCENTS
 * ============================================================================ */

typedef enum ttc_type_tag {
    /* Base types */
    TTC_TYPE_UNIT = 0,          /* _ - empty */
    TTC_TYPE_ADDR240 = 1,        /* address in 240-space */
    TTC_TYPE_BRAILLE = 2,       /* 8-dot braille cell */
    TTC_TYPE_HEXAGRAM = 3,      /* 6-line hexagram */
    
    /* Composite types */
    TTC_TYPE_PAIR = 4,          /* ★ - join of two types */
    TTC_TYPE_UNION = 5,         /* | - compose of two types */
    TTC_TYPE_LIST = 6,          /* sequence of same type */
    TTC_TYPE_CONTEXT = 7,        /* witness context */
    TTC_TYPE_RECEIPT = 8,        /* reconciliation receipt */
    
    /* ====== WALLIS ACCENTS (Sexagesimal Positions) ====== */
    /* These are the "Wallis Accents" - the positional tags for 60^n */
    
    TTC_TYPE_WALLIS_DEGREE = 16,   /* 60⁰ = degree (root) */
    TTC_TYPE_WALLIS_PRIME = 17,     /* 60⁻¹ = prime (first division) */
    TTC_TYPE_WALLIS_SECOND = 18,    /* 60⁻² = second (second division) */
    TTC_TYPE_WALLIS_TIERCE = 19,   /* 60⁻³ = tierce (third division) */
    TTC_TYPE_WALLIS_QUAD = 20,      /* 60⁻⁴ = fourth division */
    
    /* Compound Wallis types */
    TTC_TYPE_SEXAGESIMAL = 24,      /* Full sexagesimal number */
    TTC_TYPE_FRACTION = 25,         /* Numerator/Denominator pair */
    
    /* ====== CONSTITUTIONAL DERIVED TYPES ====== */
    TTC_TYPE_BOM = 32,             /* Byte Order Mark (FFFE/FEFF) */
    TTC_TYPE_FINGERPRINT = 33,     /* Witness fingerprint */
    TTC_TYPE_WITNESS = 34,         /* Full witness record */
} ttc_type_tag_t;

/* Type descriptor (canonical representation) */
typedef struct ttc_type {
    ttc_type_tag_t tag;
    union {
        /* Pair/Union */
        struct { struct ttc_type *left; struct ttc_type *right; } pair;
        struct { struct ttc_type *left; struct ttc_type *right; } union_;
        struct { struct ttc_type *elem; size_t count; } list;
        
        /* Address */
        struct { uint32_t raw; } addr240;
        
        /* Braille/Hexagram */
        struct { uint8_t cell; } braille;
        struct { uint8_t lines; } hexagram;
        
        /* Incidence (layer, x, y, z) */
        struct { uint32_t layer; uint32_t x; uint32_t y; uint32_t z; } incidence;
        
        /* Wallis sexagesimal position */
        struct { int32_t exponent; uint32_t coefficient; } wallis;
        
        /* Sexagesimal full number */
        struct { struct ttc_type *whole; struct ttc_type *fraction; } sexagesimal;
        
        /* Witness */
        struct { uint32_t phase; uint32_t fingerprint; uint64_t state; } witness;
    };
} ttc_type_t;

/* ============================================================================
 * TYPED VALUES
 * ============================================================================ */

/* Typed value - pairs a value with its type annotation */
typedef struct ttc_value {
    ttc_type_t *type;
    union {
        void *ptr;
        uint64_t word;
        uint32_t addr;
        struct { struct ttc_value *first; struct ttc_value *second; } pair;
        struct { struct ttc_value *left; struct ttc_value *right; } union_;
        struct { struct ttc_value **elems; size_t count; } list;
    };
} ttc_value_t;

/* ============================================================================
 * TAL REGISTER FILE
 * ============================================================================ */

typedef struct ttc_registers {
    ttc_value_t *acc;       /* accumulator */
    ttc_value_t *ctx;       /* witness context */
    ttc_value_t *stack;     /* evaluation stack */
    ttc_value_t *pc;        /* program counter (type-annotated) */
    ttc_value_t *fp;        /* frame pointer */
    ttc_value_t *sp;        /* stack pointer */
    
    /* Type-annotated general purpose registers */
    ttc_value_t *r[16];
} ttc_registers_t;

/* ============================================================================
 * TAL INSTRUCTION FORMAT
 * ============================================================================ */

typedef enum ttc_opcode {
    /* Surface operations */
    TAL_JOIN = 0x01,        /* ★ - pair construction */
    TAL_COMPOSE = 0x02,     /* | - union construction */
    TAL_EMPTY = 0x03,       /* _ - unit value */
    
    /* Type operations */
    TAL_CHECK = 0x10,       /* type check */
    TAL_CAST = 0x11,        /* safe cast (preserves type) */
    TAL_UNPACK = 0x12,      /* unpack pair/union */
    
    /* Address operations */
    TAL_ADDR = 0x20,         /* load address */
    TAL_BIND = 0x21,        /* bind address to context */
    
    /* ====== WALLIS ACCENT OPERATIONS ====== */
    TAL_WALLIS = 0x28,      /* Apply Wallis position tag */
    TAL_TO_DEGREE = 0x29,   /* Convert to 60⁰ */
    TAL_TO_PRIME = 0x2A,    /* Convert to 60⁻¹ */
    TAL_TO_SECOND = 0x2B,    /* Convert to 60⁻² */
    TAL_TO_TIERCE = 0x2C,   /* Convert to 60⁻³ */
    
    /* Projection operations */
    TAL_BRAILLE = 0x30,     /* project to braille */
    TAL_HEXAGRAM = 0x31,    /* project to hexagram */
    
    /* Reconciliation operations */
    TAL_RECONCILE = 0x40,   /* reconcile against replay */
    TAL_RECEIPT = 0x41,     /* emit receipt */
    
    /* BOM operations */
    TAL_BOM_SET = 0x48,     /* Set BOM mode */
    TAL_BOM_FLIP = 0x49,    /* Flip BOM */
    
    /* Control flow */
    TAL_JMP = 0x50,         /* jump */
    TAL_JZ = 0x51,          /* jump if zero */
    TAL_CALL = 0x52,         /* call typed function */
    TAL_RET = 0x53,         /* return */
    
    /* Stack operations */
    TAL_PUSH = 0x60,        /* push to stack */
    TAL_POP = 0x61,         /* pop from stack */
    
    /* Halt */
    TAL_HALT = 0xFF
} ttc_opcode_t;

/* Typed instruction */
typedef struct ttc_instruction {
    ttc_opcode_t opcode;
    ttc_type_tag_t result_type;  /* type of result value */
    uint32_t operand;
    uint16_t reserved;
} __attribute__((packed)) ttc_instruction_t;

/* ============================================================================
 * TYPED PROGRAM
 * ============================================================================ */

typedef struct ttc_program {
    ttc_instruction_t *instructions;
    size_t instruction_count;
    ttc_type_t *entry_type;
    ttc_type_t *return_type;
    uint32_t checksum;
} ttc_program_t;

/* ============================================================================
 * TYPE CHECKER
 * ============================================================================ */

typedef struct ttc_type_context {
    ttc_type_t *reg_types[16];
    ttc_type_t *stack_type;
    ttc_type_t *return_type;
} ttc_type_context_t;

typedef enum ttc_check_result {
    TAL_CHECK_OK = 0,
    TAL_CHECK_TYPE_MISMATCH = -1,
    TAL_CHECK_UNBOUND_VARIABLE = -2,
    TAL_CHECK_INVALID_INSTRUCTION = -3,
    TAL_CHECK_STACK_UNDERFLOW = -4,
    TAL_CHECK_STACK_OVERFLOW = -5,
    TAL_CHECK_JOIN_ARITY = -6,
    TAL_CHECK_COMPOSE_ARITY = -7,
    TAL_CHECK_CONTEXT_MISSING = -8,
    TAL_CHECK_PROJECTION_ONLY = -9,
    TAL_CHECK_WALLIS_MISMATCH = -10,    /* Wallis accent mismatch */
} ttc_check_result_t;

ttc_check_result_t ttc_tal_check(
    const ttc_program_t *program,
    ttc_type_context_t *context,
    char **error_message
);

/* ============================================================================
 * TAL INTERPRETER
 * ============================================================================ */

typedef struct ttal_machine {
    ttc_registers_t regs;
    ttc_program_t *program;
    size_t pc;
    int halted;
    ttc_check_result_t last_error;
} ttc_tal_machine_t;

void ttc_tal_init(ttc_tal_machine_t *machine, ttc_program_t *program);
int ttc_tal_step(ttc_tal_machine_t *machine);
ttc_value_t *ttc_tal_run(ttc_tal_machine_t *machine);

/* ============================================================================
 * WALLIS ACCENT TYPE CONSTRUCTORS
 * ============================================================================ */

/* Create a Wallis accent type (sexagesimal position) */
static inline ttc_type_t *ttc_type_wallis(int exponent) {
    ttc_type_t *t = calloc(1, sizeof(ttc_type_t));
    if (!t) return NULL;
    
    switch (exponent) {
        case 0:  t->tag = TTC_TYPE_WALLIS_DEGREE; break;
        case -1: t->tag = TTC_TYPE_WALLIS_PRIME; break;
        case -2: t->tag = TTC_TYPE_WALLIS_SECOND; break;
        case -3: t->tag = TTC_TYPE_WALLIS_TIERCE; break;
        case -4: t->tag = TTC_TYPE_WALLIS_QUAD; break;
        default:  t->tag = TTC_TYPE_WALLIS_DEGREE; break;
    }
    t->wallis.exponent = exponent;
    t->wallis.coefficient = 0;
    return t;
}

/* Create full sexagesimal number */
static inline ttc_type_t *ttc_type_sexagesimal(ttc_type_t *whole, ttc_type_t *fraction) {
    ttc_type_t *t = calloc(1, sizeof(ttc_type_t));
    if (!t) return NULL;
    t->tag = TTC_TYPE_SEXAGESIMAL;
    t->sexagesimal.whole = whole;
    t->sexagesimal.fraction = fraction;
    return t;
}

/* Create address type */
static inline ttc_type_t *ttc_type_addr240(uint32_t addr) {
    ttc_type_t *t = calloc(1, sizeof(ttc_type_t));
    if (!t) return NULL;
    t->tag = TTC_TYPE_ADDR240;
    t->addr240.raw = addr;
    return t;
}

/* Create pair type */
static inline ttc_type_t *ttc_type_pair(ttc_type_t *left, ttc_type_t *right) {
    ttc_type_t *t = calloc(1, sizeof(ttc_type_t));
    if (!t) return NULL;
    t->tag = TTC_TYPE_PAIR;
    t->pair.left = left;
    t->pair.right = right;
    return t;
}

/* Create union type */
static inline ttc_type_t *ttc_type_union(ttc_type_t *left, ttc_type_t *right) {
    ttc_type_t *t = calloc(1, sizeof(ttc_type_t));
    if (!t) return NULL;
    t->tag = TTC_TYPE_UNION;
    t->union_.left = left;
    t->union_.right = right;
    return t;
}

/* ============================================================================
 * CONVENIENCE FUNCTIONS
 * ============================================================================ */

/* Create a typed value */
static inline ttc_value_t *ttc_value_new(ttc_type_t *type) {
    ttc_value_t *v = calloc(1, sizeof(ttc_value_t));
    if (!v) return NULL;
    v->type = type;
    return v;
}

/* Create a Wallis-accented value */
static inline ttc_value_t *ttc_value_wallis(uint32_t coefficient, int exponent) {
    ttc_type_t *t = ttc_type_wallis(exponent);
    if (!t) return NULL;
    t->wallis.coefficient = coefficient;
    return ttc_value_new(t);
}

/* Convert between Wallis positions */
static inline int wallis_convert(int from_exp, int to_exp, uint32_t *coeff) {
    int diff = from_exp - to_exp;
    if (diff > 0) {
        /* Moving to larger exponent: multiply by 60^diff */
        for (int i = 0; i < diff; i++) {
            if (*coeff > (UINT32_MAX / 60)) return -1; /* overflow */
            *coeff *= 60;
        }
    } else if (diff < 0) {
        /* Moving to smaller exponent: divide by 60^(-diff) */
        uint64_t temp = ((uint64_t)*coeff);
        for (int i = 0; i < -diff; i++) {
            temp /= 60;
        }
        *coeff = (uint32_t)temp;
    }
    return 0;
}

/* ============================================================================
 * STARS & BARS TO TAL COMPILER
 * ============================================================================ */

ttc_program_t *ttc_sb_to_tal(
    const void *node,
    const void *ctx,
    int *error
);

ttc_program_t *ttc_sb_string_to_tal(
    const char *expression,
    const void *ctx,
    int *error
);

void ttc_tal_program_free(ttc_program_t *program);
char *ttc_tal_disassemble(const ttc_program_t *program);

#endif /* TTC_TAL_H */