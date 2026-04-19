#ifndef COMPOSITION_H
#define COMPOSITION_H

#include <stdint.h>

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: SUPPORT FILE / PROTOTYPE ALGORITHM
 *
 * This header contains a self-contained composition model built around:
 * - Fano-plane triples
 * - control-plane names
 * - a small delta-law helper
 * - a deterministic "choose one composition at a tick" function
 *
 * It should be read as algorithmic scaffolding. It is not currently the direct
 * source of truth for the live `my_kernel.flat` runtime path.
 */

// ============================================================
// COMPOSITION ALGORITHM
// Deterministic composition rule for Control–Projective Lattice
// ============================================================

// ============================================================
// 1. FANO PLANE (7 points, 7 lines)
// Port Atom indices:
//   0 = ESC (Escape)
//   1 = FS  (File Separator / Context)
//   2 = GS  (Group Separator / Record)
//   3 = RS  (Record Separator / Unit)
//   4 = US  (Unit Separator / Separator)
//   5 = CP  (Control Point)
//   6 = CB  (Control Bar)
// ============================================================

#define ESC 0
#define FS  1
#define GS  2
#define RS  3
#define US  4
#define CP  5
#define CB  6

// Port atoms
/* Human-readable names for the seven point labels above. */
static const char *port_atom_names[] = {"ESC", "FS", "GS", "RS", "US", "CP", "CB"};

// 7 Fano lines (each is a triple of port atoms)
static const uint8_t fano_lines[7][3] = {
    {ESC, FS, US},   // Line 0
    {ESC, GS, CP},   // Line 1
    {ESC, RS, CB},   // Line 2
    {FS,  GS, CB},  // Line 3
    {FS,  RS, CP},  // Line 4
    {GS,  RS, US},   // Line 5
    {US,  CP, CB}   // Line 6
};

// All 7 Fano lines (for validation)
static const uint8_t all_fano_lines[7][3] = {
    {0, 1, 4}, {0, 2, 5}, {0, 3, 6},
    {1, 2, 6}, {1, 3, 5}, {2, 3, 4}, {4, 5, 6}
};

// ============================================================
// 2. CONTROL PLANES (FS/GS/RS/US)
// ============================================================

#define CTRL_FS 0  // Reset / no constraint
#define CTRL_GS 1  // Group / always allow
#define CTRL_RS 2  // Directional / chirality decides
#define CTRL_US 3  // Atomic / always allow

static const char *control_names[] = {"FS", "GS", "RS", "US"};

// ============================================================
// 3. DELTA LAW (State Evolution)
// Δ(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
// ============================================================

#define WIDTH 16
#define MASK  ((1 << WIDTH) - 1)

static inline uint32_t rotl(uint32_t x, int k) {
    k = k % WIDTH;
    return ((x << k) | (x >> (WIDTH - k))) & MASK;
}

static inline uint32_t rotr(uint32_t x, int k) {
    k = k % WIDTH;
    return ((x >> k) | (x << (WIDTH - k))) & MASK;
}

static inline uint32_t delta(uint32_t x, uint32_t C) {
    return (rotl(x, 1) ^ rotl(x, 3) ^ rotr(x, 2) ^ C) & MASK;
}

// Kernel constant GS (0x1D) repeated
static inline uint32_t kernel_constant(void) {
    /* Repeated GS / 0x1D value in 16-bit form. */
    return 0x1D1D;
}

// ============================================================
// 4. FANO TIMING
// Phase cycles through 7 Fano lines
// ============================================================

static inline uint8_t fano_phase(uint32_t tick) {
    /* Pick one of the 7 Fano positions from the raw tick. */
    return tick % 7;
}

static inline void fano_triplet(uint8_t phase, uint8_t *a, uint8_t *b, uint8_t *c) {
    *a = fano_lines[phase][0];
    *b = fano_lines[phase][1];
    *c = fano_lines[phase][2];
}

// ============================================================
// 5. GLOBAL CENTROID
// Parity of kernel state (popcount mod 2)
// ============================================================

static inline uint8_t popcount16(uint32_t x) {
    x = x - ((x >> 1) & 0x5555);
    x = (x & 0x3333) + ((x >> 2) & 0x3333);
    x = (x + (x >> 4)) & 0x0F0F;
    return (x + (x >> 8)) & 0x1F;
}

static inline uint8_t global_centroid(uint32_t state) {
    return popcount16(state) & 1;
}

// ============================================================
// 6. CHIRALITY (Orientation)
// Chirality from centroid parity
// ============================================================

static inline uint8_t chirality(uint8_t centroid_parity) {
    return centroid_parity;  // 0 = left, 1 = right
}

// Order triple according to chirality
static inline void orient(uint8_t chi, uint8_t *a, uint8_t *b, uint8_t *c) {
    if (chi == 1) {
        // Swap second and third for right chirality
        uint8_t tmp = *b;
        *b = *c;
        *c = tmp;
    }
}

// ============================================================
// 7. FIND LINES CONTAINING A POINT
// Returns up to 3 lines containing a given Fano point
// ============================================================

static inline uint8_t lines_containing(uint8_t point, uint8_t results[]) {
    uint8_t count = 0;
    for (uint8_t i = 0; i < 7; i++) {
        if (fano_lines[i][0] == point || 
            fano_lines[i][1] == point || 
            fano_lines[i][2] == point) {
            results[count++] = i;
        }
    }
    return count;
}

// ============================================================
// 8. CONTROL GATING
// FS = reset (allow), GS = group (allow), RS = directional, US = atomic
// ============================================================

static inline uint8_t gate_control(uint8_t ctrl, uint8_t line[]) {
    (void)ctrl; (void)line;
    // This is currently permissive scaffolding: every candidate line is allowed.
    return 1;
}

// ============================================================
// 9. LINE PARITY (XOR of indices)
// Line is valid iff XOR = 0
// ============================================================

static inline uint8_t line_parity(uint8_t a, uint8_t b, uint8_t c) {
    return a ^ b ^ c;
}

// ============================================================
// 10. COMPOSITION ALGORITHM
// Deterministic selection at tick t:
//   1. Find Fano winner point (tick % 7)
//   2. Find lines containing that point
//   3. Use codec lane (tick % 8) to select one line
//   4. Control gating (tick % 4)
//   5. Validate centroid parity
//   6. Apply chirality
// Returns: 1 if success, 0 if failure
// ============================================================

typedef struct {
    uint8_t a, b, c;  // The triple of port atoms
    uint8_t valid;
} composition_result_t;

static inline composition_result_t compose_at_tick(uint32_t tick, uint32_t kernel_state) {
    composition_result_t result;
    result.valid = 0;
    
    // Step 1: Fano winner point
    uint8_t fano_point = tick % 7;
    
    // Step 2: Find lines containing fano_point
    uint8_t candidate_lines[3];
    uint8_t num_candidates = lines_containing(fano_point, candidate_lines);
    
    if (num_candidates == 0) return result;
    
    // Step 3: Use another tick-derived index to pick among the eligible lines.
    uint8_t line_idx = candidate_lines[(tick / 7) % num_candidates];
    uint8_t l0 = fano_lines[line_idx][0];
    uint8_t l1 = fano_lines[line_idx][1];
    uint8_t l2 = fano_lines[line_idx][2];
    
    // Step 4: Control gating
    uint8_t ctrl = tick % 4;
    if (!gate_control(ctrl, fano_lines[line_idx])) return result;
    
    // Step 5: Compare the chosen line's parity to the kernel state's parity.
    uint8_t line_par = line_parity(l0, l1, l2);
    uint8_t glob_par = global_centroid(kernel_state);
    if (line_par != glob_par) return result;
    
    // Step 6: Apply chirality
    uint8_t chi = chirality(glob_par);
    result.a = l0; result.b = l1; result.c = l2;
    orient(chi, &result.a, &result.b, &result.c);
    
    result.valid = 1;
    return result;
}

// ============================================================
// 11. INVARIANTS (for testing)
// ============================================================

// INV-C1: Selected line is a valid Fano line
static inline uint8_t inv_c1_valid_line(composition_result_t *r) {
    if (!r->valid) return 1;
    // Check if triple is in valid lines
    for (uint8_t i = 0; i < 7; i++) {
        if (all_fano_lines[i][0] == r->a && 
            all_fano_lines[i][1] == r->b && 
            all_fano_lines[i][2] == r->c) {
            return 1;
        }
    }
    return 0;
}

// INV-C2: Centroid matches (already enforced)

// INV-C3: Deterministic — same inputs always give same output
// (guaranteed by algorithm)

// INV-C4: Fano winner appears in selected line
static inline uint8_t inv_c4_winner_in_line(composition_result_t *r, uint8_t winner) {
    if (!r->valid) return 1;
    return (r->a == winner || r->b == winner || r->c == winner);
}

#endif // COMPOSITION_H
