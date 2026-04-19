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

#define VIRTIO_F_RING_INDIRECT  28
#define VIRTIO_F_RING_EVENT_IDX 29

#define VIRTIO_ID_CONSOLE      18
#define VIRTIO_ID_SERIAL      20

#define VRING_DESC_FLAGS_NEXT   1
#define VRING_DESC_FLAGS_WRITE 2
#define VRING_DESC_FLAGS_INDIRECT 4

typedef struct {
    uint64_t addr;
    uint32_t len;
    uint16_t flags;
    uint16_t next;
} vring_desc_t;

typedef struct {
    uint16_t flags;
    uint16_t idx;
    uint16_t call;
    uint16_t notify;
    uint32_t used_len;
} vring_avail_t;

typedef struct {
    uint32_t id;
    uint32_t len;
} vring_used_elem_t;

typedef struct {
    uint16_t num;
    uint16_t avail_idx;
    uint16_t used_idx;
    vring_desc_t *desc;
    vring_avail_t *avail;
    vring_used_elem_t *used;
} virtqueue_t;

typedef struct {
    uint32_t magic;
    uint32_t version;
    uint32_t device_id;
    uint32_t vendor_id;
    uint32_t device_features;
    uint32_t device_features_sel;
    uint32_t driver_features;
    uint32_t driver_features_sel;
    uint32_t queue_sel;
    uint32_t queue_num_max;
    uint32_t queue_num;
    uint32_t queue_align;
    uint64_t queue_addr;
    uint32_t queue_ready;
    uint32_t notify_offset;
    uint32_t notify_data;
    uint32_t notify_multiplier;
    uint32_t interrupt_status;
    uint32_t interrupt_ack;
    uint32_t status;
    uint32_t config_generation;
    uint8_t config[256];
} virtio_pci_common_t;

#define CH0_BINARY  0
#define CH1_DECIMAL 1
#define CH2_HEX    2
#define CH3_SIGN   3

typedef struct {
    uint32_t base_addr;
    uint64_t regs[64];
    uint8_t current_channel;
    uint8_t current_pos;
    uint16_t chirality;
    uint32_t total_received;
} omicron_virtio_t;

static omicron_virtio_t g_omicron;

static inline uint32_t read32(uint32_t addr) {
    return *(volatile uint32_t *)addr;
}

static inline void write32(uint32_t addr, uint32_t val) {
    *(volatile uint32_t *)addr = val;
}

static int virtio_check_device(void) {
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
        return;
    }
    if (s->current_pos == 0 && (byte & 0xC0) == 0x40) {
        s->current_channel = (byte >> 6) & 0x03;
        s->current_pos = byte & 0x3F;
        return;
    }
    apply_chiral_payload(s, byte);
    s->current_pos = (s->current_pos + 1) & 0x3F;
    if (s->current_pos == 0) {
        s->current_channel = (s->current_channel + 1) & 0x03;
    }
    s->total_received++;
}

#endif
