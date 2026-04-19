/*
 * OMNITRON COMPILATION PIPELINE
 * Lawful projections from logic forms to executable events.
 *
 * Pipeline stages:
 *   plain text -> Prolog/Datalog -> S-expr -> M-expr -> F-expr
 *   -> AST -> kernel events -> ASCII stream
 *
 * This header defines the portable interface only.
 * Implementations live in C translation units.
 */

#ifndef OMNITRON_PIPELINE_H
#define OMNITRON_PIPELINE_H

#include <stdbool.h>
#include <stdint.h>

/* ============================================================
 * CORE VALUE TYPES
 * ============================================================ */

/* Small concrete aliases used by the unified AST. */
typedef uint8_t Bit;      /* logical bit domain */
typedef uint8_t Tile16;   /* 4-bit tile id packed in 8 bits */
typedef uint8_t Mode4;    /* 2-bit mode packed in 8 bits */
typedef uint8_t Slot60;   /* 0..59 slot id packed in 8 bits */

typedef struct {
    Bit d[8];
} B8;

/* ============================================================
 * STAGE 0: ASCII CONTROL STREAM
 * ============================================================ */

typedef enum {
    ASCII_NUL = 0x00,
    ASCII_SOH = 0x01,
    ASCII_STX = 0x02,
    ASCII_ETX = 0x03,
    ASCII_EOT = 0x04,
    ASCII_ENQ = 0x05,
    ASCII_ACK = 0x06,
    ASCII_BEL = 0x07,
    ASCII_BS  = 0x08,
    ASCII_HT  = 0x09,
    ASCII_LF  = 0x0A,
    ASCII_VT  = 0x0B,
    ASCII_FF  = 0x0C,
    ASCII_CR  = 0x0D,
    ASCII_SO  = 0x0E,
    ASCII_SI  = 0x0F,
    ASCII_DLE = 0x10,
    ASCII_DC1 = 0x11,
    ASCII_DC2 = 0x12,
    ASCII_DC3 = 0x13,
    ASCII_DC4 = 0x14,
    ASCII_NAK = 0x15,
    ASCII_SYN = 0x16,
    ASCII_ETB = 0x17,
    ASCII_CAN = 0x18,
    ASCII_EM  = 0x19,
    ASCII_SUB = 0x1A,
    ASCII_ESC = 0x1B,
    ASCII_FS  = 0x1C,
    ASCII_GS  = 0x1D,
    ASCII_RS  = 0x1E,
    ASCII_US  = 0x1F,
    ASCII_DEL = 0x7F
} ASCIIControl;

typedef enum {
    EVENT_SYNC,
    EVENT_WAIT,
    EVENT_EMIT,
    EVENT_HASH,
    EVENT_MAP,
    EVENT_ROTATE_L,
    EVENT_ROTATE_R,
    EVENT_JOIN,
    EVENT_SPLIT,
    EVENT_LOAD,
    EVENT_SET_MODE,
    EVENT_SET_LINE,
    EVENT_SET_POINT,
    EVENT_QUERY,
    EVENT_ASSERT,
    EVENT_LAMBDA,
    EVENT_QUOTE,
    EVENT_UNIFY
} KernelEvent;

/* ============================================================
 * STAGE 1: F-EXPRESSION
 * ============================================================ */

typedef enum {
    FEXPR_LAMBDA,
    FEXPR_APPLY,
    FEXPR_LET,
    FEXPR_IF,
    FEXPR_BEGIN,
    FEXPR_OPCODE,
    FEXPR_VARIABLE,
    FEXPR_CONSTANT
} FExprType;

typedef struct FExpr FExpr;
struct FExpr {
    FExprType type;
    union {
        struct { char **params; int param_count; FExpr *body; } lambda;
        struct { FExpr *func; FExpr **args; int arg_count; } apply;
        struct { char *var; FExpr *value; FExpr *body; } let;
        struct { FExpr *cond; FExpr *then_expr; FExpr *else_expr; } if_expr;
        struct { FExpr **exprs; int expr_count; } begin;
        struct { char *opcode; FExpr **args; int arg_count; } opcode;
        char *variable;
        struct {
            int type;
            union { int64_t i; double f; char *s; } value;
        } constant;
    } data;
};

/* ============================================================
 * STAGE 2: M-EXPRESSION
 * ============================================================ */

typedef enum {
    MEXPR_APPLY,
    MEXPR_LAMBDA,
    MEXPR_LET,
    MEXPR_IF,
    MEXPR_BLOCK,
    MEXPR_QUOTE,
    MEXPR_ATOM,
    MEXPR_NUMBER,
    MEXPR_STRING
} MExprType;

typedef struct MExpr MExpr;
struct MExpr {
    MExprType type;
    union {
        struct { MExpr *func; MExpr **args; int arg_count; } apply;
        struct { MExpr **params; int param_count; MExpr *body; } lambda;
        struct { char *var; MExpr *value; MExpr *body; } let;
        struct { MExpr *cond; MExpr *then_expr; MExpr *else_expr; } if_expr;
        struct { MExpr **exprs; int expr_count; } block;
        MExpr *quote;
        char *atom;
        struct {
            bool is_float;
            union { int64_t i; double f; } value;
        } number;
        char *string;
    } data;
};

/* ============================================================
 * STAGE 3: S-EXPRESSION
 * ============================================================ */

typedef enum {
    SEXPR_CONS,
    SEXPR_NIL,
    SEXPR_SYMBOL,
    SEXPR_NUMBER,
    SEXPR_STRING,
    SEXPR_QUOTE,
    SEXPR_BACKQUOTE,
    SEXPR_COMMA,
    SEXPR_COMMA_AT
} SExprType;

typedef struct SExpr SExpr;
struct SExpr {
    SExprType type;
    union {
        struct { SExpr *car; SExpr *cdr; } cons;
        char *symbol;
        struct {
            bool is_float;
            union { int64_t i; double f; } value;
        } number;
        char *string;
        SExpr *quote;
        SExpr *backquote;
        SExpr *comma;
        SExpr *comma_at;
    } data;
};

/* ============================================================
 * STAGE 4: PROLOG / DATALOG
 * ============================================================ */

typedef enum {
    TERM_VAR,
    TERM_ATOM,
    TERM_INT,
    TERM_FLOAT,
    TERM_STRING,
    TERM_COMPOUND,
    TERM_LIST,
    TERM_NIL
} TermType;

typedef struct Term Term;
struct Term {
    TermType type;
    union {
        char *var_name;
        char *atom_name;
        int64_t int_value;
        double float_value;
        char *string_value;
        struct { char *functor; Term **args; int arg_count; } compound;
        struct { Term **elements; int count; Term *tail; } list;
    } data;
};

typedef enum {
    CLAUSE_FACT,
    CLAUSE_RULE,
    CLAUSE_QUERY
} ClauseType;

typedef struct Clause {
    ClauseType type;
    Term *head;
    Term **body;
    int body_count;
} Clause;

/* ============================================================
 * STAGE 5: UNIFIED AST
 * ============================================================ */

typedef enum {
    AST_NIL,
    AST_BIT,
    AST_TILE,
    AST_MODE,
    AST_SLOT,
    AST_BITS,
    AST_SYMBOL,
    AST_VARIABLE,
    AST_INT,
    AST_FLOAT,
    AST_STRING,
    AST_CONS,
    AST_PREDICATE,
    AST_CLAUSE,
    AST_LAMBDA,
    AST_APPLY,
    AST_QUOTE,
    AST_OPCODE,
    AST_EVENT
} ASTType;

typedef struct AST AST;
struct AST {
    ASTType type;
    uint64_t hash;
    struct {
        int line;
        int column;
        const char *source;
    } origin;
    union {
        Bit bit_value;
        Tile16 tile_value;
        Mode4 mode_value;
        Slot60 slot_value;
        B8 bits_value;
        char *symbol_name;
        char *var_name;
        int64_t int_value;
        double float_value;
        char *string_value;
        struct { AST *car; AST *cdr; } cons;
        struct { char *name; AST **args; int arg_count; } predicate;
        struct { AST *head; AST **body; int body_count; } clause;
        struct { AST **params; int param_count; AST *body; } lambda;
        struct { AST *func; AST **args; int arg_count; } apply;
        AST *quote;
        struct { KernelEvent event; Slot60 slot; AST *payload; } opcode;
    } data;
    AST *next;
};

/* ============================================================
 * PIPELINE TYPES
 * ============================================================ */

typedef struct EventStream {
    KernelEvent *events;
    int count;
    int capacity;
} EventStream;

typedef struct ASCIIStream {
    uint8_t *bytes;
    int length;
    int capacity;
} ASCIIStream;

typedef struct InvariantReport {
    bool predicate_identity_preserved;
    bool argument_order_preserved;
    bool stage_meaning_preserved;
    bool receipt_meaning_preserved;
    bool address_preserved;
    bool grammar_boundaries_preserved;
    const char *failure_reason;
} InvariantReport;

typedef struct Pipeline {
    const char *source_text;
    enum {
        FORM_PROLOG,
        FORM_DATALOG,
        FORM_SEXPR,
        FORM_MEXPR,
        FORM_FEXPR
    } detected_form;
    AST *ast;
    EventStream *events;
    ASCIIStream *ascii;
    InvariantReport verification;
} Pipeline;

/* ============================================================
 * PROJECTIONS
 * ============================================================ */

AST *parse_text(const char *text);

AST *prolog_to_ast(const Clause *clause);
AST *datalog_to_ast(const Clause *clause);
AST *sexpr_to_ast(const SExpr *sexpr);
AST *mexpr_to_ast(const MExpr *mexpr);
AST *fexpr_to_ast(const FExpr *fexpr);

SExpr *ast_to_sexpr(const AST *ast);
MExpr *ast_to_mexpr(const AST *ast);
FExpr *ast_to_fexpr(const AST *ast);
Clause *ast_to_prolog(const AST *ast);

EventStream *ast_to_events(const AST *ast);
EventStream *prolog_to_events(const char *source);
EventStream *sexpr_to_events(const char *source);

ASCIIStream *events_to_ascii(const EventStream *events);
EventStream *ascii_to_events(const ASCIIStream *ascii);

InvariantReport verify_projection(const AST *original, const AST *projected);

Pipeline *compile_pipeline(const char *source);
void free_pipeline(Pipeline *pipeline);

AST *stage_parse(const char *source);
EventStream *stage_compile(const AST *ast);
ASCIIStream *stage_encode(const EventStream *events);

void print_ast(const AST *ast, int indent);
void print_events(const EventStream *events);
void print_ascii_stream(const ASCIIStream *ascii);
void print_invariant_report(const InvariantReport *report);

uint64_t hash_ast(const AST *ast);
uint64_t hash_events(const EventStream *events);

#endif /* OMNITRON_PIPELINE_H */
