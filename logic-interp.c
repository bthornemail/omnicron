/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: PROTOTYPE ASCII INTERPRETER
 *
 * This file is a standalone host-side interpreter written in plain C.
 * It is intentionally ASCII-oriented and does not depend on Unicode input.
 *
 * What is implemented now:
 * - tokenization over printable ASCII plus standard ASCII whitespace
 * - S-expression parsing and evaluation for a small Lisp-like core
 * - M-expression parsing of the form name[arg1; arg2; ...]
 * - F-expression parsing of the form lambda(x)->expr and name(a,b)
 * - Prolog/Datalog-style facts, rules, and queries with simple unification
 * - an interactive REPL with mode switching
 *
 * What is not implemented yet:
 * - a full standards-complete Prolog engine
 * - a fixed-point Datalog engine with stratified negation
 * - garbage collection
 * - persistent databases or file formats beyond line-by-line loading
 *
 * Relationship to the rest of the repo:
 * - bare metal executes kernel state and witnesses
 * - logic/sources/constitutional_stack.pl models a higher logical layer
 * - this file is a host-side prototype for exploring an ASCII-only
 *   multi-syntax surface in ordinary userspace
 */

#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_INPUT 4096
#define MAX_TOKENS 1024
#define MAX_ARGS 256
#define MAX_BINDINGS 256
#define MAX_FACTS 512
#define MAX_RULES 512
#define MAX_DEPTH 64

/* ASCII control bytes used in the constitutional documents. */
#define ASCII_ESC 0x1B
#define ASCII_FS  0x1C
#define ASCII_GS  0x1D
#define ASCII_RS  0x1E
#define ASCII_US  0x1F

typedef enum {
    NODE_NIL,
    NODE_NUMERIC,
    NODE_ATOM,
    NODE_VAR,
    NODE_STRING,
    NODE_CONS,
    NODE_PREDICATE,
    NODE_LAMBDA,
    NODE_QUERY
} NodeType;

typedef enum {
    NUM_INT,
    NUM_BCD,
    NUM_RATIO,
    NUM_FACTORADIC,
    NUM_FLOAT
} NumericKind;

typedef struct Node Node;

struct Node {
    NodeType type;
    union {
        struct {
            NumericKind kind;
            long integer;
            long numer;
            long denom;
            double floating;
            char *text;
        } numeric;
        char *text;
        struct {
            Node *car;
            Node *cdr;
        } cons;
        struct {
            char *name;
            Node *args;
        } predicate;
        struct {
            Node *params;
            Node *body;
        } lambda;
        struct {
            Node *goals;
        } query;
    } as;
};

typedef enum {
    TOK_EOF,
    TOK_LPAREN,
    TOK_RPAREN,
    TOK_LBRACK,
    TOK_RBRACK,
    TOK_LBRACE,
    TOK_RBRACE,
    TOK_DOT,
    TOK_COMMA,
    TOK_SEMICOLON,
    TOK_PIPE,
    TOK_QUOTE,
    TOK_BACKQUOTE,
    TOK_COLON_MINUS,
    TOK_QUERY,
    TOK_ARROW,
    TOK_LAMBDA,
    TOK_INT,
    TOK_ATOM,
    TOK_VAR,
    TOK_STRING
} TokenType;

typedef struct {
    TokenType type;
    char *text;
    long integer;
    int line;
    int col;
} Token;

typedef struct {
    const char *input;
    int pos;
    int line;
    int col;
    Token tokens[MAX_TOKENS];
    int count;
    int cursor;
} Lexer;

typedef struct {
    char *name;
    Node *value;
} Binding;

typedef struct Env Env;
struct Env {
    Binding bindings[MAX_BINDINGS];
    int count;
    Env *parent;
};

typedef struct {
    Node *head;
    Node *body;
} Rule;

typedef struct {
    Node *facts[MAX_FACTS];
    int fact_count;
    Rule rules[MAX_RULES];
    int rule_count;
} LogicDB;

typedef struct {
    Node *var;
    Node *value;
} Subst;

typedef struct {
    Subst items[MAX_BINDINGS];
    int count;
} SubstSet;

typedef enum {
    MODE_SEXPR,
    MODE_MEXPR,
    MODE_FEXPR,
    MODE_PROLOG,
    MODE_DATALOG
} ReplMode;

static LogicDB g_db;
static Env *g_env;

static void *xmalloc(size_t size) {
    void *p = malloc(size);
    if (!p) {
        fprintf(stderr, "out of memory\n");
        exit(1);
    }
    memset(p, 0, size);
    return p;
}

static char *xstrdup(const char *s) {
    size_t n = strlen(s) + 1;
    char *copy = xmalloc(n);
    memcpy(copy, s, n);
    return copy;
}

static char *xstrndup(const char *s, size_t n) {
    char *copy = xmalloc(n + 1);
    memcpy(copy, s, n);
    copy[n] = '\0';
    return copy;
}

static Node *node_new(NodeType type) {
    Node *n = xmalloc(sizeof(*n));
    n->type = type;
    return n;
}

static Node *node_nil(void) {
    static Node *nil;
    if (!nil) {
        nil = node_new(NODE_NIL);
    }
    return nil;
}

static Node *node_int(long value) {
    Node *n = node_new(NODE_NUMERIC);
    n->as.numeric.kind = NUM_INT;
    n->as.numeric.integer = value;
    return n;
}

static long gcd_long(long a, long b) {
    if (a < 0) a = -a;
    if (b < 0) b = -b;
    while (b != 0) {
        long t = a % b;
        a = b;
        b = t;
    }
    return a == 0 ? 1 : a;
}

static bool is_ascii_digits(const char *s) {
    if (!s || !*s) {
        return false;
    }
    for (const char *p = s; *p; ++p) {
        if (!isdigit((unsigned char)*p)) {
            return false;
        }
    }
    return true;
}

static bool is_factoradic_chars(const char *s) {
    if (!s || !*s) {
        return false;
    }
    for (const char *p = s; *p; ++p) {
        if (!isdigit((unsigned char)*p) && *p != ' ' && *p != ',' && *p != ':') {
            return false;
        }
    }
    return true;
}

static Node *node_bcd(const char *digits) {
    if (!is_ascii_digits(digits)) {
        fprintf(stderr, "BCD payload must be ASCII digits only\n");
        exit(1);
    }
    Node *n = node_new(NODE_NUMERIC);
    n->as.numeric.kind = NUM_BCD;
    n->as.numeric.text = xstrdup(digits);
    return n;
}

static Node *node_ratio(long numer, long denom) {
    if (denom == 0) {
        fprintf(stderr, "ratio denominator must not be zero\n");
        exit(1);
    }
    if (denom < 0) {
        numer = -numer;
        denom = -denom;
    }
    long g = gcd_long(numer, denom);
    Node *n = node_new(NODE_NUMERIC);
    n->as.numeric.kind = NUM_RATIO;
    n->as.numeric.numer = numer / g;
    n->as.numeric.denom = denom / g;
    return n;
}

static Node *node_factoradic(const char *digits) {
    if (!is_factoradic_chars(digits)) {
        fprintf(stderr, "factoradic payload must be ASCII digits/space/comma/colon\n");
        exit(1);
    }
    Node *n = node_new(NODE_NUMERIC);
    n->as.numeric.kind = NUM_FACTORADIC;
    n->as.numeric.text = xstrdup(digits);
    return n;
}

static Node *node_float(double value) {
    Node *n = node_new(NODE_NUMERIC);
    n->as.numeric.kind = NUM_FLOAT;
    n->as.numeric.floating = value;
    return n;
}

static bool node_is_int(Node *n) {
    return n && n->type == NODE_NUMERIC && n->as.numeric.kind == NUM_INT;
}

static long node_int_value(Node *n) {
    return n->as.numeric.integer;
}

static bool node_numeric_to_ratio(Node *n, long *numer, long *denom) {
    if (!n || n->type != NODE_NUMERIC) {
        return false;
    }
    if (n->as.numeric.kind == NUM_INT) {
        *numer = n->as.numeric.integer;
        *denom = 1;
        return true;
    }
    if (n->as.numeric.kind == NUM_RATIO) {
        *numer = n->as.numeric.numer;
        *denom = n->as.numeric.denom;
        return true;
    }
    return false;
}

static Node *numeric_from_ratio(long numer, long denom) {
    Node *r = node_ratio(numer, denom);
    if (r->as.numeric.denom == 1) {
        return node_int(r->as.numeric.numer);
    }
    return r;
}

static Node *node_atom(const char *text) {
    Node *n = node_new(NODE_ATOM);
    n->as.text = xstrdup(text);
    return n;
}

static Node *node_var(const char *text) {
    Node *n = node_new(NODE_VAR);
    n->as.text = xstrdup(text);
    return n;
}

static Node *node_string(const char *text) {
    Node *n = node_new(NODE_STRING);
    n->as.text = xstrdup(text);
    return n;
}

static Node *node_cons(Node *car, Node *cdr) {
    Node *n = node_new(NODE_CONS);
    n->as.cons.car = car;
    n->as.cons.cdr = cdr;
    return n;
}

static Node *node_predicate(const char *name, Node *args) {
    Node *n = node_new(NODE_PREDICATE);
    n->as.predicate.name = xstrdup(name);
    n->as.predicate.args = args;
    return n;
}

static Node *node_lambda(Node *params, Node *body) {
    Node *n = node_new(NODE_LAMBDA);
    n->as.lambda.params = params;
    n->as.lambda.body = body;
    return n;
}

static Node *node_query(Node *goals) {
    Node *n = node_new(NODE_QUERY);
    n->as.query.goals = goals;
    return n;
}

static bool is_nil(Node *n) {
    return !n || n->type == NODE_NIL;
}

static bool is_ascii_space(int c) {
    return c == ' ' || c == '\t' || c == '\n' || c == '\r' ||
           c == '\v' || c == '\f';
}

static bool is_atom_start(int c) {
    return isalpha((unsigned char)c) || strchr("+-*/=<>!?$%&^~@", c) != NULL;
}

static bool is_atom_char(int c) {
    return isalnum((unsigned char)c) || strchr("+-*/=<>!?$%&^~@_-", c) != NULL;
}

static bool is_var_start(int c) {
    return (c >= 'A' && c <= 'Z') || c == '_';
}

static void lexer_add(Lexer *lx, Token token) {
    if (lx->count >= MAX_TOKENS) {
        fprintf(stderr, "too many tokens\n");
        exit(1);
    }
    lx->tokens[lx->count++] = token;
}

static void lexer_skip_comment(Lexer *lx) {
    while (lx->input[lx->pos] && lx->input[lx->pos] != '\n') {
        lx->pos++;
        lx->col++;
    }
}

static void lex(Lexer *lx) {
    memset(lx->tokens, 0, sizeof(lx->tokens));
    lx->count = 0;
    lx->cursor = 0;
    lx->line = 1;
    lx->col = 1;
    lx->pos = 0;

    while (lx->input[lx->pos]) {
        char c = lx->input[lx->pos];

        if ((unsigned char)c > 0x7F) {
            fprintf(stderr, "non-ASCII input rejected at line %d col %d\n", lx->line, lx->col);
            exit(1);
        }

        if (is_ascii_space(c)) {
            if (c == '\n') {
                lx->line++;
                lx->col = 1;
            } else {
                lx->col++;
            }
            lx->pos++;
            continue;
        }

        if (c == ';') {
            lexer_skip_comment(lx);
            continue;
        }

        Token t;
        memset(&t, 0, sizeof(t));
        t.line = lx->line;
        t.col = lx->col;

        switch (c) {
        case '(':
            t.type = TOK_LPAREN;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case ')':
            t.type = TOK_RPAREN;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case '[':
            t.type = TOK_LBRACK;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case ']':
            t.type = TOK_RBRACK;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case '{':
            t.type = TOK_LBRACE;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case '}':
            t.type = TOK_RBRACE;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case '.':
            t.type = TOK_DOT;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case ',':
            t.type = TOK_COMMA;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case '|':
            t.type = TOK_PIPE;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case '\'':
            t.type = TOK_QUOTE;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case '`':
            t.type = TOK_BACKQUOTE;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case '\\':
            t.type = TOK_LAMBDA;
            lx->pos++;
            lx->col++;
            lexer_add(lx, t);
            continue;
        case '?':
            if (lx->input[lx->pos + 1] == '-') {
                t.type = TOK_QUERY;
                lx->pos += 2;
                lx->col += 2;
                lexer_add(lx, t);
                continue;
            }
            break;
        case ':':
            if (lx->input[lx->pos + 1] == '-') {
                t.type = TOK_COLON_MINUS;
                lx->pos += 2;
                lx->col += 2;
                lexer_add(lx, t);
                continue;
            }
            break;
        case '-':
            if (lx->input[lx->pos + 1] == '>') {
                t.type = TOK_ARROW;
                lx->pos += 2;
                lx->col += 2;
                lexer_add(lx, t);
                continue;
            }
            break;
        case '"': {
            int start = ++lx->pos;
            lx->col++;
            char buf[MAX_INPUT];
            int out = 0;
            while (lx->input[lx->pos] && lx->input[lx->pos] != '"') {
                char ch = lx->input[lx->pos++];
                lx->col++;
                if (ch == '\\' && lx->input[lx->pos]) {
                    char esc = lx->input[lx->pos++];
                    lx->col++;
                    switch (esc) {
                    case 'n': buf[out++] = '\n'; break;
                    case 't': buf[out++] = '\t'; break;
                    case 'r': buf[out++] = '\r'; break;
                    case '"': buf[out++] = '"'; break;
                    case '\\': buf[out++] = '\\'; break;
                    default: buf[out++] = esc; break;
                    }
                } else {
                    buf[out++] = ch;
                }
            }
            if (lx->input[lx->pos] != '"') {
                fprintf(stderr, "unterminated string at line %d col %d\n", t.line, t.col);
                exit(1);
            }
            buf[out] = '\0';
            (void)start;
            lx->pos++;
            lx->col++;
            t.type = TOK_STRING;
            t.text = xstrdup(buf);
            lexer_add(lx, t);
            continue;
        }
        default:
            break;
        }

        if (isdigit((unsigned char)c) || (c == '-' && isdigit((unsigned char)lx->input[lx->pos + 1]))) {
            int start = lx->pos;
            if (c == '-') {
                lx->pos++;
                lx->col++;
            }
            while (isdigit((unsigned char)lx->input[lx->pos])) {
                lx->pos++;
                lx->col++;
            }
            t.type = TOK_INT;
            t.text = xstrndup(&lx->input[start], (size_t)(lx->pos - start));
            t.integer = strtol(t.text, NULL, 10);
            lexer_add(lx, t);
            continue;
        }

        if (is_var_start(c)) {
            int start = lx->pos;
            while (is_atom_char((unsigned char)lx->input[lx->pos])) {
                lx->pos++;
                lx->col++;
            }
            t.type = TOK_VAR;
            t.text = xstrndup(&lx->input[start], (size_t)(lx->pos - start));
            lexer_add(lx, t);
            continue;
        }

        if (is_atom_start(c)) {
            int start = lx->pos;
            while (is_atom_char((unsigned char)lx->input[lx->pos])) {
                lx->pos++;
                lx->col++;
            }
            t.text = xstrndup(&lx->input[start], (size_t)(lx->pos - start));
            if (strcmp(t.text, "lambda") == 0) {
                t.type = TOK_LAMBDA;
            } else {
                t.type = TOK_ATOM;
            }
            lexer_add(lx, t);
            continue;
        }

        fprintf(stderr, "unsupported ASCII character '%c' at line %d col %d\n", c, lx->line, lx->col);
        exit(1);
    }

    Token eof;
    memset(&eof, 0, sizeof(eof));
    eof.type = TOK_EOF;
    eof.line = lx->line;
    eof.col = lx->col;
    lexer_add(lx, eof);
}

static Token *peek(Lexer *lx) {
    return &lx->tokens[lx->cursor];
}

static Token *advance(Lexer *lx) {
    if (lx->cursor < lx->count) {
        return &lx->tokens[lx->cursor++];
    }
    return &lx->tokens[lx->count - 1];
}

static bool match(Lexer *lx, TokenType type) {
    if (peek(lx)->type == type) {
        advance(lx);
        return true;
    }
    return false;
}

static void expect(Lexer *lx, TokenType type, const char *message) {
    Token *t = advance(lx);
    if (t->type != type) {
        fprintf(stderr, "parse error at line %d col %d: %s\n", t->line, t->col, message);
        exit(1);
    }
}

static Node *make_list_from_array(Node **items, int count) {
    Node *list = node_nil();
    for (int i = count - 1; i >= 0; --i) {
        list = node_cons(items[i], list);
    }
    return list;
}

static Node *parse_sexpr(Lexer *lx);
static Node *parse_mexpr(Lexer *lx);
static Node *parse_fexpr(Lexer *lx);
static Node *parse_prolog_term(Lexer *lx);

static Node *parse_list_body(Lexer *lx) {
    Node *items[MAX_ARGS];
    int count = 0;
    while (peek(lx)->type != TOK_RPAREN && peek(lx)->type != TOK_EOF) {
        if (match(lx, TOK_DOT)) {
            if (count == 0) {
                fprintf(stderr, "dotted pair cannot start a list\n");
                exit(1);
            }
            Node *tail = parse_sexpr(lx);
            expect(lx, TOK_RPAREN, "expected ) after dotted pair");
            for (int i = count - 1; i >= 0; --i) {
                tail = node_cons(items[i], tail);
            }
            return tail;
        }
        if (count >= MAX_ARGS) {
            fprintf(stderr, "too many list items\n");
            exit(1);
        }
        items[count++] = parse_sexpr(lx);
    }
    expect(lx, TOK_RPAREN, "expected ) to close list");
    return make_list_from_array(items, count);
}

static Node *parse_sexpr(Lexer *lx) {
    Token *t = peek(lx);
    switch (t->type) {
    case TOK_LPAREN:
        advance(lx);
        return parse_list_body(lx);
    case TOK_INT:
        advance(lx);
        return node_int(t->integer);
    case TOK_STRING:
        advance(lx);
        return node_string(t->text);
    case TOK_ATOM:
        advance(lx);
        return node_atom(t->text);
    case TOK_VAR:
        advance(lx);
        return node_var(t->text);
    case TOK_QUOTE: {
        advance(lx);
        Node *quoted = parse_sexpr(lx);
        return node_cons(node_atom("quote"), node_cons(quoted, node_nil()));
    }
    default:
        fprintf(stderr, "unexpected token in S-expression at line %d col %d\n", t->line, t->col);
        exit(1);
    }
}

static Node *parse_mexpr(Lexer *lx) {
    Token *name = advance(lx);
    if (name->type != TOK_ATOM && name->type != TOK_VAR) {
        fprintf(stderr, "M-expression must start with a name\n");
        exit(1);
    }
    Node *head = (name->type == TOK_VAR) ? node_var(name->text) : node_atom(name->text);
    if (!match(lx, TOK_LBRACK)) {
        return head;
    }
    Node *args[MAX_ARGS];
    int count = 0;
    while (peek(lx)->type != TOK_RBRACK && peek(lx)->type != TOK_EOF) {
        args[count++] = parse_mexpr(lx);
        match(lx, TOK_SEMICOLON);
    }
    expect(lx, TOK_RBRACK, "expected ] to close M-expression");
    Node *arglist = make_list_from_array(args, count);
    return node_cons(head, arglist);
}

static Node *parse_fexpr(Lexer *lx) {
    if (match(lx, TOK_LAMBDA)) {
        expect(lx, TOK_LPAREN, "expected ( after lambda");
        Node *params[MAX_ARGS];
        int count = 0;
        while (peek(lx)->type != TOK_RPAREN && peek(lx)->type != TOK_EOF) {
            Token *p = advance(lx);
            if (p->type != TOK_VAR && p->type != TOK_ATOM) {
                fprintf(stderr, "lambda parameter must be an ASCII name\n");
                exit(1);
            }
            params[count++] = node_var(p->text);
            match(lx, TOK_COMMA);
        }
        expect(lx, TOK_RPAREN, "expected ) after lambda parameter list");
        if (match(lx, TOK_ARROW)) {
            /* Arrow form is just syntax sugar here. */
        }
        Node *body = parse_fexpr(lx);
        return node_lambda(make_list_from_array(params, count), body);
    }

    if (match(lx, TOK_LBRACE)) {
        Node *items[MAX_ARGS];
        int count = 0;
        while (peek(lx)->type != TOK_RBRACE && peek(lx)->type != TOK_EOF) {
            items[count++] = parse_fexpr(lx);
            match(lx, TOK_SEMICOLON);
        }
        expect(lx, TOK_RBRACE, "expected } after block");
        return node_cons(node_atom("begin"), make_list_from_array(items, count));
    }

    Node *base;
    if (peek(lx)->type == TOK_ATOM || peek(lx)->type == TOK_VAR || peek(lx)->type == TOK_INT ||
        peek(lx)->type == TOK_STRING || peek(lx)->type == TOK_LPAREN) {
        base = parse_sexpr(lx);
    } else {
        fprintf(stderr, "unexpected token in F-expression\n");
        exit(1);
    }

    if (match(lx, TOK_LPAREN)) {
        Node *args[MAX_ARGS];
        int count = 0;
        while (peek(lx)->type != TOK_RPAREN && peek(lx)->type != TOK_EOF) {
            args[count++] = parse_fexpr(lx);
            match(lx, TOK_COMMA);
        }
        expect(lx, TOK_RPAREN, "expected ) after function application");
        return node_cons(base, make_list_from_array(args, count));
    }

    return base;
}

static Node *parse_prolog_list(Lexer *lx) {
    Node *items[MAX_ARGS];
    int count = 0;
    while (peek(lx)->type != TOK_RBRACK && peek(lx)->type != TOK_EOF) {
        items[count++] = parse_prolog_term(lx);
        if (match(lx, TOK_PIPE)) {
            Node *tail = parse_prolog_term(lx);
            expect(lx, TOK_RBRACK, "expected ] after list tail");
            for (int i = count - 1; i >= 0; --i) {
                tail = node_cons(items[i], tail);
            }
            return tail;
        }
        match(lx, TOK_COMMA);
    }
    expect(lx, TOK_RBRACK, "expected ] after Prolog list");
    return make_list_from_array(items, count);
}

static Node *parse_prolog_term(Lexer *lx) {
    Token *t = peek(lx);
    if (match(lx, TOK_VAR)) {
        return node_var(t->text);
    }
    if (match(lx, TOK_INT)) {
        return node_int(t->integer);
    }
    if (match(lx, TOK_STRING)) {
        return node_string(t->text);
    }
    if (match(lx, TOK_LBRACK)) {
        return parse_prolog_list(lx);
    }
    if (match(lx, TOK_ATOM)) {
        if (match(lx, TOK_LPAREN)) {
            Node *args[MAX_ARGS];
            int count = 0;
            while (peek(lx)->type != TOK_RPAREN && peek(lx)->type != TOK_EOF) {
                args[count++] = parse_prolog_term(lx);
                match(lx, TOK_COMMA);
            }
            expect(lx, TOK_RPAREN, "expected ) after predicate arguments");
            return node_predicate(t->text, make_list_from_array(args, count));
        }
        return node_atom(t->text);
    }
    fprintf(stderr, "unexpected token in Prolog term at line %d col %d\n", t->line, t->col);
    exit(1);
}

static Node *parse_prolog_clause(Lexer *lx) {
    Node *head = parse_prolog_term(lx);
    Node *body = node_nil();
    if (match(lx, TOK_COLON_MINUS)) {
        Node *goals[MAX_ARGS];
        int count = 0;
        do {
            goals[count++] = parse_prolog_term(lx);
        } while (match(lx, TOK_COMMA));
        body = make_list_from_array(goals, count);
    }
    expect(lx, TOK_DOT, "expected . after clause");
    return node_cons(head, body);
}

static Node *parse_query(Lexer *lx) {
    expect(lx, TOK_QUERY, "expected ?- to start query");
    Node *goals[MAX_ARGS];
    int count = 0;
    do {
        goals[count++] = parse_prolog_term(lx);
    } while (match(lx, TOK_COMMA));
    expect(lx, TOK_DOT, "expected . after query");
    return node_query(make_list_from_array(goals, count));
}

static Node *parse_with_mode(Lexer *lx, ReplMode mode) {
    if (mode == MODE_PROLOG || mode == MODE_DATALOG) {
        if (peek(lx)->type == TOK_QUERY) {
            return parse_query(lx);
        }
        return parse_prolog_clause(lx);
    }
    if (mode == MODE_MEXPR) {
        return parse_mexpr(lx);
    }
    if (mode == MODE_FEXPR) {
        return parse_fexpr(lx);
    }
    return parse_sexpr(lx);
}

static Env *env_new(Env *parent) {
    Env *env = xmalloc(sizeof(*env));
    env->parent = parent;
    return env;
}

static void env_define(Env *env, const char *name, Node *value) {
    for (int i = 0; i < env->count; ++i) {
        if (strcmp(env->bindings[i].name, name) == 0) {
            env->bindings[i].value = value;
            return;
        }
    }
    if (env->count >= MAX_BINDINGS) {
        fprintf(stderr, "environment full\n");
        exit(1);
    }
    env->bindings[env->count].name = xstrdup(name);
    env->bindings[env->count].value = value;
    env->count++;
}

static Node *env_lookup(Env *env, const char *name) {
    for (Env *scan = env; scan; scan = scan->parent) {
        for (int i = 0; i < scan->count; ++i) {
            if (strcmp(scan->bindings[i].name, name) == 0) {
                return scan->bindings[i].value;
            }
        }
    }
    return NULL;
}

static int list_length(Node *list) {
    int n = 0;
    for (Node *scan = list; !is_nil(scan) && scan->type == NODE_CONS; scan = scan->as.cons.cdr) {
        n++;
    }
    return n;
}

static Node *list_nth(Node *list, int n) {
    Node *scan = list;
    while (!is_nil(scan) && scan->type == NODE_CONS && n-- > 0) {
        scan = scan->as.cons.cdr;
    }
    if (!is_nil(scan) && scan->type == NODE_CONS) {
        return scan->as.cons.car;
    }
    return node_nil();
}

static bool node_truthy(Node *n) {
    return !is_nil(n);
}

static Node *eval(Node *expr, Env *env);

static Node *eval_each(Node *list, Env *env) {
    Node *items[MAX_ARGS];
    int count = 0;
    for (Node *scan = list; !is_nil(scan) && scan->type == NODE_CONS; scan = scan->as.cons.cdr) {
        items[count++] = eval(scan->as.cons.car, env);
    }
    return make_list_from_array(items, count);
}

static Node *apply_lambda(Node *fn, Node *args, Env *env) {
    Env *call_env = env_new(env);
    Node *params = fn->as.lambda.params;
    Node *arg_values = eval_each(args, env);
    Node *p = params;
    Node *a = arg_values;
    while (!is_nil(p) && !is_nil(a) && p->type == NODE_CONS && a->type == NODE_CONS) {
        Node *name = p->as.cons.car;
        if (name->type == NODE_ATOM || name->type == NODE_VAR) {
            env_define(call_env, name->as.text, a->as.cons.car);
        }
        p = p->as.cons.cdr;
        a = a->as.cons.cdr;
    }
    return eval(fn->as.lambda.body, call_env);
}

static Node *eval_builtin(Node *op, Node *args, Env *env) {
    const char *name = op->as.text;
    long lhs_n = 0, lhs_d = 1;
    long rhs_n = 0, rhs_d = 1;
    if (strcmp(name, "quote") == 0) {
        return list_nth(args, 0);
    }
    if (strcmp(name, "if") == 0) {
        Node *cond = eval(list_nth(args, 0), env);
        return node_truthy(cond) ? eval(list_nth(args, 1), env) : eval(list_nth(args, 2), env);
    }
    if (strcmp(name, "define") == 0) {
        Node *sym = list_nth(args, 0);
        Node *val = eval(list_nth(args, 1), env);
        if (sym->type != NODE_ATOM && sym->type != NODE_VAR) {
            fprintf(stderr, "define expects an ASCII symbol name\n");
            exit(1);
        }
        env_define(env, sym->as.text, val);
        return val;
    }
    if (strcmp(name, "lambda") == 0) {
        return node_lambda(list_nth(args, 0), list_nth(args, 1));
    }
    if (strcmp(name, "begin") == 0) {
        Node *result = node_nil();
        for (Node *scan = args; !is_nil(scan) && scan->type == NODE_CONS; scan = scan->as.cons.cdr) {
            result = eval(scan->as.cons.car, env);
        }
        return result;
    }
    if (strcmp(name, "+") == 0) {
        long numer = 0;
        long denom = 1;
        for (Node *scan = args; !is_nil(scan) && scan->type == NODE_CONS; scan = scan->as.cons.cdr) {
            Node *v = eval(scan->as.cons.car, env);
            if (!node_numeric_to_ratio(v, &rhs_n, &rhs_d)) {
                fprintf(stderr, "+ only supports INT/RATIO exact numerics\n");
                exit(1);
            }
            numer = numer * rhs_d + rhs_n * denom;
            denom *= rhs_d;
        }
        return numeric_from_ratio(numer, denom);
    }
    if (strcmp(name, "-") == 0) {
        Node *a = eval(list_nth(args, 0), env);
        Node *b = eval(list_nth(args, 1), env);
        if (!node_numeric_to_ratio(a, &lhs_n, &lhs_d) || !node_numeric_to_ratio(b, &rhs_n, &rhs_d)) {
            fprintf(stderr, "- only supports INT/RATIO exact numerics\n");
            exit(1);
        }
        return numeric_from_ratio(lhs_n * rhs_d - rhs_n * lhs_d, lhs_d * rhs_d);
    }
    if (strcmp(name, "*") == 0) {
        long numer = 1;
        long denom = 1;
        for (Node *scan = args; !is_nil(scan) && scan->type == NODE_CONS; scan = scan->as.cons.cdr) {
            Node *v = eval(scan->as.cons.car, env);
            if (!node_numeric_to_ratio(v, &rhs_n, &rhs_d)) {
                fprintf(stderr, "* only supports INT/RATIO exact numerics\n");
                exit(1);
            }
            numer *= rhs_n;
            denom *= rhs_d;
        }
        return numeric_from_ratio(numer, denom);
    }
    if (strcmp(name, "esc") == 0) {
        Node *tag = eval(list_nth(args, 0), env);
        Node *a0 = eval(list_nth(args, 1), env);
        Node *a1 = eval(list_nth(args, 2), env);
        const char *mode = NULL;
        if (tag->type == NODE_ATOM || tag->type == NODE_VAR || tag->type == NODE_STRING) {
            mode = tag->as.text;
        }
        if (!mode) {
            fprintf(stderr, "esc expects a textual numeric mode tag\n");
            exit(1);
        }
        if (strcmp(mode, "int") == 0) {
            if (!node_is_int(a0)) {
                fprintf(stderr, "esc int expects integer payload\n");
                exit(1);
            }
            return node_int(node_int_value(a0));
        }
        if (strcmp(mode, "bcd") == 0) {
            if (a0->type == NODE_STRING || a0->type == NODE_ATOM || a0->type == NODE_VAR) {
                return node_bcd(a0->as.text);
            }
            fprintf(stderr, "esc bcd expects ASCII digit string payload\n");
            exit(1);
        }
        if (strcmp(mode, "ratio") == 0) {
            if (!node_is_int(a0) || !node_is_int(a1)) {
                fprintf(stderr, "esc ratio expects two integer payload terms\n");
                exit(1);
            }
            return node_ratio(node_int_value(a0), node_int_value(a1));
        }
        if (strcmp(mode, "factoradic") == 0) {
            if (a0->type == NODE_STRING || a0->type == NODE_ATOM || a0->type == NODE_VAR) {
                return node_factoradic(a0->as.text);
            }
            fprintf(stderr, "esc factoradic expects ASCII digit sequence string\n");
            exit(1);
        }
        if (strcmp(mode, "float") == 0) {
            if (node_is_int(a0)) {
                return node_float((double)node_int_value(a0));
            }
            fprintf(stderr, "esc float expects integer payload in this prototype\n");
            exit(1);
        }
        fprintf(stderr, "unknown esc numeric mode: %s\n", mode);
        exit(1);
    }
    if (strcmp(name, "list") == 0) {
        return eval_each(args, env);
    }
    if (strcmp(name, "cons") == 0) {
        return node_cons(eval(list_nth(args, 0), env), eval(list_nth(args, 1), env));
    }
    if (strcmp(name, "car") == 0) {
        Node *v = eval(list_nth(args, 0), env);
        if (v->type == NODE_CONS) {
            return v->as.cons.car;
        }
        return node_nil();
    }
    if (strcmp(name, "cdr") == 0) {
        Node *v = eval(list_nth(args, 0), env);
        if (v->type == NODE_CONS) {
            return v->as.cons.cdr;
        }
        return node_nil();
    }
    if (strcmp(name, "null?") == 0 || strcmp(name, "nullp") == 0) {
        return is_nil(eval(list_nth(args, 0), env)) ? node_atom("t") : node_nil();
    }
    if (strcmp(name, "eq?") == 0 || strcmp(name, "eq") == 0) {
        Node *a = eval(list_nth(args, 0), env);
        Node *b = eval(list_nth(args, 1), env);
        if (node_numeric_to_ratio(a, &lhs_n, &lhs_d) && node_numeric_to_ratio(b, &rhs_n, &rhs_d) &&
            lhs_n * rhs_d == rhs_n * lhs_d) {
            return node_atom("t");
        }
        if ((a->type == NODE_ATOM || a->type == NODE_VAR) &&
            (b->type == NODE_ATOM || b->type == NODE_VAR) &&
            strcmp(a->as.text, b->as.text) == 0) {
            return node_atom("t");
        }
        return a == b ? node_atom("t") : node_nil();
    }
    return NULL;
}

static Node *eval(Node *expr, Env *env) {
    if (!expr) {
        return node_nil();
    }
    switch (expr->type) {
    case NODE_NIL:
    case NODE_NUMERIC:
    case NODE_STRING:
    case NODE_LAMBDA:
    case NODE_PREDICATE:
    case NODE_QUERY:
        return expr;
    case NODE_ATOM: {
        Node *bound = env_lookup(env, expr->as.text);
        return bound ? bound : expr;
    }
    case NODE_VAR: {
        Node *bound = env_lookup(env, expr->as.text);
        return bound ? bound : expr;
    }
    case NODE_CONS: {
        Node *op = eval(expr->as.cons.car, env);
        Node *args = expr->as.cons.cdr;
        if (op->type == NODE_ATOM) {
            Node *builtin = eval_builtin(op, args, env);
            if (builtin) {
                return builtin;
            }
        }
        if (op->type == NODE_LAMBDA) {
            return apply_lambda(op, args, env);
        }
        return node_cons(op, eval_each(args, env));
    }
    }
    return node_nil();
}

static bool occurs(Node *var, Node *term, SubstSet *subs) {
    if (var == term) {
        return true;
    }
    if (term->type == NODE_VAR) {
        for (int i = 0; i < subs->count; ++i) {
            if (subs->items[i].var == term) {
                return occurs(var, subs->items[i].value, subs);
            }
        }
        return false;
    }
    if (term->type == NODE_CONS) {
        return occurs(var, term->as.cons.car, subs) || occurs(var, term->as.cons.cdr, subs);
    }
    if (term->type == NODE_PREDICATE) {
        return occurs(var, term->as.predicate.args, subs);
    }
    return false;
}

static Node *subst_lookup(SubstSet *subs, Node *var) {
    for (int i = 0; i < subs->count; ++i) {
        if (subs->items[i].var == var) {
            return subs->items[i].value;
        }
    }
    return NULL;
}

static bool unify(Node *a, Node *b, SubstSet *subs) {
    if (a->type == NODE_VAR) {
        Node *bound = subst_lookup(subs, a);
        if (bound) {
            return unify(bound, b, subs);
        }
    }
    if (b->type == NODE_VAR) {
        Node *bound = subst_lookup(subs, b);
        if (bound) {
            return unify(a, bound, subs);
        }
    }
    if (a->type == NODE_VAR) {
        if (occurs(a, b, subs)) {
            return false;
        }
        subs->items[subs->count].var = a;
        subs->items[subs->count].value = b;
        subs->count++;
        return true;
    }
    if (b->type == NODE_VAR) {
        if (occurs(b, a, subs)) {
            return false;
        }
        subs->items[subs->count].var = b;
        subs->items[subs->count].value = a;
        subs->count++;
        return true;
    }
    if (a->type != b->type) {
        return false;
    }
    switch (a->type) {
    case NODE_NIL:
        return true;
    case NODE_NUMERIC: {
        long an = 0, ad = 0, bn = 0, bd = 0;
        if (node_numeric_to_ratio(a, &an, &ad) && node_numeric_to_ratio(b, &bn, &bd)) {
            return an * bd == bn * ad;
        }
        if (a->as.numeric.kind != b->as.numeric.kind) {
            return false;
        }
        switch (a->as.numeric.kind) {
        case NUM_BCD:
        case NUM_FACTORADIC:
            return strcmp(a->as.numeric.text, b->as.numeric.text) == 0;
        case NUM_FLOAT:
            return a->as.numeric.floating == b->as.numeric.floating;
        default:
            return false;
        }
    }
    case NODE_ATOM:
    case NODE_STRING:
        return strcmp(a->as.text, b->as.text) == 0;
    case NODE_CONS:
        return unify(a->as.cons.car, b->as.cons.car, subs) &&
               unify(a->as.cons.cdr, b->as.cons.cdr, subs);
    case NODE_PREDICATE:
        return strcmp(a->as.predicate.name, b->as.predicate.name) == 0 &&
               unify(a->as.predicate.args, b->as.predicate.args, subs);
    default:
        return false;
    }
}

static Node *apply_subst(Node *term, SubstSet *subs) {
    if (term->type == NODE_VAR) {
        Node *bound = subst_lookup(subs, term);
        return bound ? apply_subst(bound, subs) : term;
    }
    if (term->type == NODE_CONS) {
        return node_cons(apply_subst(term->as.cons.car, subs), apply_subst(term->as.cons.cdr, subs));
    }
    if (term->type == NODE_PREDICATE) {
        return node_predicate(term->as.predicate.name, apply_subst(term->as.predicate.args, subs));
    }
    return term;
}

static bool solve_goal_list(Node *goals, SubstSet *subs, int depth);

static bool solve_builtin_goal(Node *goal, SubstSet *subs) {
    if (goal->type != NODE_PREDICATE) {
        return false;
    }
    if (strcmp(goal->as.predicate.name, "true") == 0) {
        return true;
    }
    if (strcmp(goal->as.predicate.name, "write") == 0) {
        Node *arg = apply_subst(list_nth(goal->as.predicate.args, 0), subs);
        if (arg->type == NODE_NUMERIC && arg->as.numeric.kind == NUM_INT) {
            printf("%ld", arg->as.numeric.integer);
        } else if (arg->type == NODE_ATOM || arg->type == NODE_VAR || arg->type == NODE_STRING) {
            printf("%s", arg->as.text);
        } else {
            printf("<term>");
        }
        return true;
    }
    if (strcmp(goal->as.predicate.name, "nl") == 0) {
        printf("\n");
        return true;
    }
    return false;
}

static bool solve_single_goal(Node *goal, SubstSet *subs, int depth) {
    if (depth > MAX_DEPTH) {
        return false;
    }
    if (solve_builtin_goal(goal, subs)) {
        return true;
    }
    for (int i = 0; i < g_db.fact_count; ++i) {
        SubstSet copy = *subs;
        if (unify(goal, g_db.facts[i], &copy)) {
            *subs = copy;
            return true;
        }
    }
    for (int i = 0; i < g_db.rule_count; ++i) {
        SubstSet copy = *subs;
        if (unify(goal, g_db.rules[i].head, &copy)) {
            Node *body = apply_subst(g_db.rules[i].body, &copy);
            if (solve_goal_list(body, &copy, depth + 1)) {
                *subs = copy;
                return true;
            }
        }
    }
    return false;
}

static bool solve_goal_list(Node *goals, SubstSet *subs, int depth) {
    for (Node *scan = goals; !is_nil(scan) && scan->type == NODE_CONS; scan = scan->as.cons.cdr) {
        Node *goal = apply_subst(scan->as.cons.car, subs);
        if (!solve_single_goal(goal, subs, depth)) {
            return false;
        }
    }
    return true;
}

static void print_node(Node *node);

static void print_list(Node *list) {
    printf("(");
    Node *scan = list;
    bool first = true;
    while (!is_nil(scan) && scan->type == NODE_CONS) {
        if (!first) {
            printf(" ");
        }
        print_node(scan->as.cons.car);
        first = false;
        scan = scan->as.cons.cdr;
    }
    if (!is_nil(scan)) {
        printf(" . ");
        print_node(scan);
    }
    printf(")");
}

static void print_predicate(Node *node) {
    printf("%s(", node->as.predicate.name);
    Node *scan = node->as.predicate.args;
    bool first = true;
    while (!is_nil(scan) && scan->type == NODE_CONS) {
        if (!first) {
            printf(", ");
        }
        print_node(scan->as.cons.car);
        first = false;
        scan = scan->as.cons.cdr;
    }
    printf(")");
}

static void print_node(Node *node) {
    if (!node) {
        printf("()");
        return;
    }
    switch (node->type) {
    case NODE_NIL:
        printf("()");
        break;
    case NODE_NUMERIC:
        switch (node->as.numeric.kind) {
        case NUM_INT:
            printf("%ld", node->as.numeric.integer);
            break;
        case NUM_BCD:
            printf("bcd:%s", node->as.numeric.text);
            break;
        case NUM_RATIO:
            printf("ratio:%ld/%ld", node->as.numeric.numer, node->as.numeric.denom);
            break;
        case NUM_FACTORADIC:
            printf("factoradic:%s", node->as.numeric.text);
            break;
        case NUM_FLOAT:
            printf("float:%g", node->as.numeric.floating);
            break;
        }
        break;
    case NODE_ATOM:
    case NODE_VAR:
        printf("%s", node->as.text);
        break;
    case NODE_STRING:
        printf("\"%s\"", node->as.text);
        break;
    case NODE_CONS:
        print_list(node);
        break;
    case NODE_PREDICATE:
        print_predicate(node);
        break;
    case NODE_LAMBDA:
        printf("(lambda ");
        print_node(node->as.lambda.params);
        printf(" ");
        print_node(node->as.lambda.body);
        printf(")");
        break;
    case NODE_QUERY:
        printf("?- ");
        print_node(node->as.query.goals);
        break;
    }
}

static void print_substitutions(SubstSet *subs) {
    bool any = false;
    for (int i = 0; i < subs->count; ++i) {
        if (subs->items[i].var->type == NODE_VAR) {
            printf("%s = ", subs->items[i].var->as.text);
            print_node(apply_subst(subs->items[i].value, subs));
            printf("\n");
            any = true;
        }
    }
    if (!any) {
        printf("true.\n");
    }
}

static void logic_assert(Node *expr) {
    if (expr->type != NODE_CONS) {
        fprintf(stderr, "logic assertion must be head :- body or fact.\n");
        return;
    }
    Node *head = expr->as.cons.car;
    Node *body = expr->as.cons.cdr;
    if (is_nil(body)) {
        if (g_db.fact_count >= MAX_FACTS) {
            fprintf(stderr, "fact store full\n");
            return;
        }
        g_db.facts[g_db.fact_count++] = head;
        printf("fact asserted.\n");
        return;
    }
    if (g_db.rule_count >= MAX_RULES) {
        fprintf(stderr, "rule store full\n");
        return;
    }
    g_db.rules[g_db.rule_count].head = head;
    g_db.rules[g_db.rule_count].body = body;
    g_db.rule_count++;
    printf("rule asserted.\n");
}

static void run_query(Node *expr) {
    if (expr->type != NODE_QUERY) {
        fprintf(stderr, "query node expected\n");
        return;
    }
    SubstSet subs;
    memset(&subs, 0, sizeof(subs));
    if (solve_goal_list(expr->as.query.goals, &subs, 0)) {
        print_substitutions(&subs);
    } else {
        printf("false.\n");
    }
}

static const char *mode_name(ReplMode mode) {
    switch (mode) {
    case MODE_SEXPR: return "sexpr";
    case MODE_MEXPR: return "mexpr";
    case MODE_FEXPR: return "fexpr";
    case MODE_PROLOG: return "prolog";
    case MODE_DATALOG: return "datalog";
    }
    return "unknown";
}

static void print_ascii_help(void) {
    printf("ASCII structural bytes: ESC=%d FS=%d GS=%d RS=%d US=%d\n",
           ASCII_ESC, ASCII_FS, ASCII_GS, ASCII_RS, ASCII_US);
    printf("This interpreter accepts ASCII text input only.\n");
    printf("Exact numerics via ESC forms: int, bcd, ratio, factoradic, float.\n");
}

static void repl(void) {
    char line[MAX_INPUT];
    ReplMode mode = MODE_SEXPR;

    printf("ASCII logic interpreter\n");
    printf("Modes: :s :m :f :p :d  Commands: :q :h :ascii\n");

    while (1) {
        printf("%s> ", mode_name(mode));
        fflush(stdout);

        if (!fgets(line, sizeof(line), stdin)) {
            break;
        }

        if (line[0] == ':') {
            if (strncmp(line, ":q", 2) == 0) {
                break;
            }
            if (strncmp(line, ":s", 2) == 0) {
                mode = MODE_SEXPR;
                continue;
            }
            if (strncmp(line, ":m", 2) == 0) {
                mode = MODE_MEXPR;
                continue;
            }
            if (strncmp(line, ":f", 2) == 0) {
                mode = MODE_FEXPR;
                continue;
            }
            if (strncmp(line, ":p", 2) == 0) {
                mode = MODE_PROLOG;
                continue;
            }
            if (strncmp(line, ":d", 2) == 0) {
                mode = MODE_DATALOG;
                continue;
            }
            if (strncmp(line, ":ascii", 6) == 0) {
                print_ascii_help();
                continue;
            }
            if (strncmp(line, ":h", 2) == 0) {
                printf("Examples:\n");
                printf("  :s   (+ 1 2 3)\n");
                printf("  :s   (+ (esc ratio 1 3) (esc ratio 2 3))\n");
                printf("  :s   (esc bcd \"123456\")\n");
                printf("  :s   (esc factoradic \"0 0 3 2 0 6\")\n");
                printf("  :m   list[1; 2; 3]\n");
                printf("  :f   lambda(x)->(+ x 1)\n");
                printf("  :p   parent(john, mary).\n");
                printf("  :p   ?- parent(X, mary).\n");
                continue;
            }
        }

        Lexer lx;
        memset(&lx, 0, sizeof(lx));
        lx.input = line;
        lex(&lx);
        if (peek(&lx)->type == TOK_EOF) {
            continue;
        }

        Node *expr = parse_with_mode(&lx, mode);
        if (mode == MODE_PROLOG || mode == MODE_DATALOG) {
            if (expr->type == NODE_QUERY) {
                run_query(expr);
            } else {
                logic_assert(expr);
            }
        } else {
            Node *result = eval(expr, g_env);
            print_node(result);
            printf("\n");
        }
    }
}

static void load_file(const char *path, ReplMode mode) {
    FILE *fp = fopen(path, "r");
    if (!fp) {
        fprintf(stderr, "cannot open %s\n", path);
        exit(1);
    }

    char line[MAX_INPUT];
    while (fgets(line, sizeof(line), fp)) {
        if (line[0] == '\n' || line[0] == '\0') {
            continue;
        }
        Lexer lx;
        memset(&lx, 0, sizeof(lx));
        lx.input = line;
        lex(&lx);
        if (peek(&lx)->type == TOK_EOF) {
            continue;
        }
        Node *expr = parse_with_mode(&lx, mode);
        if (mode == MODE_PROLOG || mode == MODE_DATALOG) {
            if (expr->type == NODE_QUERY) {
                run_query(expr);
            } else {
                logic_assert(expr);
            }
        } else {
            print_node(eval(expr, g_env));
            printf("\n");
        }
    }

    fclose(fp);
}

static ReplMode parse_cli_mode(int argc, char **argv, int *file_index) {
    ReplMode mode = MODE_SEXPR;
    *file_index = 0;
    for (int i = 1; i < argc; ++i) {
        if (strcmp(argv[i], "--sexpr") == 0) {
            mode = MODE_SEXPR;
        } else if (strcmp(argv[i], "--mexpr") == 0) {
            mode = MODE_MEXPR;
        } else if (strcmp(argv[i], "--fexpr") == 0) {
            mode = MODE_FEXPR;
        } else if (strcmp(argv[i], "--prolog") == 0) {
            mode = MODE_PROLOG;
        } else if (strcmp(argv[i], "--datalog") == 0) {
            mode = MODE_DATALOG;
        } else {
            *file_index = i;
            break;
        }
    }
    return mode;
}

int main(int argc, char **argv) {
    g_env = env_new(NULL);
    env_define(g_env, "nil", node_nil());
    env_define(g_env, "t", node_atom("t"));

    int file_index = 0;
    ReplMode mode = parse_cli_mode(argc, argv, &file_index);

    if (file_index > 0) {
        load_file(argv[file_index], mode);
        return 0;
    }

    repl();
    return 0;
}
