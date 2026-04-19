/**
 * MULTI-PARADIGM LOGIC INTERPRETER
 * Supports: Prolog, Datalog, S-expr, M-expr, F-expr
 * Character set: ASCII (1977/1986)
 * 
 * Compile: gcc -o logic-interp logic-interp.c -lm
 * Usage: ./logic-interp [file] or interactive mode
 */

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: PROTOTYPE HOST INTERPRETER
 *
 * This file is a large userspace interpreter draft. It is not part of the
 * bare-metal boot path. The goal of the fixes below is to make this exact file
 * build and run as a host-side experiment rather than leave it as an
 * unverified pasted draft.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>
#include <stdarg.h>
#include <math.h>
#include <time.h>

/* ============================================================
 * CONSTANTS AND LIMITS
 * ============================================================ */

#define MAX_STRING          4096
#define MAX_TOKENS          1024
#define MAX_SYMBOLS         2048
#define MAX_CLAUSES         1024
#define MAX_FACTS           4096
#define MAX_VARS            256
#define MAX_BINDINGS        512
#define MAX_DEPTH           100
#define HASH_SIZE           2048

/* Small portable helpers so this file works in strict C11 mode. */
static char* x_strdup(const char* s) {
    size_t n = strlen(s) + 1;
    char* out = malloc(n);
    if (!out) {
        fprintf(stderr, "out of memory\n");
        exit(1);
    }
    memcpy(out, s, n);
    return out;
}

static char* x_strndup(const char* s, size_t n) {
    char* out = malloc(n + 1);
    if (!out) {
        fprintf(stderr, "out of memory\n");
        exit(1);
    }
    memcpy(out, s, n);
    out[n] = '\0';
    return out;
}

/* ASCII control characters */
#define NUL  0x00
#define SOH  0x01
#define STX  0x02
#define ETX  0x03
#define EOT  0x04
#define ENQ  0x05
#define ACK  0x06
#define BEL  0x07
#define BS   0x08
#define HT   0x09
#define LF   0x0A
#define VT   0x0B
#define FF   0x0C
#define CR   0x0D
#define SO   0x0E
#define SI   0x0F
#define DLE  0x10
#define DC1  0x11
#define DC2  0x12
#define DC3  0x13
#define DC4  0x14
#define NAK  0x15
#define SYN  0x16
#define ETB  0x17
#define CAN  0x18
#define EM   0x19
#define SUB  0x1A
#define ESC  0x1B
#define FS   0x1C
#define GS   0x1D
#define RS   0x1E
#define US   0x1F
#define DEL  0x7F

/* ============================================================
 * SYMBOL TABLE
 * ============================================================ */

typedef enum {
    TYPE_NIL,
    TYPE_ATOM,
    TYPE_INT,
    TYPE_FLOAT,
    TYPE_STRING,
    TYPE_VAR,
    TYPE_CONS,
    TYPE_LIST,
    TYPE_CLAUSE,
    TYPE_PREDICATE,
    TYPE_LAMBDA,
    TYPE_QUOTE,
    TYPE_BACKQUOTE,
    TYPE_COMMA,
    TYPE_COMMA_AT
} Type;

typedef struct Expr {
    Type type;
    union {
        char* atom;
        long integer;
        double floating;
        char* string;
        struct {
            struct Expr* car;
            struct Expr* cdr;
        } cons;
        struct {
            char* name;
            struct Expr* args;
        } predicate;
        struct {
            struct Expr* params;
            struct Expr* body;
        } lambda;
        struct Expr* quoted;
    } data;
    struct Expr* next;  /* For hash chains */
    int hash;
    int refcount;
} Expr;

typedef struct Symbol Symbol;
struct Symbol {
    char* name;
    Expr* value;
    int hash;
    Symbol* next;
};

typedef struct {
    Symbol* table[HASH_SIZE];
    int count;
} SymbolTable;

typedef struct {
    char* name;
    Expr* value;
} Binding;

typedef struct Environment Environment;
struct Environment {
    Binding bindings[MAX_BINDINGS];
    int count;
    Environment* parent;
};

typedef struct {
    Expr* head;
    Expr* body;
} Clause;

typedef struct {
    Clause* clauses;
    int count;
    int capacity;
} ClauseDB;

typedef struct {
    Expr* facts[MAX_FACTS];
    int count;
} FactDB;

/* Global state */
SymbolTable* symtab;
ClauseDB* clausedb;
FactDB* factdb;
Environment* global_env;

/* ============================================================
 * MEMORY MANAGEMENT
 * ============================================================ */

Expr* make_expr(Type type) {
    Expr* e = malloc(sizeof(Expr));
    memset(e, 0, sizeof(Expr));
    e->type = type;
    e->refcount = 1;
    return e;
}

void retain(Expr* e) {
    if (e) e->refcount++;
}

void release(Expr* e) {
    if (!e) return;
    if (--e->refcount <= 0) {
        switch (e->type) {
            case TYPE_ATOM:
                free(e->data.atom);
                break;
            case TYPE_STRING:
                free(e->data.string);
                break;
            case TYPE_CONS:
                release(e->data.cons.car);
                release(e->data.cons.cdr);
                break;
            case TYPE_PREDICATE:
                free(e->data.predicate.name);
                release(e->data.predicate.args);
                break;
            case TYPE_LAMBDA:
                release(e->data.lambda.params);
                release(e->data.lambda.body);
                break;
            case TYPE_QUOTE:
                release(e->data.quoted);
                break;
            default:
                break;
        }
        free(e);
    }
}

/* ============================================================
 * SYMBOL TABLE OPERATIONS
 * ============================================================ */

unsigned hash_string(const char* str) {
    unsigned hash = 5381;
    int c;
    while ((c = *str++))
        hash = ((hash << 5) + hash) + c;
    return hash;
}

SymbolTable* make_symbol_table() {
    SymbolTable* st = malloc(sizeof(SymbolTable));
    memset(st->table, 0, sizeof(st->table));
    st->count = 0;
    return st;
}

Symbol* lookup_symbol(SymbolTable* st, const char* name) {
    unsigned h = hash_string(name) % HASH_SIZE;
    Symbol* sym = st->table[h];
    while (sym) {
        if (strcmp(sym->name, name) == 0)
            return sym;
        sym = sym->next;
    }
    return NULL;
}

Symbol* intern_symbol(SymbolTable* st, const char* name) {
    Symbol* sym = lookup_symbol(st, name);
    if (sym) return sym;
    
    sym = malloc(sizeof(Symbol));
    sym->name = x_strdup(name);
    sym->value = NULL;
    sym->hash = hash_string(name);
    unsigned h = sym->hash % HASH_SIZE;
    sym->next = st->table[h];
    st->table[h] = sym;
    st->count++;
    return sym;
}

Expr* make_atom(const char* name) {
    Expr* e = make_expr(TYPE_ATOM);
    e->data.atom = x_strdup(name);
    e->hash = hash_string(name);
    return e;
}

Expr* make_int(long n) {
    Expr* e = make_expr(TYPE_INT);
    e->data.integer = n;
    e->hash = n;
    return e;
}

Expr* make_float(double f) {
    Expr* e = make_expr(TYPE_FLOAT);
    e->data.floating = f;
    e->hash = (int)f;
    return e;
}

Expr* make_string(const char* str) {
    Expr* e = make_expr(TYPE_STRING);
    e->data.string = x_strdup(str);
    e->hash = hash_string(str);
    return e;
}

Expr* make_var(const char* name) {
    Expr* e = make_expr(TYPE_VAR);
    e->data.atom = x_strdup(name);
    e->hash = hash_string(name);
    return e;
}

Expr* cons(Expr* car, Expr* cdr) {
    Expr* e = make_expr(TYPE_CONS);
    retain(car);
    retain(cdr);
    e->data.cons.car = car;
    e->data.cons.cdr = cdr;
    e->hash = (car ? car->hash : 0) ^ (cdr ? cdr->hash : 0);
    return e;
}

Expr* make_nil() {
    static Expr* nil = NULL;
    if (!nil) {
        nil = make_expr(TYPE_NIL);
        nil->hash = 0;
        retain(nil);
    }
    return nil;
}

/* ============================================================
 * LIST OPERATIONS
 * ============================================================ */

bool is_nil(Expr* e) {
    return e && e->type == TYPE_NIL;
}

int list_length(Expr* list) {
    int len = 0;
    while (!is_nil(list) && list->type == TYPE_CONS) {
        len++;
        list = list->data.cons.cdr;
    }
    return len;
}

Expr* list_nth(Expr* list, int n) {
    while (n-- > 0 && !is_nil(list) && list->type == TYPE_CONS) {
        list = list->data.cons.cdr;
    }
    return list && list->type == TYPE_CONS ? list->data.cons.car : make_nil();
}

Expr* make_list(Expr** items, int count) {
    Expr* result = make_nil();
    for (int i = count - 1; i >= 0; i--) {
        result = cons(items[i], result);
    }
    return result;
}

/* ============================================================
 * TOKENIZER (ASCII only)
 * ============================================================ */

typedef enum {
    TOK_EOF,
    TOK_LPAREN,    /* ( */
    TOK_RPAREN,    /* ) */
    TOK_LBRACK,    /* [ */
    TOK_RBRACK,    /* ] */
    TOK_LBRACE,    /* { */
    TOK_RBRACE,    /* } */
    TOK_DOT,       /* . */
    TOK_COMMA,     /* , */
    TOK_COMMA_AT,  /* ,@ */
    TOK_QUOTE,     /* ' */
    TOK_BACKQUOTE, /* ` */
    TOK_COLON,     /* : */
    TOK_COLON_MINUS, /* :- */
    TOK_SEMICOLON, /* ; */
    TOK_PIPE,      /* | */
    TOK_QUESTION,  /* ? */
    TOK_ATOM,
    TOK_INT,
    TOK_FLOAT,
    TOK_STRING,
    TOK_VAR,       /* Prolog variable (uppercase) */
    TOK_LAMBDA,    /* \ or lambda */
    TOK_ARROW      /* -> */
} TokenType;

typedef struct {
    TokenType type;
    union {
        char* atom;
        long integer;
        double floating;
        char* string;
    } value;
    int line;
    int col;
} Token;

typedef struct {
    const char* input;
    int pos;
    int line;
    int col;
    Token tokens[MAX_TOKENS];
    int token_count;
    int token_pos;
} Tokenizer;

bool is_whitespace(char c) {
    return c == ' ' || c == '\t' || c == '\n' || c == '\r' ||
           c == VT || c == FF;
}

bool is_digit(char c) {
    return c >= '0' && c <= '9';
}

bool is_alpha(char c) {
    return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
}

bool is_atom_char(char c) {
    return is_alpha(c) || is_digit(c) || 
           c == '-' || c == '_' || c == '+' || c == '*' ||
           c == '/' || c == '=' || c == '<' || c == '>' ||
           c == '!' || c == '?' || c == '$' || c == '%' ||
           c == '&' || c == '^' || c == '~' || c == '@';
}

bool is_var_start(char c) {
    return (c >= 'A' && c <= 'Z') || c == '_';
}

void add_token(Tokenizer* tz, Token tok) {
    if (tz->token_count < MAX_TOKENS) {
        tz->tokens[tz->token_count++] = tok;
    }
}

void tokenize(Tokenizer* tz) {
    tz->line = 1;
    tz->col = 1;
    tz->pos = 0;
    tz->token_count = 0;
    tz->token_pos = 0;
    
    const char* input = tz->input;
    
    while (input[tz->pos]) {
        char c = input[tz->pos];
        
        /* Skip whitespace */
        if (is_whitespace(c)) {
            if (c == '\n') {
                tz->line++;
                tz->col = 1;
            } else {
                tz->col++;
            }
            tz->pos++;
            continue;
        }
        
        /* Skip comments. ';' is Lisp-style, '%' is Prolog-style. */
        if ((c == ';' && input[tz->pos + 1] != '-') || c == '%') {
            while (input[tz->pos] && input[tz->pos] != '\n') tz->pos++;
            continue;
        }
        
        Token tok = {0};
        tok.line = tz->line;
        tok.col = tz->col;
        
        /* Single character tokens */
        switch (c) {
            case '(': tok.type = TOK_LPAREN; break;
            case ')': tok.type = TOK_RPAREN; break;
            case '[': tok.type = TOK_LBRACK; break;
            case ']': tok.type = TOK_RBRACK; break;
            case '{': tok.type = TOK_LBRACE; break;
            case '}': tok.type = TOK_RBRACE; break;
            case '.': tok.type = TOK_DOT; break;
            case ':':
                if (input[tz->pos + 1] == '-') {
                    tok.type = TOK_COLON_MINUS;
                    tz->pos++;
                    tz->col++;
                } else {
                    tok.type = TOK_COLON;
                }
                break;
            case ';': tok.type = TOK_SEMICOLON; break;
            case '|': tok.type = TOK_PIPE; break;
            case '?':
                if (input[tz->pos + 1] == '-') {
                    tok.type = TOK_QUESTION;
                    tz->pos++;
                    tz->col++;
                } else {
                    tok.type = TOK_QUESTION;
                }
                break;
            case '\'': tok.type = TOK_QUOTE; break;
            case '`': tok.type = TOK_BACKQUOTE; break;
            case ',':
                if (input[tz->pos + 1] == '@') {
                    tok.type = TOK_COMMA_AT;
                    tz->pos++;
                    tz->col++;
                } else {
                    tok.type = TOK_COMMA;
                }
                break;
            case '\\':
                tok.type = TOK_LAMBDA;
                break;
            case '-':
                if (input[tz->pos + 1] == '>') {
                    tok.type = TOK_ARROW;
                    tz->pos++;
                    tz->col++;
                    break;
                }
                /* FALLTHROUGH: treat bare '-' like an atom/operator starter. */
            default:
                /* Strings */
                if (c == '"') {
                    int start = ++tz->pos;
                    while (input[tz->pos] && input[tz->pos] != '"') {
                        if (input[tz->pos] == '\\') tz->pos++;
                        tz->pos++;
                    }
                    int len = tz->pos - start;
                    char* str = malloc(len + 1);
                    int j = 0;
                    for (int i = start; i < tz->pos; i++) {
                        if (input[i] == '\\') {
                            i++;
                            switch (input[i]) {
                                case 'n': str[j++] = '\n'; break;
                                case 't': str[j++] = '\t'; break;
                                case 'r': str[j++] = '\r'; break;
                                case '"': str[j++] = '"'; break;
                                case '\\': str[j++] = '\\'; break;
                                default: str[j++] = input[i]; break;
                            }
                        } else {
                            str[j++] = input[i];
                        }
                    }
                    str[j] = 0;
                    tok.type = TOK_STRING;
                    tok.value.string = str;
                    tz->pos++;
                    tz->col += len + 2;
                    add_token(tz, tok);
                    continue;
                }
                
                /* Numbers */
                if (is_digit(c) || (c == '-' && is_digit(input[tz->pos + 1]))) {
                    bool is_float = false;
                    int start = tz->pos++;
                    while (input[tz->pos] && (is_digit(input[tz->pos]) || 
                           input[tz->pos] == '.')) {
                        if (input[tz->pos] == '.') is_float = true;
                        tz->pos++;
                    }
                    int len = tz->pos - start;
                    char* num_str = x_strndup(&input[start], (size_t)len);
                    if (is_float) {
                        tok.type = TOK_FLOAT;
                        tok.value.floating = atof(num_str);
                    } else {
                        tok.type = TOK_INT;
                        tok.value.integer = atol(num_str);
                    }
                    free(num_str);
                    tz->col += len;
                    add_token(tz, tok);
                    continue;
                }
                
                /* Variables (uppercase or underscore) */
                if (is_var_start(c)) {
                    int start = tz->pos;
                    while (input[tz->pos] && is_atom_char(input[tz->pos])) {
                        tz->pos++;
                    }
                    int len = tz->pos - start;
                    tok.type = TOK_VAR;
                    tok.value.atom = x_strndup(&input[start], (size_t)len);
                    tz->col += len;
                    add_token(tz, tok);
                    continue;
                }
                
                /* Atoms */
                if (is_alpha(c) || strchr("+-*/=<>!?$%&^~@", c)) {
                    int start = tz->pos;
                    while (input[tz->pos] && is_atom_char(input[tz->pos])) {
                        tz->pos++;
                    }
                    int len = tz->pos - start;
                    char* atom = x_strndup(&input[start], (size_t)len);
                    
                    /* Check for lambda keyword */
                    if (strcmp(atom, "lambda") == 0) {
                        tok.type = TOK_LAMBDA;
                    } else {
                        tok.type = TOK_ATOM;
                        tok.value.atom = atom;
                    }
                    
                    if (tok.type != TOK_LAMBDA) {
                        tz->col += len;
                        add_token(tz, tok);
                        continue;
                    }
                    free(atom);
                    tz->col += len;
                    add_token(tz, tok);
                    continue;
                }
                
                tz->pos++;
                tz->col++;
                continue;
        }
        
        if (tok.type != 0) {
            add_token(tz, tok);
            tz->pos++;
            tz->col++;
        }
    }
    
    Token eof = {.type = TOK_EOF, .line = tz->line, .col = tz->col};
    add_token(tz, eof);
}

Token current_token(Tokenizer* tz) {
    return tz->tokens[tz->token_pos];
}

Token peek_token(Tokenizer* tz) {
    if (tz->token_pos < tz->token_count) {
        return tz->tokens[tz->token_pos];
    }
    Token eof = {.type = TOK_EOF};
    return eof;
}

Token next_token(Tokenizer* tz) {
    if (tz->token_pos < tz->token_count) {
        return tz->tokens[tz->token_pos++];
    }
    Token eof = {.type = TOK_EOF};
    return eof;
}

bool match_token(Tokenizer* tz, TokenType type) {
    if (peek_token(tz).type == type) {
        next_token(tz);
        return true;
    }
    return false;
}

void expect_token(Tokenizer* tz, TokenType type, const char* msg) {
    Token tok = next_token(tz);
    if (tok.type != type) {
        fprintf(stderr, "Parse error at line %d, col %d: %s\n",
                tok.line, tok.col, msg);
        exit(1);
    }
}

/* ============================================================
 * PARSERS FOR DIFFERENT SYNTAXES
 * ============================================================ */

/* Forward declarations */
Expr* parse_expr(Tokenizer* tz);
Expr* parse_prolog_clause(Tokenizer* tz);
Expr* eval_expr(Expr* e, Environment* env);
void print_expr(Expr* e);

/* S-Expression parser */
Expr* parse_sexpr(Tokenizer* tz) {
    Token tok = peek_token(tz);
    
    if (match_token(tz, TOK_QUOTE)) {
        Expr* quoted = parse_sexpr(tz);
        Expr* e = make_expr(TYPE_QUOTE);
        e->data.quoted = quoted;
        return e;
    }
    
    if (match_token(tz, TOK_BACKQUOTE)) {
        Expr* quoted = parse_sexpr(tz);
        Expr* e = make_expr(TYPE_BACKQUOTE);
        e->data.quoted = quoted;
        return e;
    }
    
    if (match_token(tz, TOK_LPAREN)) {
        /* List */
        Expr* list = make_nil();
        Expr** items = malloc(sizeof(Expr*) * MAX_TOKENS);
        int count = 0;
        
        while (peek_token(tz).type != TOK_RPAREN && 
               peek_token(tz).type != TOK_EOF) {
            if (match_token(tz, TOK_DOT)) {
                /* Dotted pair */
                if (count == 0) {
                    fprintf(stderr, "Invalid dotted pair syntax\n");
                    exit(1);
                }
                Expr* cdr = parse_sexpr(tz);
                expect_token(tz, TOK_RPAREN, "Expected )");
                
                /* Build proper list with dotted tail */
                Expr* result = cdr;
                for (int i = count - 1; i >= 0; i--) {
                    result = cons(items[i], result);
                }
                free(items);
                return result;
            }
            items[count++] = parse_sexpr(tz);
        }
        expect_token(tz, TOK_RPAREN, "Expected )");
        
        list = make_list(items, count);
        free(items);
        return list;
    }
    
    if (tok.type == TOK_INT) {
        next_token(tz);
        return make_int(tok.value.integer);
    }
    
    if (tok.type == TOK_FLOAT) {
        next_token(tz);
        return make_float(tok.value.floating);
    }
    
    if (tok.type == TOK_STRING) {
        next_token(tz);
        return make_string(tok.value.string);
    }
    
    if (tok.type == TOK_ATOM) {
        next_token(tz);
        return make_atom(tok.value.atom);
    }
    
    if (tok.type == TOK_VAR) {
        next_token(tz);
        return make_var(tok.value.atom);
    }
    
    fprintf(stderr, "Unexpected token in S-expression\n");
    return make_nil();
}

/* M-Expression parser (Meta-expressions) */
Expr* parse_mexpr(Tokenizer* tz) {
    /* M-expressions: function[arg1; arg2; ...] */
    if (peek_token(tz).type == TOK_ATOM) {
        Token func_tok = next_token(tz);
        Expr* func = make_atom(func_tok.value.atom);
        
        if (match_token(tz, TOK_LBRACK)) {
            Expr** args = malloc(sizeof(Expr*) * MAX_TOKENS);
            int count = 0;
            
            while (peek_token(tz).type != TOK_RBRACK && 
                   peek_token(tz).type != TOK_EOF) {
                args[count++] = parse_mexpr(tz);
                if (peek_token(tz).type == TOK_SEMICOLON) {
                    next_token(tz);
                }
            }
            expect_token(tz, TOK_RBRACK, "Expected ]");
            
            Expr* args_list = make_list(args, count);
            free(args);
            return cons(func, args_list);
        }
        return func;
    }
    
    /* Fall back to S-expr parsing */
    return parse_sexpr(tz);
}

/* F-Expression parser (Function expressions with lambda) */
Expr* parse_fexpr(Tokenizer* tz) {
    Token tok = peek_token(tz);
    
    if (match_token(tz, TOK_LAMBDA) || 
        (tok.type == TOK_ATOM && strcmp(tok.value.atom, "lambda") == 0)) {
        if (tok.type == TOK_ATOM) next_token(tz);
        
        Expr* e = make_expr(TYPE_LAMBDA);
        
        /* Parameters */
        expect_token(tz, TOK_LPAREN, "Expected (");
        Expr** params = malloc(sizeof(Expr*) * MAX_TOKENS);
        int param_count = 0;
        
        while (peek_token(tz).type != TOK_RPAREN && 
               peek_token(tz).type != TOK_EOF) {
            Token p = next_token(tz);
            params[param_count++] = make_var(p.value.atom);
        }
        expect_token(tz, TOK_RPAREN, "Expected )");
        e->data.lambda.params = make_list(params, param_count);
        free(params);
        
        /* Arrow or body */
        if (match_token(tz, TOK_ARROW)) {
            /* Nothing */
        }
        
        e->data.lambda.body = parse_fexpr(tz);
        return e;
    }
    
    if (match_token(tz, TOK_LBRACE)) {
        /* Block expression */
        Expr** exprs = malloc(sizeof(Expr*) * MAX_TOKENS);
        int count = 0;
        
        while (peek_token(tz).type != TOK_RBRACE && 
               peek_token(tz).type != TOK_EOF) {
            exprs[count++] = parse_fexpr(tz);
            if (match_token(tz, TOK_SEMICOLON)) continue;
        }
        expect_token(tz, TOK_RBRACE, "Expected }");
        
        Expr* result = make_list(exprs, count);
        free(exprs);
        return cons(make_atom("begin"), result);
    }
    
    /* Function application */
    Expr* func = parse_sexpr(tz);
    if (peek_token(tz).type == TOK_LPAREN) {
        next_token(tz);
        Expr** args = malloc(sizeof(Expr*) * MAX_TOKENS);
        int count = 0;
        
        while (peek_token(tz).type != TOK_RPAREN && 
               peek_token(tz).type != TOK_EOF) {
            args[count++] = parse_fexpr(tz);
            if (match_token(tz, TOK_COMMA)) continue;
        }
        expect_token(tz, TOK_RPAREN, "Expected )");
        
        Expr* args_list = make_list(args, count);
        free(args);
        return cons(func, args_list);
    }
    
    return func;
}

/* Prolog/Datalog parser */
Expr* parse_prolog_term(Tokenizer* tz) {
    Token tok = peek_token(tz);
    
    if (tok.type == TOK_VAR) {
        next_token(tz);
        return make_var(tok.value.atom);
    }
    
    if (tok.type == TOK_INT) {
        next_token(tz);
        return make_int(tok.value.integer);
    }
    
    if (tok.type == TOK_ATOM) {
        next_token(tz);
        Expr* atom = make_atom(tok.value.atom);
        
        if (peek_token(tz).type == TOK_LPAREN) {
            next_token(tz);
            Expr** args = malloc(sizeof(Expr*) * MAX_TOKENS);
            int count = 0;
            
            while (peek_token(tz).type != TOK_RPAREN && 
                   peek_token(tz).type != TOK_EOF) {
                args[count++] = parse_prolog_term(tz);
                if (match_token(tz, TOK_COMMA)) continue;
            }
            expect_token(tz, TOK_RPAREN, "Expected )");
            
            Expr* pred = make_expr(TYPE_PREDICATE);
            pred->data.predicate.name = x_strdup(tok.value.atom);
            pred->data.predicate.args = make_list(args, count);
            free(args);
            return pred;
        }
        return atom;
    }
    
    if (match_token(tz, TOK_LBRACK)) {
        /* List */
        Expr** items = malloc(sizeof(Expr*) * MAX_TOKENS);
        int count = 0;
        
        while (peek_token(tz).type != TOK_RBRACK && 
               peek_token(tz).type != TOK_EOF) {
            items[count++] = parse_prolog_term(tz);
            if (match_token(tz, TOK_COMMA)) continue;
            if (match_token(tz, TOK_PIPE)) {
                /* List tail */
                Expr* tail = parse_prolog_term(tz);
                expect_token(tz, TOK_RBRACK, "Expected ]");
                
                Expr* result = tail;
                for (int i = count - 1; i >= 0; i--) {
                    result = cons(items[i], result);
                }
                free(items);
                return result;
            }
        }
        expect_token(tz, TOK_RBRACK, "Expected ]");
        
        Expr* result = make_list(items, count);
        free(items);
        return result;
    }
    
    fprintf(stderr, "Unexpected token in Prolog term\n");
    return make_nil();
}

Expr* parse_prolog_clause(Tokenizer* tz) {
    Expr* head = parse_prolog_term(tz);
    Expr* body = NULL;
    
    if (match_token(tz, TOK_COLON_MINUS)) {
        Expr** goals = malloc(sizeof(Expr*) * MAX_TOKENS);
        int count = 0;
        
        do {
            goals[count++] = parse_prolog_term(tz);
        } while (match_token(tz, TOK_COMMA));
        
        body = make_list(goals, count);
        free(goals);
    }
    
    expect_token(tz, TOK_DOT, "Expected . at end of clause");
    
    if (body == NULL) {
        return head;
    }
    return cons(head, body);
}

/* Query parser */
Expr* parse_query(Tokenizer* tz) {
    expect_token(tz, TOK_QUESTION, "Expected ?-");
    
    Expr** goals = malloc(sizeof(Expr*) * MAX_TOKENS);
    int count = 0;
    
    do {
        goals[count++] = parse_prolog_term(tz);
    } while (match_token(tz, TOK_COMMA));
    
    expect_token(tz, TOK_DOT, "Expected . at end of query");
    
    return make_list(goals, count);
}

/* Main parse function - detects syntax type */
Expr* parse(Tokenizer* tz) {
    Token first = peek_token(tz);
    
    /* Prolog/Datalog mode */
    if (first.type == TOK_QUESTION) {
        return parse_query(tz);
    }
    
    if (first.type == TOK_ATOM && peek_token(tz).type != TOK_EOF) {
        Tokenizer temp = *tz;
        parse_prolog_term(&temp);
        Token next = peek_token(&temp);
        if (next.type == TOK_COLON_MINUS || next.type == TOK_DOT) {
            return parse_prolog_clause(tz);
        }
    }
    
    /* M-expression mode (detected by atom[) */
    if (first.type == TOK_ATOM) {
        Tokenizer temp = *tz;
        parse_sexpr(&temp);
        if (peek_token(&temp).type == TOK_LBRACK) {
            return parse_mexpr(tz);
        }
    }
    
    /* F-expression mode (detected by lambda or \) */
    if (first.type == TOK_LAMBDA || 
        (first.type == TOK_ATOM && strcmp(first.value.atom, "lambda") == 0)) {
        return parse_fexpr(tz);
    }
    
    /* Default: S-expression mode */
    return parse_sexpr(tz);
}

/* ============================================================
 * UNIFICATION (for Prolog/Datalog)
 * ============================================================ */

typedef struct {
    Expr* var;
    Expr* value;
} Substitution;

typedef struct {
    Substitution subs[MAX_BINDINGS];
    int count;
} SubstitutionSet;

bool occurs_check(Expr* var, Expr* term, SubstitutionSet* subst) {
    if (var == term) return true;
    
    if (term->type == TYPE_VAR) {
        for (int i = 0; i < subst->count; i++) {
            if (subst->subs[i].var == term) {
                return occurs_check(var, subst->subs[i].value, subst);
            }
        }
        return false;
    }
    
    if (term->type == TYPE_CONS) {
        return occurs_check(var, term->data.cons.car, subst) ||
               occurs_check(var, term->data.cons.cdr, subst);
    }
    
    if (term->type == TYPE_PREDICATE) {
        return occurs_check(var, term->data.predicate.args, subst);
    }
    
    return false;
}

bool unify(Expr* a, Expr* b, SubstitutionSet* subst) {
    /* Dereference variables */
    if (a->type == TYPE_VAR) {
        for (int i = 0; i < subst->count; i++) {
            if (subst->subs[i].var == a) {
                return unify(subst->subs[i].value, b, subst);
            }
        }
    }
    
    if (b->type == TYPE_VAR) {
        for (int i = 0; i < subst->count; i++) {
            if (subst->subs[i].var == b) {
                return unify(a, subst->subs[i].value, subst);
            }
        }
    }
    
    /* Both variables */
    if (a->type == TYPE_VAR && b->type == TYPE_VAR) {
        if (a == b) return true;
        if (subst->count < MAX_BINDINGS) {
            subst->subs[subst->count].var = a;
            subst->subs[subst->count].value = b;
            subst->count++;
            return true;
        }
        return false;
    }
    
    /* Variable and term */
    if (a->type == TYPE_VAR) {
        if (occurs_check(a, b, subst)) return false;
        if (subst->count < MAX_BINDINGS) {
            subst->subs[subst->count].var = a;
            subst->subs[subst->count].value = b;
            subst->count++;
            return true;
        }
        return false;
    }
    
    if (b->type == TYPE_VAR) {
        if (occurs_check(b, a, subst)) return false;
        if (subst->count < MAX_BINDINGS) {
            subst->subs[subst->count].var = b;
            subst->subs[subst->count].value = a;
            subst->count++;
            return true;
        }
        return false;
    }
    
    /* Atomic values */
    if (a->type == TYPE_INT && b->type == TYPE_INT) {
        return a->data.integer == b->data.integer;
    }
    
    if (a->type == TYPE_FLOAT && b->type == TYPE_FLOAT) {
        return a->data.floating == b->data.floating;
    }
    
    if (a->type == TYPE_ATOM && b->type == TYPE_ATOM) {
        return strcmp(a->data.atom, b->data.atom) == 0;
    }
    
    if (a->type == TYPE_STRING && b->type == TYPE_STRING) {
        return strcmp(a->data.string, b->data.string) == 0;
    }
    
    /* Cons cells */
    if (a->type == TYPE_CONS && b->type == TYPE_CONS) {
        return unify(a->data.cons.car, b->data.cons.car, subst) &&
               unify(a->data.cons.cdr, b->data.cons.cdr, subst);
    }
    
    /* Predicates */
    if (a->type == TYPE_PREDICATE && b->type == TYPE_PREDICATE) {
        if (strcmp(a->data.predicate.name, b->data.predicate.name) != 0) {
            return false;
        }
        return unify(a->data.predicate.args, b->data.predicate.args, subst);
    }
    
    /* NIL */
    if (a->type == TYPE_NIL && b->type == TYPE_NIL) {
        return true;
    }
    
    return false;
}

Expr* apply_substitution(Expr* term, SubstitutionSet* subst) {
    if (term->type == TYPE_VAR) {
        for (int i = 0; i < subst->count; i++) {
            if (subst->subs[i].var == term) {
                return apply_substitution(subst->subs[i].value, subst);
            }
        }
        /*
         * Prototype fallback:
         * if the exact variable object is not bound, look for another bound
         * variable with the same printed name. This keeps rule answers readable
         * even though this interpreter does not fully standardize variables
         * apart yet.
         */
        for (int i = 0; i < subst->count; i++) {
            if (subst->subs[i].var->type == TYPE_VAR &&
                strcmp(subst->subs[i].var->data.atom, term->data.atom) == 0 &&
                subst->subs[i].value != term) {
                return apply_substitution(subst->subs[i].value, subst);
            }
        }
        return term;
    }
    
    if (term->type == TYPE_CONS) {
        Expr* car = apply_substitution(term->data.cons.car, subst);
        Expr* cdr = apply_substitution(term->data.cons.cdr, subst);
        if (car == term->data.cons.car && cdr == term->data.cons.cdr) {
            return term;
        }
        return cons(car, cdr);
    }
    
    if (term->type == TYPE_PREDICATE) {
        Expr* args = apply_substitution(term->data.predicate.args, subst);
        if (args == term->data.predicate.args) return term;
        Expr* pred = make_expr(TYPE_PREDICATE);
        pred->data.predicate.name = x_strdup(term->data.predicate.name);
        pred->data.predicate.args = args;
        return pred;
    }
    
    return term;
}

/* ============================================================
 * PROLOG/DATALOG EVALUATION
 * ============================================================ */

typedef struct Goal {
    Expr* predicate;
    struct Goal* next;
} Goal;

bool match_fact(Expr* goal, Expr* fact, SubstitutionSet* subst) {
    SubstitutionSet local_subst = *subst;
    if (unify(goal, fact, &local_subst)) {
        *subst = local_subst;
        return true;
    }
    return false;
}

bool match_clause(Expr* goal, Clause* clause, SubstitutionSet* subst) {
    Expr* head = clause->head;
    SubstitutionSet local_subst = *subst;
    if (unify(goal, head, &local_subst)) {
        *subst = local_subst;
        return true;
    }
    return false;
}

void print_substitution(SubstitutionSet* subst) {
    for (int i = 0; i < subst->count; i++) {
        if (subst->subs[i].var->type == TYPE_VAR) {
            printf("%s = ", subst->subs[i].var->data.atom);
            Expr* val = apply_substitution(subst->subs[i].value, subst);
            switch (val->type) {
                case TYPE_INT:
                    printf("%ld", val->data.integer);
                    break;
                case TYPE_ATOM:
                case TYPE_VAR:
                    printf("%s", val->data.atom);
                    break;
                case TYPE_STRING:
                    printf("\"%s\"", val->data.string);
                    break;
                default:
                    printf("<term>");
                    break;
            }
            printf("\n");
        }
    }
}

static bool query_mentions_var(Expr* term, Expr* needle) {
    if (term == needle) {
        return true;
    }
    if (!term) {
        return false;
    }
    switch (term->type) {
        case TYPE_CONS:
            return query_mentions_var(term->data.cons.car, needle) ||
                   query_mentions_var(term->data.cons.cdr, needle);
        case TYPE_PREDICATE:
            return query_mentions_var(term->data.predicate.args, needle);
        case TYPE_LAMBDA:
            return query_mentions_var(term->data.lambda.params, needle) ||
                   query_mentions_var(term->data.lambda.body, needle);
        case TYPE_QUOTE:
            return query_mentions_var(term->data.quoted, needle);
        default:
            return false;
    }
}

static bool print_query_bindings(Expr* query, SubstitutionSet* subst) {
    bool printed = false;
    for (int i = 0; i < subst->count; i++) {
        Expr* var = subst->subs[i].var;
        Expr* val = apply_substitution(subst->subs[i].value, subst);
        if (var->type != TYPE_VAR) {
            continue;
        }
        if (!query_mentions_var(query, var)) {
            continue;
        }
        if (val == var) {
            continue;
        }
        printf("%s = ", var->data.atom);
        switch (val->type) {
            case TYPE_INT:
                printf("%ld", val->data.integer);
                break;
            case TYPE_ATOM:
            case TYPE_VAR:
                printf("%s", val->data.atom);
                break;
            case TYPE_STRING:
                printf("\"%s\"", val->data.string);
                break;
            default:
                print_expr(val);
                break;
        }
        printf("\n");
        printed = true;
    }
    return printed;
}

/* Datalog evaluation (bottom-up) */
void evaluate_datalog_query(Expr* query) {
    printf("Datalog query result:\n");
    
    /* Simple fact lookup for now */
    Expr* goal = query;
    SubstitutionSet subst = {0};
    
    for (int i = 0; i < factdb->count; i++) {
        SubstitutionSet temp = subst;
        if (match_fact(goal, factdb->facts[i], &temp)) {
            print_substitution(&temp);
            printf("  (from fact)\n");
        }
    }
}

/* Prolog evaluation (top-down with backtracking) */
bool solve_prolog_goal(Expr* goal, SubstitutionSet* subst, int depth) {
    if (depth > MAX_DEPTH) return false;
    
    /* Built-in predicates */
    if (goal->type == TYPE_PREDICATE) {
        if (strcmp(goal->data.predicate.name, "write") == 0) {
            Expr* arg = list_nth(goal->data.predicate.args, 0);
            arg = apply_substitution(arg, subst);
            switch (arg->type) {
                case TYPE_INT:
                    printf("%ld", arg->data.integer);
                    break;
                case TYPE_ATOM:
                    printf("%s", arg->data.atom);
                    break;
                case TYPE_STRING:
                    printf("%s", arg->data.string);
                    break;
                default:
                    printf("<term>");
                    break;
            }
            return true;
        }
        
        if (strcmp(goal->data.predicate.name, "nl") == 0) {
            printf("\n");
            return true;
        }
        
        if (strcmp(goal->data.predicate.name, "is") == 0) {
            Expr* var = list_nth(goal->data.predicate.args, 0);
            Expr* expr = list_nth(goal->data.predicate.args, 1);
            expr = apply_substitution(expr, subst);
            
            if (expr->type == TYPE_INT) {
                if (subst->count < MAX_BINDINGS) {
                    subst->subs[subst->count].var = var;
                    subst->subs[subst->count].value = expr;
                    subst->count++;
                    return true;
                }
            }
            return false;
        }
    }
    
    /* Try facts */
    for (int i = 0; i < factdb->count; i++) {
        SubstitutionSet new_subst = *subst;
        if (match_fact(goal, factdb->facts[i], &new_subst)) {
            *subst = new_subst;
            return true;
        }
    }
    
    /* Try clauses */
    for (int i = 0; i < clausedb->count; i++) {
        SubstitutionSet new_subst = *subst;
        if (match_clause(goal, &clausedb->clauses[i], &new_subst)) {
            Expr* body = clausedb->clauses[i].body;
            
            /* Solve body goals */
            bool all_solved = true;
            Expr* goals = body;
            
            while (!is_nil(goals) && goals->type == TYPE_CONS) {
                Expr* subgoal = apply_substitution(goals->data.cons.car, &new_subst);
                
                SubstitutionSet goal_subst = new_subst;
                if (!solve_prolog_goal(subgoal, &goal_subst, depth + 1)) {
                    all_solved = false;
                    break;
                }
                new_subst = goal_subst;
                goals = goals->data.cons.cdr;
            }
            
            if (all_solved) {
                *subst = new_subst;
                return true;
            }
        }
    }
    
    return false;
}

void evaluate_prolog_query(Expr* query) {
    printf("Prolog query result:\n");
    
    SubstitutionSet subst = {0};
    Expr* goals = query;
    bool found = false;
    
    /* Try to solve all goals */
    SubstitutionSet current = subst;
    bool all_solved = true;
    Expr* goal_list = goals;
    
    while (!is_nil(goal_list) && goal_list->type == TYPE_CONS) {
        Expr* goal = goal_list->data.cons.car;
        
        if (!solve_prolog_goal(goal, &current, 0)) {
            all_solved = false;
            break;
        }
        goal_list = goal_list->data.cons.cdr;
    }
    
    if (all_solved) {
        print_query_bindings(query, &current);
        found = true;
    }
    
    if (!found) {
        printf("false.\n");
    } else {
        printf("true.\n");
    }
}

/* ============================================================
 * LISP/S-EXPRESSION EVALUATION
 * ============================================================ */

Environment* make_environment(Environment* parent) {
    Environment* env = malloc(sizeof(Environment));
    env->count = 0;
    env->parent = parent;
    return env;
}

void env_define(Environment* env, const char* name, Expr* value) {
    for (int i = 0; i < env->count; i++) {
        if (strcmp(env->bindings[i].name, name) == 0) {
            release(env->bindings[i].value);
            retain(value);
            env->bindings[i].value = value;
            return;
        }
    }
    
    if (env->count < MAX_BINDINGS) {
        env->bindings[env->count].name = x_strdup(name);
        env->bindings[env->count].value = value;
        retain(value);
        env->count++;
    }
}

Expr* env_lookup(Environment* env, const char* name) {
    for (int i = 0; i < env->count; i++) {
        if (strcmp(env->bindings[i].name, name) == 0) {
            return env->bindings[i].value;
        }
    }
    
    if (env->parent) {
        return env_lookup(env->parent, name);
    }
    
    return NULL;
}

Expr* eval_list(Expr* list, Environment* env) {
    if (is_nil(list)) return make_nil();
    if (list->type != TYPE_CONS) return eval_expr(list, env);
    
    Expr* op = eval_expr(list->data.cons.car, env);
    Expr* args = list->data.cons.cdr;
    
    /* Special forms */
    if (op->type == TYPE_ATOM) {
        if (strcmp(op->data.atom, "quote") == 0) {
            return list_nth(args, 0);
        }
        
        if (strcmp(op->data.atom, "if") == 0) {
            Expr* cond = eval_expr(list_nth(args, 0), env);
            if (!is_nil(cond)) {
                return eval_expr(list_nth(args, 1), env);
            } else {
                return eval_expr(list_nth(args, 2), env);
            }
        }
        
        if (strcmp(op->data.atom, "define") == 0) {
            Expr* var = list_nth(args, 0);
            Expr* val = eval_expr(list_nth(args, 1), env);
            env_define(env, var->data.atom, val);
            return val;
        }
        
        if (strcmp(op->data.atom, "lambda") == 0) {
            Expr* e = make_expr(TYPE_LAMBDA);
            e->data.lambda.params = list_nth(args, 0);
            e->data.lambda.body = list_nth(args, 1);
            return e;
        }
        
        if (strcmp(op->data.atom, "begin") == 0) {
            Expr* result = make_nil();
            Expr* exprs = args;
            while (!is_nil(exprs) && exprs->type == TYPE_CONS) {
                release(result);
                result = eval_expr(exprs->data.cons.car, env);
                exprs = exprs->data.cons.cdr;
            }
            return result;
        }
        
        /* Arithmetic */
        if (strcmp(op->data.atom, "+") == 0) {
            long sum = 0;
            Expr* nums = args;
            while (!is_nil(nums) && nums->type == TYPE_CONS) {
                Expr* n = eval_expr(nums->data.cons.car, env);
                if (n->type == TYPE_INT) sum += n->data.integer;
                release(n);
                nums = nums->data.cons.cdr;
            }
            return make_int(sum);
        }
        
        if (strcmp(op->data.atom, "-") == 0) {
            Expr* a = eval_expr(list_nth(args, 0), env);
            Expr* b = eval_expr(list_nth(args, 1), env);
            long result = 0;
            if (a->type == TYPE_INT && b->type == TYPE_INT) {
                result = a->data.integer - b->data.integer;
            }
            release(a); release(b);
            return make_int(result);
        }
        
        if (strcmp(op->data.atom, "*") == 0) {
            long prod = 1;
            Expr* nums = args;
            while (!is_nil(nums) && nums->type == TYPE_CONS) {
                Expr* n = eval_expr(nums->data.cons.car, env);
                if (n->type == TYPE_INT) prod *= n->data.integer;
                release(n);
                nums = nums->data.cons.cdr;
            }
            return make_int(prod);
        }
        
        /* List operations */
        if (strcmp(op->data.atom, "cons") == 0) {
            Expr* car = eval_expr(list_nth(args, 0), env);
            Expr* cdr = eval_expr(list_nth(args, 1), env);
            return cons(car, cdr);
        }
        
        if (strcmp(op->data.atom, "car") == 0) {
            Expr* list = eval_expr(list_nth(args, 0), env);
            Expr* result = list->type == TYPE_CONS ? list->data.cons.car : make_nil();
            retain(result);
            release(list);
            return result;
        }
        
        if (strcmp(op->data.atom, "cdr") == 0) {
            Expr* list = eval_expr(list_nth(args, 0), env);
            Expr* result = list->type == TYPE_CONS ? list->data.cons.cdr : make_nil();
            retain(result);
            release(list);
            return result;
        }
        
        if (strcmp(op->data.atom, "list") == 0) {
            Expr** items = malloc(sizeof(Expr*) * MAX_TOKENS);
            int count = 0;
            Expr* arg_list = args;
            
            while (!is_nil(arg_list) && arg_list->type == TYPE_CONS) {
                items[count++] = eval_expr(arg_list->data.cons.car, env);
                arg_list = arg_list->data.cons.cdr;
            }
            
            Expr* result = make_list(items, count);
            for (int i = 0; i < count; i++) release(items[i]);
            free(items);
            return result;
        }
        
        /* Predicates */
        if (strcmp(op->data.atom, "null?") == 0 ||
            strcmp(op->data.atom, "nullp") == 0) {
            Expr* obj = eval_expr(list_nth(args, 0), env);
            Expr* result = is_nil(obj) ? make_atom("t") : make_nil();
            release(obj);
            return result;
        }
        
        if (strcmp(op->data.atom, "eq?") == 0 ||
            strcmp(op->data.atom, "eq") == 0) {
            Expr* a = eval_expr(list_nth(args, 0), env);
            Expr* b = eval_expr(list_nth(args, 1), env);
            bool eq = (a == b) || (a->type == b->type && a->hash == b->hash);
            release(a); release(b);
            return eq ? make_atom("t") : make_nil();
        }
    }
    
    /* Lambda application */
    if (op->type == TYPE_LAMBDA) {
        Environment* lambda_env = make_environment(env);
        Expr* params = op->data.lambda.params;
        Expr* arg_vals = args;
        
        /* Evaluate arguments */
        Expr** evaled_args = malloc(sizeof(Expr*) * MAX_TOKENS);
        int arg_count = 0;
        Expr* temp = arg_vals;
        
        while (!is_nil(temp) && temp->type == TYPE_CONS) {
            evaled_args[arg_count++] = eval_expr(temp->data.cons.car, env);
            temp = temp->data.cons.cdr;
        }
        
        /* Bind parameters */
        Expr* param = params;
        for (int i = 0; i < arg_count && !is_nil(param) && param->type == TYPE_CONS; i++) {
            Expr* var = param->data.cons.car;
            if (var->type == TYPE_ATOM || var->type == TYPE_VAR) {
                env_define(lambda_env, var->data.atom, evaled_args[i]);
            }
            param = param->data.cons.cdr;
        }
        
        for (int i = 0; i < arg_count; i++) release(evaled_args[i]);
        free(evaled_args);
        
        /* Evaluate body */
        Expr* result = eval_expr(op->data.lambda.body, lambda_env);
        
        /* Cleanup */
        for (int i = 0; i < lambda_env->count; i++) {
            free(lambda_env->bindings[i].name);
            release(lambda_env->bindings[i].value);
        }
        free(lambda_env);
        
        return result;
    }
    
    return make_nil();
}

Expr* eval_expr(Expr* e, Environment* env) {
    if (!e) return make_nil();
    
    switch (e->type) {
        case TYPE_INT:
        case TYPE_FLOAT:
        case TYPE_STRING:
            retain(e);
            return e;
            
        case TYPE_ATOM: {
            Expr* val = env_lookup(env, e->data.atom);
            if (val) {
                retain(val);
                return val;
            }
            retain(e);
            return e;
        }
        
        case TYPE_VAR: {
            Expr* val = env_lookup(env, e->data.atom);
            if (val) {
                retain(val);
                return val;
            }
            fprintf(stderr, "Unbound variable: %s\n", e->data.atom);
            return make_nil();
        }
        
        case TYPE_CONS:
            return eval_list(e, env);
            
        case TYPE_QUOTE:
            retain(e->data.quoted);
            return e->data.quoted;
            
        default:
            retain(e);
            return e;
    }
}

/* ============================================================
 * PRINTERS
 * ============================================================ */

void print_expr(Expr* e) {
    if (!e) {
        printf("nil");
        return;
    }
    
    switch (e->type) {
        case TYPE_NIL:
            printf("()");
            break;
        case TYPE_INT:
            printf("%ld", e->data.integer);
            break;
        case TYPE_FLOAT:
            printf("%g", e->data.floating);
            break;
        case TYPE_ATOM:
            printf("%s", e->data.atom);
            break;
        case TYPE_VAR:
            printf("%s", e->data.atom);
            break;
        case TYPE_STRING:
            printf("\"%s\"", e->data.string);
            break;
        case TYPE_CONS:
            printf("(");
            print_expr(e->data.cons.car);
            Expr* cdr = e->data.cons.cdr;
            while (cdr->type == TYPE_CONS) {
                printf(" ");
                print_expr(cdr->data.cons.car);
                cdr = cdr->data.cons.cdr;
            }
            if (!is_nil(cdr)) {
                printf(" . ");
                print_expr(cdr);
            }
            printf(")");
            break;
        case TYPE_PREDICATE:
            printf("%s(", e->data.predicate.name);
            Expr* args = e->data.predicate.args;
            bool first = true;
            while (!is_nil(args) && args->type == TYPE_CONS) {
                if (!first) printf(", ");
                print_expr(args->data.cons.car);
                first = false;
                args = args->data.cons.cdr;
            }
            printf(")");
            break;
        case TYPE_LAMBDA:
            printf("(lambda (");
            Expr* params = e->data.lambda.params;
            first = true;
            while (!is_nil(params) && params->type == TYPE_CONS) {
                if (!first) printf(" ");
                print_expr(params->data.cons.car);
                first = false;
                params = params->data.cons.cdr;
            }
            printf(") ");
            print_expr(e->data.lambda.body);
            printf(")");
            break;
        case TYPE_QUOTE:
            printf("'");
            print_expr(e->data.quoted);
            break;
        default:
            printf("<expr>");
            break;
    }
}

/* ============================================================
 * REPL (Read-Eval-Print Loop)
 * ============================================================ */

void print_prompt(const char* mode) {
    printf("\n%s> ", mode);
    fflush(stdout);
}

void print_ascii_table() {
    printf("\nASCII Character Set (Partial):\n");
    printf("  Dec Hex Char | Dec Hex Char | Dec Hex Char\n");
    printf("  --- --- ---- | --- --- ---- | --- --- ----\n");
    
    for (int i = 0; i < 32; i += 4) {
        for (int j = 0; j < 4 && i + j < 128; j++) {
            int c = i + j;
            printf("  %3d %02X  ", c, c);
            if (c >= 32 && c < 127) {
                printf("%c  ", c);
            } else {
                switch (c) {
                    case NUL: printf("NUL "); break;
                    case BEL: printf("BEL "); break;
                    case BS:  printf("BS  "); break;
                    case HT:  printf("HT  "); break;
                    case LF:  printf("LF  "); break;
                    case CR:  printf("CR  "); break;
                    case ESC: printf("ESC "); break;
                    case DEL: printf("DEL "); break;
                    default:  printf("CTRL"); break;
                }
            }
            if (j < 3) printf("| ");
        }
        printf("\n");
    }
}

/* Deterministic substrate ordering manifest for replay visibility. */
static void print_substrate_replay_manifest(void) {
    printf("\nSUBSTRATE REPLAY MANIFEST\n");
    printf("Order: 009 -> 010 -> 011 -> 012 -> 013\n");
    printf("009 raw_binary_group_ordering      deterministic_core_kernel_form\n");
    printf("010 canonical_ascii_ordering       control_surface_form\n");
    printf("011 sexagesimal_notation_headers   frame_interpretation_form\n");
    printf("012 duodecimal_classification      hierarchical_group_order_form\n");
    printf("013 frame_sequence_resolution      replay_control_surface_form\n");
    printf("graph_mode=control_plus_aegean_overlay\n");
    printf("graph_artifacts=bitboard_only\n");
    printf("Duality: two-graph index <-> dual-inverse substrate ordering\n");
}

/* Execute one parsed expression according to the selected front-end mode. */
static void execute_expr_in_mode(const char* mode, Expr* expr) {
    if (strcmp(mode, "prolog") == 0) {
        if (expr->type == TYPE_CONS && is_nil(expr->data.cons.cdr) == false) {
            if (clausedb->count < clausedb->capacity) {
                retain(expr->data.cons.car);
                retain(expr->data.cons.cdr);
                clausedb->clauses[clausedb->count].head = expr->data.cons.car;
                clausedb->clauses[clausedb->count].body = expr->data.cons.cdr;
                clausedb->count++;
                printf("Clause asserted.\n");
            }
        } else if (expr->type == TYPE_PREDICATE) {
            if (factdb->count < MAX_FACTS) {
                retain(expr);
                factdb->facts[factdb->count++] = expr;
                printf("Fact asserted.\n");
            }
        } else {
            evaluate_prolog_query(expr);
        }
        return;
    }

    if (strcmp(mode, "datalog") == 0) {
        if (expr->type == TYPE_PREDICATE) {
            if (factdb->count < MAX_FACTS) {
                retain(expr);
                factdb->facts[factdb->count++] = expr;
                printf("Fact asserted.\n");
            }
        } else {
            evaluate_datalog_query(expr);
        }
        return;
    }

    /* Default: Lisp-family evaluation modes. */
    Expr* result = eval_expr(expr, global_env);
    print_expr(result);
    printf("\n");
    release(result);
}

void repl() {
    char buffer[MAX_STRING];
    char mode[32] = "sexpr";
    
    printf("\n");
    printf("=================================================\n");
    printf("  MULTI-PARADIGM LOGIC INTERPRETER\n");
    printf("  ASCII Character Set (1977/1986)\n");
    printf("=================================================\n");
    printf("\n");
    printf("Modes: :s (S-expr), :p (Prolog), :d (Datalog),\n");
    printf("       :m (M-expr), :f (F-expr)\n");
    printf("Commands: :q (quit), :a (ASCII table), :r (substrate manifest), :h (help)\n");
    printf("\n");
    
    while (1) {
        print_prompt(mode);
        
        if (!fgets(buffer, sizeof(buffer), stdin)) break;
        
        /* Remove trailing newline */
        char* nl = strchr(buffer, '\n');
        if (nl) *nl = 0;
        
        /* Empty line */
        if (strlen(buffer) == 0) continue;
        
        /* Commands */
        if (buffer[0] == ':') {
            if (strcmp(buffer, ":q") == 0 || strcmp(buffer, ":quit") == 0) {
                printf("Goodbye!\n");
                break;
            } else if (strcmp(buffer, ":s") == 0) {
                strcpy(mode, "sexpr");
                printf("Switched to S-expression mode\n");
            } else if (strcmp(buffer, ":p") == 0) {
                strcpy(mode, "prolog");
                printf("Switched to Prolog mode\n");
            } else if (strcmp(buffer, ":d") == 0) {
                strcpy(mode, "datalog");
                printf("Switched to Datalog mode\n");
            } else if (strcmp(buffer, ":m") == 0) {
                strcpy(mode, "m-expr");
                printf("Switched to M-expression mode\n");
            } else if (strcmp(buffer, ":f") == 0) {
                strcpy(mode, "f-expr");
                printf("Switched to F-expression mode\n");
            } else if (strcmp(buffer, ":a") == 0) {
                print_ascii_table();
            } else if (strcmp(buffer, ":r") == 0 || strcmp(buffer, ":manifest") == 0) {
                print_substrate_replay_manifest();
            } else if (strcmp(buffer, ":h") == 0) {
                printf("\nHelp:\n");
                printf("  S-expr: (cons 1 (cons 2 nil))\n");
                printf("  M-expr: cons[1; cons[2; NIL]]\n");
                printf("  F-expr: lambda(x) { x + 1 }\n");
                printf("  Prolog: parent(john, mary).\n");
                printf("  Query:  ?- parent(X, mary).\n");
                printf("  :r     prints substrate replay manifest (009..013).\n");
            }
            continue;
        }
        
        /* Tokenize and parse */
        Tokenizer tz = {.input = buffer};
        tokenize(&tz);
        
        if (tz.token_count == 0 || tz.tokens[0].type == TOK_EOF) continue;
        
        Expr* expr = parse(&tz);
        
        if (expr) {
            execute_expr_in_mode(mode, expr);
            release(expr);
        }
        
        /* Clean up tokens */
        for (int i = 0; i < tz.token_count; i++) {
            Token tok = tz.tokens[i];
            if (tok.type == TOK_ATOM || tok.type == TOK_VAR) {
                free(tok.value.atom);
            } else if (tok.type == TOK_STRING) {
                free(tok.value.string);
            }
        }
    }
}

/* ============================================================
 * INITIALIZATION
 * ============================================================ */

void init_builtins(Environment* env) {
    /* Add some built-in functions */
    env_define(env, "t", make_atom("t"));
    env_define(env, "nil", make_nil());
    env_define(env, "pi", make_float(3.141592653589793));
}

void init_system() {
    symtab = make_symbol_table();
    
    clausedb = malloc(sizeof(ClauseDB));
    clausedb->clauses = malloc(sizeof(Clause) * MAX_CLAUSES);
    clausedb->count = 0;
    clausedb->capacity = MAX_CLAUSES;
    
    factdb = malloc(sizeof(FactDB));
    factdb->count = 0;
    
    global_env = make_environment(NULL);
    init_builtins(global_env);
}

void cleanup_system() {
    /* Clean up symbol table */
    for (int i = 0; i < HASH_SIZE; i++) {
        Symbol* sym = symtab->table[i];
        while (sym) {
            Symbol* next = sym->next;
            free(sym->name);
            if (sym->value) release(sym->value);
            free(sym);
            sym = next;
        }
    }
    free(symtab);
    
    /* Clean up clause database */
    for (int i = 0; i < clausedb->count; i++) {
        release(clausedb->clauses[i].head);
        release(clausedb->clauses[i].body);
    }
    free(clausedb->clauses);
    free(clausedb);
    
    /* Clean up fact database */
    for (int i = 0; i < factdb->count; i++) {
        release(factdb->facts[i]);
    }
    free(factdb);
    
    /* Clean up environment */
    for (int i = 0; i < global_env->count; i++) {
        free(global_env->bindings[i].name);
        release(global_env->bindings[i].value);
    }
    free(global_env);
}

/* ============================================================
 * MAIN
 * ============================================================ */

int main(int argc, char** argv) {
    init_system();
    
    if (argc > 1) {
        const char* mode = "sexpr";
        const char* path = NULL;
        bool emit_manifest = false;

        for (int i = 1; i < argc; i++) {
            if (strcmp(argv[i], "--prolog") == 0) {
                mode = "prolog";
            } else if (strcmp(argv[i], "--datalog") == 0) {
                mode = "datalog";
            } else if (strcmp(argv[i], "--sexpr") == 0) {
                mode = "sexpr";
            } else if (strcmp(argv[i], "--mexpr") == 0) {
                mode = "m-expr";
            } else if (strcmp(argv[i], "--fexpr") == 0) {
                mode = "f-expr";
            } else if (strcmp(argv[i], "--manifest") == 0 ||
                       strcmp(argv[i], "--substrate-manifest") == 0) {
                emit_manifest = true;
            } else {
                path = argv[i];
                break;
            }
        }

        if (path == NULL) {
            fprintf(stderr, "Usage: %s [--manifest|--substrate-manifest] [--prolog|--datalog|--sexpr|--mexpr|--fexpr] <file>\n", argv[0]);
            cleanup_system();
            return 1;
        }

        if (emit_manifest) {
            print_substrate_replay_manifest();
        }

        /* File mode */
        FILE* f = fopen(path, "r");
        if (!f) {
            fprintf(stderr, "Cannot open file: %s\n", path);
            return 1;
        }
        
        char buffer[MAX_STRING];
        while (fgets(buffer, sizeof(buffer), f)) {
            char* nl = strchr(buffer, '\n');
            if (nl) *nl = 0;
            if (buffer[0] == 0) continue;
            Tokenizer tz = {.input = buffer};
            tokenize(&tz);
            if (tz.token_count == 0 || tz.tokens[0].type == TOK_EOF) continue;
            Expr* expr = parse(&tz);
            
            if (expr) {
                execute_expr_in_mode(mode, expr);
                release(expr);
            }

            for (int i = 0; i < tz.token_count; i++) {
                Token tok = tz.tokens[i];
                if (tok.type == TOK_ATOM || tok.type == TOK_VAR) {
                    free(tok.value.atom);
                } else if (tok.type == TOK_STRING) {
                    free(tok.value.string);
                }
            }
        }
        
        fclose(f);
    } else {
        /* Interactive REPL */
        repl();
    }
    
    cleanup_system();
    return 0;
}
