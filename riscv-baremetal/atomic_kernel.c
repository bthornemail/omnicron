#include <stdint.h>

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: LIVE PATH
 *
 * This is the main kernel source behind the current `my_kernel.flat` artifact.
 * From code inspection and artifact inspection, this file is the closest thing
 * to the live guest runtime in this directory.
 *
 * What `main()` actually does today:
 * - initializes local kernel and omicron state
 * - runs heartbeat / delta / Fano composition loops
 * - records witness values
 * - computes a final fingerprint
 * - spins forever
 *
 * What exists in this file but is not on the active runtime path from `main()`:
 * - byte-stream interpolation helpers
 * - stars-and-bars parsing helpers
 * - any real external channel ingestion path
 *
 * Important runtime caveat:
 * - ivshmem mirror support is compiled in, but `IVSHMEM_BASE` is currently `0`,
 *   so `get_mirror()` returns null and all mirror writes are disabled.
 */

// ============================================================
// STRUCT DEFINITIONS (must appear before use)
// ============================================================

// ============================================================
// FOUR-CHANNEL TIMING SYSTEM
// Each channel maintains its own local phase law
// ============================================================

typedef struct channel_clock {
    uint32_t phase;      // Current position inside this channel's own cycle.
    uint32_t epoch;     // How many times this channel has wrapped around.
    uint32_t tick;      // Raw count of how many updates this channel has seen.
} channel_clock_t;

// Combined master timing frame
typedef struct timing_frame {
    uint64_t utc_carrier;         // Intended real-world anchor time.
    uint32_t session_offset;    // Intended per-session offset from the anchor.
    channel_clock_t ch[4]; // One timing state for each of the 4 logical channels.
} timing_frame_t;

typedef struct omicron {
    uint64_t regs[64];       // Main 64-slot register surface for byte packing.
    uint32_t phase;          // Master phase of the omicron machine.
    uint16_t bom;            // Current byte-order / chirality marker.
    uint8_t logic_window;    // Small logic-phase field; currently underused.
    uint8_t channel;         // Current logical input channel.
    uint8_t pos;             // Current write position inside regs[0..63].
    uint8_t escaping;        // Non-zero means the next byte is treated as control.
    uint8_t plane;           // Structural plane marker: F/G/R/U when escape-decoded.
    // Four-channel timing
    timing_frame_t timing;
} omicron_t;

typedef struct atomic_kernel {
    uint32_t state;         // Main evolving kernel value.
    uint32_t constant;      // Fixed mixing constant used by delta().
    uint32_t phase;         // Kernel-local phase field; mostly parallel to om.phase.
    uint16_t bom;           // Kernel-local BOM marker.
    uint8_t plane;          // Kernel-local structural plane marker.
    uint32_t coords[4];     // Placeholder mixed-radix coordinates.
    uint32_t fingerprint;   // Summary value computed near the end.
} atomic_kernel_t;

typedef struct stars_bars_header {
    uint8_t stars;   // Whether the '*' branch was seen.
    uint8_t bars;    // Whether / which '|' branch was seen.
    uint8_t offset;  // Where in the register surface the effect should land.
    uint8_t width;   // How many bits the surface operation should shift by.
} stars_bars_header_t;

// ============================================================
// ATOMIC KERNEL - OMICRON EDITION
// Implements: Δ Law, Mixed Radix, Projection Law, Structural Access
// Includes: Shared Memory "Logic Mirror" (Ivshmem)
// ============================================================

#define MASTER_PERIOD 5040
#define WIDTH 16
#define MASK ((1 << WIDTH) - 1)

// ============================================================
// IVSHMEM LOGIC MIRROR
// Projects kernel state to shared memory for host visibility
// ============================================================

// Default Ivshmem address (will be discovered at runtime)
// Use 0 for now - functions guard against NULL
#define IVSHMEM_BASE 0
#define IVSHMEM_SIZE (256 * 1024)  // 256KB mirror

// Mirror layout:
// [0-63]    : 64 words from omicron regs (Addr240 projection)
// [64]      : current phase (5040)
// [65]      : BOM mode (FFFE/FEFF)
// [66]      : logic_window (0-15)
// [67]      : fingerprint
// [68-127]  : reserved for future use

static volatile uint32_t *get_mirror(void) {
    /* Mirror access is currently disabled until a real guest address is known. */
    if (IVSHMEM_BASE == 0) return 0;
    return (volatile uint32_t *)IVSHMEM_BASE;
}

static void init_mirror(volatile uint32_t *mirror) {
    // If the guest had a valid shared-memory mapping, this would seed it with
    // recognizable startup values so the host could tell the guest is alive.
    if (mirror) {
        mirror[0] = 0xDEADBEEF;
        mirror[64] = 0;
        mirror[65] = 0xFFFE;
        mirror[66] = 0;
        mirror[67] = 0;
    }
}

static void update_mirror(volatile uint32_t *mirror, omicron_t *o, atomic_kernel_t *k) {
    // Push a compact snapshot of the guest state into shared memory.
    if (!mirror) return;
    for (int i = 0; i < 64; i++) {
        // Narrow each 64-bit register down to 32 bits for the mirror view.
        mirror[i] = (uint32_t)o->regs[i];
    }
    mirror[64] = o->phase;
    mirror[65] = o->bom;
    mirror[66] = o->logic_window;
    mirror[67] = k->fingerprint;
}

// ============================================================
// THEOREM 1: DELTA LAW (State Evolution)
// Δ(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
// ============================================================

static inline uint32_t rotl(uint32_t x, int k) {
    // Keep the rotation amount inside the declared bit-width.
    k = k % WIDTH;
    // Rotate left inside a fixed 16-bit window.
    return ((x << k) | (x >> (WIDTH - k))) & MASK;
}

static inline uint32_t rotr(uint32_t x, int k) {
    // Same idea as rotl(), but in the opposite direction.
    k = k % WIDTH;
    return ((x >> k) | (x << (WIDTH - k))) & MASK;
}

static uint32_t delta(uint32_t x, uint32_t C) {
    // The core evolution rule: mix the value with two left-rotations, one
    // right-rotation, and a constant.
    return rotl(x, 1) ^ rotl(x, 3) ^ rotr(x, 2) ^ C;
}

// ============================================================
// THEOREM 4: MIXED RADIX (Coordinate Decomposition)
// ============================================================

// radices: [7, 15, 60] → 7! period, 15 lane, 60 slot
#define RADIX_7 7
#define RADIX_15 15
#define RADIX_60 60

static void mixed_encode(uint32_t v, uint32_t *coords) {
    // This is currently a placeholder, not a full mixed-radix encoder.
    // It simply stores the input in the last coordinate slot.
    coords[0] = 0;
    coords[1] = 0;
    coords[2] = 0;
    coords[3] = v;
}

static uint32_t mixed_decode(uint32_t *coords) {
    // Placeholder inverse: just read back the final slot.
    return coords[3];
}

static uint32_t project_value(uint32_t v, uint8_t basis) {
    // Placeholder projection: basis is accepted but ignored.
    return v;
}

static uint32_t interpret_value(uint32_t repr, uint8_t basis) {
    // Placeholder interpretation: basis is accepted but ignored.
    return repr;
}

// ============================================================
// THEOREM 7: STRUCTURAL ACCESS (FS/GS/RS/US)
// ============================================================

#define FS_CTX  0x1C  // File Separator → Context
#define GS_REC  0x1D  // Group Separator → Record  
#define RS_UNIT 0x1E  // Record Separator → Unit
#define US_SEP 0x1F  // Unit Separator → Separator



// ============================================================
// WITNESS ACCUMULATOR (Law 4.4)
// Generates deterministic fingerprint for every instruction
// ============================================================

static uint32_t witness_accumulator(atomic_kernel_t *k, uint32_t instruction) {
    // Witness = Hash(state, instruction, phase, fingerprint)
    // This makes every instruction's effect visible and reversible
    uint32_t w = k->state ^ instruction;
    w ^= (k->phase << 7);
    w ^= (k->fingerprint << 3);
    w ^= (k->phase >> 5);
    // Mix in constant for non-collision
    w ^= 0xDEADBEEF;
    return w;
}

static void record_witness(volatile uint32_t *mirror, atomic_kernel_t *k, uint32_t instruction) {
    // Compute a witness for the current step.
    uint32_t witness = witness_accumulator(k, instruction);
    if (mirror) {
        // Save the latest witness.
        mirror[68] = witness;
        // XOR-fold witness history into one accumulator slot.
        mirror[69] ^= witness;
        // Count how many witness writes occurred.
        mirror[70] += 1;
    }
}

// ============================================================
// ARTIFACT VERIFICATION (Theorem 8)
// ============================================================

static void compute_fingerprint(atomic_kernel_t *k) {
    // Simple sum-based fingerprint (not crypto, for kernel)
    k->fingerprint = k->state ^ (k->state << 7) ^ (k->state >> 3);
}

static uint8_t verify_artifact(atomic_kernel_t *k, uint32_t expected) {
    // Recompute the summary and compare it to a caller-supplied expected value.
    compute_fingerprint(k);
    return (k->fingerprint == expected) ? 1 : 0;
}

// ============================================================
// OMICRON STATE (Extended with VirtIO channels)
// ============================================================

// ============================================================
// THREE SEQUENCING FUNCTIONS (Heartbeat)
// ============================================================

static void rotate_phase(omicron_t *o) {
    // Step forward by one.
    o->phase++;
    // Wrap at the declared master period.
    if (o->phase >= MASTER_PERIOD) o->phase = 0;
}

static void rotate_chiral(omicron_t *o) {
    // Even phases use FFFE; odd phases use FEFF.
    o->bom = ((o->phase & 1) == 0) ? 0xFFFE : 0xFEFF;
}

static void rotate_logic(omicron_t *o) {
    // This is currently not a real moving logic window; it is reset to zero.
    o->logic_window = 0;
}

// ============================================================
// FOUR-CHANNEL TIMING FUNCTIONS
// Each channel maintains independent local phase
// Channel 0: Binary - high-speed stream cadence
// Channel 1: Decimal - structural cadence (bar hits)
// Channel 2: Hex - resolution sweep (15/16 window)
// Channel 3: Sign - mode switch (BOM toggle)
// ============================================================

static void init_timing(omicron_t *o, uint64_t utc) {
    // Seed the timing frame. The UTC field is stored but not meaningfully used
    // elsewhere in the current runtime.
    o->timing.utc_carrier = utc;
    o->timing.session_offset = 0;
    for (int c = 0; c < 4; c++) {
        o->timing.ch[c].phase = 0;
        o->timing.ch[c].epoch = 0;
        o->timing.ch[c].tick = 0;
    }
}

static void tick_channel(omicron_t *o, uint8_t ch) {
    // Ignore invalid channel numbers.
    if (ch > 3) return;
    // Every update advances the raw tick count.
    o->timing.ch[ch].tick++;
    // Phase law depends on channel
    if (ch == 0) {
        // Binary: fast - increment every tick
        o->timing.ch[ch].phase++;
    } else if (ch == 1) {
        // Decimal: structural - increment on "bar" (every 7th tick)
        // Check divisibility by 7 without modulo
        uint32_t t = o->timing.ch[ch].tick;
        if (t == 7 || t == 14 || t == 21 || t == 28 || t == 35) {
            o->timing.ch[ch].phase++;
        }
    } else if (ch == 2) {
        // Hex: resolution sweep - 15-position window
        // Use subtraction loop instead of modulo
        uint32_t t = o->timing.ch[ch].tick;
        while (t >= 15) t -= 15;
        o->timing.ch[ch].phase = t;
    } else {
        // Sign: BOM toggle - alternate every tick
        o->timing.ch[ch].phase = o->timing.ch[ch].tick & 1;
    }
    // Wrap at MASTER_PERIOD
    if (o->timing.ch[ch].phase >= MASTER_PERIOD) {
        o->timing.ch[ch].phase = 0;
        o->timing.ch[ch].epoch++;
    }
}

static void tick_all_channels(omicron_t *o) {
    // Advance all 4 logical channels once.
    for (int c = 0; c < 4; c++) {
        tick_channel(o, c);
    }
}

static uint32_t get_channel_phase(omicron_t *o, uint8_t ch) {
    // Safe accessor for one channel's phase.
    if (ch > 3) return 0;
    return o->timing.ch[ch].phase;
}

static uint32_t get_channel_epoch(omicron_t *o, uint8_t ch) {
    // Safe accessor for one channel's wrap count.
    if (ch > 3) return 0;
    return o->timing.ch[ch].epoch;
}

static uint32_t get_structural_phase(omicron_t *o) {
    // Pack three channel phases into one summary value.
    // Combined structural phase from channels 1-3
    uint32_t sp = 0;
    sp = (o->timing.ch[1].phase & 0xF) << 12;
    sp |= (o->timing.ch[2].phase & 0xF) << 8;
    sp |= (o->timing.ch[3].phase & 0xF) << 4;
    return sp;
}

// ============================================================
// SBI CONSOLE OUTPUT (minimal, no string literals)
// Uses SBI console putchar and numeric codes only
// ============================================================

static volatile long sbi_call(long a0, long a1, long a2, long a3, long a4, long a5) {
    // Place arguments into the registers the RISC-V SBI calling convention expects.
    register long r0 asm("a0") = a0;
    register long r1 asm("a1") = a1;
    register long r2 asm("a2") = a2;
    register long r3 asm("a3") = a3;
    register long r4 asm("a4") = a4;
    register long r5 asm("a5") = a5;
    // `ecall` transfers control to firmware / machine-mode services.
    asm volatile ("ecall" : "+r"(r0) : "r"(r1), "r"(r2), "r"(r3), "r"(r4), "r"(r5));
    return r0;
}

// Debug output to kernel .data section (accessible from GDB)
static uint32_t g_debug0, g_debug1, g_debug2, g_debug3;

static void report_state(omicron_t *o, atomic_kernel_t *k, uint32_t tick) {
    if (tick < 5 || tick == 420 || tick == 5040) {
        g_debug0 = tick;
        g_debug1 = k->state;
        g_debug2 = o->phase;
        g_debug3 = o->bom;
    }
}

// ============================================================
// FANO COMPOSITION (per tick, no division, inline lookup)
// ============================================================

static uint8_t mod7(uint32_t v) {
    // Repeated subtraction avoids compiler-emitted division helpers.
    while (v >= 7) v -= 7;
    return (uint8_t)v;
}

static uint8_t mod8(uint32_t v) {
    // Same idea as mod7(), but for 8.
    while (v >= 8) v -= 8;
    return (uint8_t)v;
}

// Get Fano line inline (no array reference)
static void get_fano_line(uint8_t idx, uint8_t *out) {
    // idx 0-6 selects line
    if (idx == 0) { out[0]=0; out[1]=1; out[2]=4; }
    else if (idx == 1) { out[0]=1; out[1]=2; out[2]=5; }
    else if (idx == 2) { out[0]=2; out[1]=3; out[2]=6; }
    else if (idx == 3) { out[0]=3; out[1]=4; out[2]=0; }
    else if (idx == 4) { out[0]=4; out[1]=5; out[2]=1; }
    else if (idx == 5) { out[0]=5; out[1]=6; out[2]=2; }
    else { out[0]=6; out[1]=0; out[2]=3; }
}

static void compose_tick(uint32_t tick, uint32_t state, uint8_t *result) {
    // Fano indices (no division)
    uint8_t lane = mod8(tick);
    uint8_t line_idx = mod7(lane);
    // Global centroid (parity via XOR)
    // Compress a few shifted views of the state down into a one-bit parity cue.
    uint8_t bits = state ^ (state >> 1) ^ (state >> 2) ^ (state >> 3);
    uint8_t centroid = bits & 1;
    // Select line
    get_fano_line(line_idx, result);
    // Apply chirality (swap if centroid=1)
    if (centroid) {
        uint8_t tmp = result[1];
        result[1] = result[2];
        result[2] = tmp;
    }
}

static void heartbeat(omicron_t *o) {
    // One machine heartbeat updates both the master state and the per-channel timing.
    rotate_phase(o);
    rotate_chiral(o);
    rotate_logic(o);
    tick_all_channels(o);
}

// ============================================================
// STREAM INTERPOLATOR
// ============================================================

static void apply_chiral(omicron_t *o, uint8_t b) {
    // Write one payload byte into the current register slot using the current
    // BOM/chirality to decide which side the byte shifts in from.
    uint8_t idx = o->pos;
    if (idx < 64) {
        if (o->bom == 0xFE) {
            o->regs[idx] = (o->regs[idx] << 8) | b;
        } else {
            o->regs[idx] = (o->regs[idx] >> 8) | ((uint64_t)b << 56);
        }
    }
}

static void interpolate(omicron_t *o, uint8_t b) {
    /*
     * This is the kernel's local byte interpreter, but `main()` does not call it
     * in the current runtime path. It is present as dormant stream logic.
     */
    if (o->escaping) {
        // The first byte after ESC is treated as control, not data.
        o->channel = (b >> 6) & 3;
        o->pos = b & 0x3F;
        // Structural plane from high bits
        if ((b & 0xE0) == FS_CTX) o->plane = 'F';
        else if ((b & 0xE0) == GS_REC) o->plane = 'G';
        else if ((b & 0xE0) == RS_UNIT) o->plane = 'R';
        else if ((b & 0xE0) == US_SEP) o->plane = 'U';
        o->escaping = 0;
    } else if (b == 0x1B) {
        o->escaping = 1;
    } else {
        // Normal payload byte: pack it into the current slot.
        apply_chiral(o, b);
        // Move forward one position through the 64-slot surface.
        o->pos = (o->pos + 1) & 0x3F;
        if (o->pos == 0) {
            // After wrapping around the register surface, move to the next channel.
            o->channel = (o->channel + 1) & 3;
        }
    }
}

// ============================================================
// STARS AND BARS PARSER (UTF-EBCDIC escape handling)
// ============================================================

// Stars and Bars header parsing
static stars_bars_header_t parse_stars_bars(omicron_t *o, uint8_t b) {
    stars_bars_header_t h = {0};
    if (b == '*') {
        // `*` means "apply an 8-bit star operation at the current offset".
        h.stars = 1;
        h.bars = 0;
        h.offset = o->pos;
        h.width = 8;
    } else if (b == '|') {
        // Pipe switches to channel
        // In this simplified representation, the current channel number is copied
        // into the header instead of performing a full parser action.
        h.stars = 0;
        h.bars = o->channel;
        h.width = 0;
    }
    return h;
}

static void process_stars_bars(omicron_t *o, uint8_t byte) {
    /*
     * This parser is also dormant in the current `main()` path. It documents an
     * intended surface grammar but is not what the live artifact spends its time
     * doing right now.
     */
    if (byte == '*' || byte == '|') {
        stars_bars_header_t h = parse_stars_bars(o, byte);
        // Apply at configured offset
        if (h.width > 0 && h.offset < 64) {
            o->regs[h.offset] = (o->regs[h.offset] << h.width) | byte;
        }
    } else {
        interpolate(o, byte);
    }
}

// ============================================================








// ============================================================
// MAIN
// ============================================================

void main(void) {
    /*
     * Runtime truth:
     * this kernel is currently a self-driven constitutional loop, not a live
     * virtio-fed stream processor.
     */
    atomic_kernel_t k;
    // Seed the kernel core with a recognizable state and constant.
    k.state = 0xDEADBEEF;
    k.constant = 0x1D1D1D1D;
    k.phase = 0;
    k.bom = 0xFFFE;
    k.plane = 0;
    k.coords[0] = 0;
    k.coords[1] = 0;
    k.coords[2] = 0;
    k.coords[3] = 0;
    k.fingerprint = 0;

    omicron_t om;
    // Start the larger omicron machine in a blank state.
    for (int i = 0; i < 64; i++) om.regs[i] = 0;
    om.phase = 0;
    om.bom = 0xFFFE;
    om.logic_window = 0;
    om.channel = 0;
    om.pos = 0;
    om.escaping = 0;
    om.plane = 0;

    volatile uint32_t *mirror = get_mirror();
    // This is currently null because IVSHMEM_BASE is zero.
    init_mirror(mirror);
    uint8_t comp[3]; // Fano composition result

    for (int i = 0; i < 100; i++) {
        // Advance the omicron timing state.
        heartbeat(&om);
        // Advance the kernel core value.
        k.state = delta(k.state, k.constant);
        
        // Fano composition per tick
        compose_tick(i, k.state, comp);
        
        // Try to persist witness data.
        record_witness(mirror, &k, k.state);
        
        if (i < 100 && mirror) {
            // If the mirror existed, keep it updated during the short startup loop.
            update_mirror(mirror, &om, &k);
        }
        
        // Report state at key phases
        report_state(&om, &k, i);
    }

    for (int i = 0; i < 5040; i++) {
        // Force the visible phase to the loop index.
        om.phase = i;
        // Then apply the normal heartbeat update logic on top of it.
        heartbeat(&om);
        // Compute a composition result, but do not otherwise expose it.
        compose_tick(i, k.state, comp);
        // Record witness history for this long cycle.
        record_witness(mirror, &k, i);
        // Make selected ticks visible to a debugger.
        report_state(&om, &k, i);
    }
    // Finish by computing one summary fingerprint.
    compute_fingerprint(&k);
    // Halt into an infinite loop so the final state remains inspectable.
    while (1) { }
}
