#ifndef VIRTTIO_H
#define VIRTTIO_H

#include <stdint.h>

/*
 * SOURCE-OF-TRUTH NOTE
 *
 * STATUS: SUPPORT FILE / PROTOTYPE
 *
 * VirtIO structural scaffold.
 *
 * This header defines data structures and a small OMICRON-oriented interpreter
 * model for a virtio-backed byte stream. It is not, by itself, a working guest
 * driver. Nothing on the active `my_kernel.flat` runtime path currently uses
 * these definitions to service real virtio traffic.
 */

#define VIRTIO_MAGIC             0x74726976
#define VIRTIO_CONFIG_S         0x10000000
#define VIRTIO_CONFIG_MSI       0x10010000

/* These constants describe where a virtio device would be memory-mapped. */

#define VIRTIO_F_RING_INDIRECT  28
#define VIRTIO_F_RING_EVENT_IDX 29

/* These are feature-bit numbers a real driver could negotiate with the device. */

#define VIRTIO_ID_CONSOLE      18
#define VIRTIO_ID_SERIAL      20

/* These identify classes of virtio devices. */

#define VRING_DESC_FLAGS_NEXT   1
#define VRING_DESC_FLAGS_WRITE 2
#define VRING_DESC_FLAGS_INDIRECT 4

/* These flags describe how one ring descriptor links to the next. */

typedef struct {
    uint64_t addr;   /* Guest memory address of one data buffer. */
    uint32_t len;    /* Length of that buffer in bytes. */
    uint16_t flags;  /* Whether the descriptor chains onward or is writable. */
    uint16_t next;   /* Index of the next descriptor if chaining is enabled. */
} vring_desc_t;

typedef struct {
    uint16_t flags;     /* Ring-level options or suppression flags. */
    uint16_t idx;       /* Producer index: how many entries are available. */
    uint16_t call;      /* Legacy notification hint field. */
    uint16_t notify;    /* Legacy notification hint field in the other direction. */
    uint32_t used_len;  /* Non-standard helper field in this local model. */
} vring_avail_t;

typedef struct {
    uint32_t id;   /* Which descriptor chain was consumed. */
    uint32_t len;  /* How many bytes the device reports using. */
} vring_used_elem_t;

typedef struct {
    uint16_t num;            /* Queue capacity. */
    uint16_t avail_idx;      /* Driver-side read position through the avail ring. */
    uint16_t used_idx;       /* Driver-side read position through the used ring. */
    vring_desc_t *desc;      /* Descriptor table base. */
    vring_avail_t *avail;    /* "Available to device" ring base. */
    vring_used_elem_t *used; /* "Used by device" ring base. */
} virtqueue_t;

typedef struct {
    uint32_t magic;               /* Signature that says "this really is virtio". */
    uint32_t version;             /* Device interface version. */
    uint32_t device_id;           /* Which kind of virtio device this is. */
    uint32_t vendor_id;           /* Vendor identifier. */
    uint32_t device_features;     /* Feature bits offered by the device. */
    uint32_t device_features_sel; /* Which feature-bit word is being read. */
    uint32_t driver_features;     /* Feature bits accepted by the guest driver. */
    uint32_t driver_features_sel; /* Which feature-bit word is being written. */
    uint32_t queue_sel;           /* Which queue the driver is configuring now. */
    uint32_t queue_num_max;       /* Maximum queue size offered by the device. */
    uint32_t queue_num;           /* Queue size chosen by the driver. */
    uint32_t queue_align;         /* Alignment requirement for legacy layouts. */
    uint64_t queue_addr;          /* Guest address of the queue memory. */
    uint32_t queue_ready;         /* Non-zero when a queue is ready for traffic. */
    uint32_t notify_offset;       /* Where queue notifications should be sent. */
    uint32_t notify_data;         /* Payload used when notifying the device. */
    uint32_t notify_multiplier;   /* Scaling factor for notification offsets. */
    uint32_t interrupt_status;    /* Pending device interrupt bits. */
    uint32_t interrupt_ack;       /* Driver acknowledgement of those bits. */
    uint32_t status;              /* Device-driver handshake status field. */
    uint32_t config_generation;   /* Changes when device config mutates. */
    uint8_t config[256];          /* Device-specific configuration space. */
} virtio_pci_common_t;

#define CH0_BINARY  0
#define CH1_DECIMAL 1
#define CH2_HEX    2
#define CH3_SIGN   3

typedef struct {
    uint32_t base_addr;       /* Where this model thinks the device is mapped. */
    uint64_t regs[64];        /* Local 64-slot surface for received bytes. */
    uint8_t current_channel;  /* Which logical OMICRON channel is active. */
    uint8_t current_pos;      /* Where the next payload byte will land. */
    uint16_t chirality;       /* Current BOM / byte-order mode. */
    uint32_t total_received;  /* Running count of payload bytes processed. */
} omicron_virtio_t;

static omicron_virtio_t g_omicron;

static inline uint32_t read32(uint32_t addr) {
    /* Read one 32-bit word from a memory-mapped device register. */
    return *(volatile uint32_t *)addr;
}

static inline void write32(uint32_t addr, uint32_t val) {
    /* Write one 32-bit word to a memory-mapped device register. */
    *(volatile uint32_t *)addr = val;
}

static int virtio_check_device(void) {
    /*
     * This is the smallest possible "is there a virtio device here?" check:
     * - read the magic value
     * - read the version
     * - reject the location if those look wrong
     */
    uint32_t magic = read32(VIRTIO_CONFIG_S);
    if (magic != VIRTIO_MAGIC) {
        return -1;
    }
    uint32_t ver = read32(VIRTIO_CONFIG_S + 4);
    if (ver != 1 && ver != 2) {
        return -1;
    }
    return 0;
}

static void omicron_init(omicron_virtio_t *s) {
    /* Initialize the local OMICRON-side state as if no bytes have arrived yet. */
    s->base_addr = VIRTIO_CONFIG_S;
    for (int i = 0; i < 64; i++) {
        s->regs[i] = 0;
    }
    s->current_channel = 0;
    s->current_pos = 0;
    s->chirality = 0xFFFE;
    s->total_received = 0;
}

static void apply_chiral_payload(omicron_virtio_t *s, uint8_t byte) {
    /*
     * Pack one byte into the current register slot.
     * The BOM/chirality decides which end of the 64-bit slot shifts.
     */
    uint8_t idx = s->current_pos;
    if (idx < 64) {
        if (s->chirality == 0xFE) {
            s->regs[idx] = (s->regs[idx] << 8) | byte;
        } else {
            s->regs[idx] = (s->regs[idx] >> 8) | ((uint64_t)byte << 56);
        }
    }
}

static void omicron_interpret(omicron_virtio_t *s, uint8_t byte) {
    /*
     * Header-level prototype logic for interpreting a received byte stream.
     * Useful for design intent; not currently wired into the boot artifact.
     */
    if (s->current_pos == 0 && byte == 0x1B) {
        /* In this prototype, ESC at position 0 is swallowed as framing setup. */
        return;
    }
    if (s->current_pos == 0 && (byte & 0xC0) == 0x40) {
        /* Treat a control byte as channel-selection plus 6-bit position. */
        s->current_channel = (byte >> 6) & 0x03;
        s->current_pos = byte & 0x3F;
        return;
    }
    /* Normal payload path: write data and advance the cursor. */
    apply_chiral_payload(s, byte);
    s->current_pos = (s->current_pos + 1) & 0x3F;
    if (s->current_pos == 0) {
        /* When the register surface wraps, move on to the next logical channel. */
        s->current_channel = (s->current_channel + 1) & 0x03;
    }
    s->total_received++;
}

#endif
