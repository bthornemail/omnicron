/*
 * OMNITRON DDC LEXICON
 * Two-graph index for canonical term classification.
 *
 * Graph A: term -> DDC-style number
 * Graph B: DDC-style number -> canonical definition and projections
 *
 * This interface is intentionally transport-safe and ASCII-first.
 * Use symbolic names for braille/aegean labels in C strings.
 */

#ifndef OMNITRON_DDC_LEXICON_H
#define OMNITRON_DDC_LEXICON_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

/* ============================================================
 * DDC NUMBERING
 * ============================================================ */

typedef struct {
    uint16_t main_class;      /* 0..11 */
    uint16_t division;        /* 0..11 */
    uint16_t section;         /* 0..11 */
    uint16_t subsection;      /* 0..999 */
    uint16_t subsubsection;   /* 0..999 */
} DDCNumber;

typedef enum {
    OMNITRON_000 = 0,  /* Generalities */
    OMNITRON_100 = 1,  /* Invariants / foundations */
    OMNITRON_200 = 2,  /* Canonical identity / closure */
    OMNITRON_300 = 3,  /* Federation / peer relations */
    OMNITRON_400 = 4,  /* Notations / grammar */
    OMNITRON_500 = 5,  /* Sexagesimal / cycles / fano */
    OMNITRON_600 = 6,  /* Opcodes / events / runtime */
    OMNITRON_700 = 7,  /* Projections / views */
    OMNITRON_800 = 8,  /* Program / log structures */
    OMNITRON_900 = 9,  /* Receipts / ledgers */
    OMNITRON_A00 = 10, /* Metatron extensions */
    OMNITRON_B00 = 11  /* Merkaba / projective extensions */
} OmnitronMainClass;

/* Convert hierarchical DDC fields into one sortable numeric key. */
static inline uint32_t ddc_to_index(DDCNumber ddc) {
    return (uint32_t)(ddc.main_class * 1000000u) +
           (uint32_t)(ddc.division   * 100000u) +
           (uint32_t)(ddc.section    * 10000u) +
           (uint32_t)(ddc.subsection * 10u) +
           (uint32_t)ddc.subsubsection;
}

/* ============================================================
 * TWO-GRAPH ENTRIES
 * ============================================================ */

typedef struct TermEntry {
    const char *term;
    const char *const *aliases;
    int alias_count;
    DDCNumber classification;
    uint64_t content_hash;
} TermEntry;

typedef struct ClassEntry {
    DDCNumber classification;
    const char *heading;
    const char *scope_note;
    const char *class_elsewhere;

    /* Projection labels through the pipeline surfaces. */
    const char *prolog_term;
    const char *sexpr_form;
    const char *mexpr_form;
    const char *fexpr_form;
    const char *ascii_control;
    const char *braille_form;
    const char *aegean_form;

    /* Hierarchy and related links (indices into class index). */
    const DDCNumber *subordinates;
    int subordinate_count;
    DDCNumber superordinate;
    const DDCNumber *see_also;
    int see_also_count;
} ClassEntry;

typedef struct {
    uint64_t left_index;
    uint64_t right_index;
    const char *relation; /* e.g. "see_also", "parent", "projection_of" */
} LexiconEdge;

typedef struct OmnitronLexicon {
    struct {
        TermEntry **entries;
        int count;
        int capacity;
    } term_index;

    struct {
        ClassEntry **entries;
        int count;
        int capacity;
    } class_index;

    struct {
        LexiconEdge *edges;
        int edge_count;
        int edge_capacity;
    } relationships;
} OmnitronLexicon;

/* ============================================================
 * STABLE BOOTSTRAP IDS
 * ============================================================ */

typedef enum {
    BOOT_000_GENERAL = 0,
    BOOT_001_PARSE,
    BOOT_002_NORMALIZE,
    BOOT_003_COMPILE,
    BOOT_004_EMIT,
    BOOT_100_INVARIANTS,
    BOOT_101_PREDICATE_IDENTITY,
    BOOT_102_ARGUMENT_ORDER,
    BOOT_103_STAGE_MEANING,
    BOOT_104_RECEIPT_MEANING,
    BOOT_105_CANONICAL_ADDRESS,
    BOOT_106_GRAMMAR_BOUNDARIES,
    BOOT_500_SEXAGESIMAL,
    BOOT_501_SLOT60,
    BOOT_502_FANO,
    BOOT_503_GRAND_CYCLE,
    BOOT_504_OMICRON,
    BOOT_600_EVENTS,
    BOOT_601_OPCODES,
    BOOT_602_WLOG,
    BOOT_603_RUNTIME,
    BOOT_900_RECEIPTS,
    BOOT_901_LEDGER,
    BOOT_A00_METATRON,
    BOOT_B00_MERKABA,
    BOOT_ID_COUNT
} BootstrapClassId;

/* ============================================================
 * API
 * ============================================================ */

OmnitronLexicon *lexicon_create(void);
void lexicon_destroy(OmnitronLexicon *lex);

/* Graph A lookups */
const TermEntry *lexicon_lookup_term_entry(const OmnitronLexicon *lex, const char *term);
bool lexicon_classify_term(const OmnitronLexicon *lex, const char *term, DDCNumber *out_ddc);

/* Graph B lookups */
const ClassEntry *lexicon_lookup_class(const OmnitronLexicon *lex, DDCNumber ddc);
const ClassEntry *lexicon_lookup_class_by_index(const OmnitronLexicon *lex, uint32_t ddc_index);

/* Cross-surface projections */
const char *lexicon_project_to_prolog(const OmnitronLexicon *lex, DDCNumber ddc);
const char *lexicon_project_to_sexpr(const OmnitronLexicon *lex, DDCNumber ddc);
const char *lexicon_project_to_mexpr(const OmnitronLexicon *lex, DDCNumber ddc);
const char *lexicon_project_to_fexpr(const OmnitronLexicon *lex, DDCNumber ddc);
const char *lexicon_project_to_ascii(const OmnitronLexicon *lex, DDCNumber ddc);
const char *lexicon_project_to_braille(const OmnitronLexicon *lex, DDCNumber ddc);
const char *lexicon_project_to_aegean(const OmnitronLexicon *lex, DDCNumber ddc);

/* Graph navigation */
const ClassEntry **lexicon_get_subordinates(const OmnitronLexicon *lex, DDCNumber ddc, int *out_count);
const ClassEntry *lexicon_get_superordinate(const OmnitronLexicon *lex, DDCNumber ddc);
const ClassEntry **lexicon_get_related(const OmnitronLexicon *lex, DDCNumber ddc, int *out_count);

/* Bootstrap loader */
void lexicon_load_bootstrap(OmnitronLexicon *lex);

/* Optional memory-mapped view for runtime integration. */
typedef struct {
    DDCNumber ddc;
    uint64_t virtual_address;
    size_t size;
    const ClassEntry *entry;
} QEMULexiconMapping;

typedef struct {
    void *base_address;
    size_t total_size;
    QEMULexiconMapping *mappings;
    int mapping_count;
} MemoryMappedLexicon;

bool lexicon_map_virtual(const OmnitronLexicon *lex, MemoryMappedLexicon *out_map);
void lexicon_unmap_virtual(MemoryMappedLexicon *map);

#endif /* OMNITRON_DDC_LEXICON_H */
