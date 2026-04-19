#include <stdint.h>

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: PROTOTYPE
 *
 * Unwired virtio read loop prototype.
 *
 * This file sketches how heartbeat and channel sampling could be interleaved,
 * but the key fact from code is that it is not on the active runtime path:
 * - it is not included by `atomic_kernel.c`
 * - `virtio_interrupt()` currently marks all channels unavailable
 * - `main_with_virtio()` is a proposal, not the boot entrypoint in use
 */

// ============================================================
// VIRTIO-SERIAL READ FOR OMICRON KERNEL
// ============================================================
// Call this in the main loop to sample incoming channels
// Plugs into omicron_heartbeat.c

#define CHANNEL_BUF_SIZE 256
/* This is just a software-side queue size, not a real virtqueue size. */

typedef struct {
    uint8_t data[CHANNEL_BUF_SIZE]; /* Buffered bytes already copied into RAM. */
    uint32_t head;                  /* Where new bytes would be appended. */
    uint32_t tail;                  /* Where the next read will consume from. */
    uint8_t available;              /* Simple "channel currently has data" flag. */
} channel_buffer_t;

static channel_buffer_t g_channels[4];

// Called when VirtIO has data
// This would be triggered by the guest VirtIO driver interrupt
void virtio_interrupt(void) {
    // In a real VirtIO driver:
    // 1. Read from the virtqueue available ring
    // 2. Copy data to our buffer
    // 3. Set available flag
    
    // For now, simulate having no data until VirtIO is fully working.
    // This means the whole prototype remains "structurally present but inactive."
    g_channels[0].available = 0;
    g_channels[1].available = 0;
    g_channels[2].available = 0;
    g_channels[3].available = 0;
}

// Sample a channel - returns byte or -1 if empty
int virtio_read_channel(uint8_t ch) {
    /* Reject impossible channel IDs first. */
    if (ch > 3) return -1;
    /* If the software queue says no data is present, fail immediately. */
    if (!g_channels[ch].available) return -1;
    /* If head and tail match, the queue is empty. */
    if (g_channels[ch].head == g_channels[ch].tail) return -1;
    
    /* Consume one byte and advance the tail pointer. */
    uint8_t byte = g_channels[ch].data[g_channels[ch].tail];
    g_channels[ch].tail = (g_channels[ch].tail + 1) % CHANNEL_BUF_SIZE;
    return byte;
}

// Interleave heartbeat with channel sampling
void sample_channels(omicron_state_t *s) {
    // This function encodes the intended scheduling policy:
    // different channels are sampled at different phases.
    
    // Phase 0-14: Sample channel 2 (Hex) - 15/16 logic window
    if (s->phase < 15) {
        int b = virtio_read_channel(2);
        if (b >= 0) {
            // If a byte exists, feed it into the same interpolation logic the
            // demo kernels use.
            interpolate_stream(s, (uint8_t)b);
        }
    }
    
    // Even phase: Sample channel 3 (Sign) - BOM flip
    if ((s->phase % 2) == 0) {
        int b = virtio_read_channel(3);
        if (b >= 0 && b == 0xFFFE) {
            // The "sign" channel is supposed to drive BOM mode changes.
            s->bom_mode = 0xFFFE;
        } else if (b >= 0 && b == 0xFEFF) {
            s->bom_mode = 0xFEFF;
        }
    }
    
    // Every tick: Sample channel 0 (Binary)
    int b = virtio_read_channel(0);
    if (b >= 0) {
        interpolate_stream(s, (uint8_t)b);
    }
}

// Full main loop with heartbeat + channel sampling
void main_with_virtio(void) {
    /* Prototype entrypoint only: not the live kernel entry used by my_kernel.flat. */
    omicron_state_t om;
    
    // Start with a blank local machine state.
    om.phase = 0;
    om.bom_mode = 0xFFFE;
    om.logic_window = 0;
    om.channel = 0;
    om.pos = 0;
    om.escaping = 0;
    
    putchar('O'); putchar('M'); putchar('I'); putchar('\r'); putchar('\n');
    
    // The intended runtime shape is:
    // 1. advance heartbeat state
    // 2. read any pending bytes from the logical channels
    // 3. let channel 1 carry control traffic
    // 4. repeat forever
    while (1) {
        // 1. Heartbeat - rotate phase, chiral, logic
        rotate_phase(&om);
        rotate_chiral(&om);
        rotate_logic(&om);
        
        // 2. Sample VirtIO channels
        sample_channels(&om);
        
        // 3. Check channel 1 (decimal) for control
        int c1 = virtio_read_channel(1);
        if (c1 >= 0) {
            // Control commands from decimal channel
            // This branch is intentionally left unspecified in the current code.
        }
        
        // 4. Continue heartbeat
    }
}
