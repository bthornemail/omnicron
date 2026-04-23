/*
 * OMNITRON ARTIFACT CONTRACT
 *
 * Guest side is authoritative for state, geometry, and frame derivation.
 * Host side is a dumb mirror: display/copy only, no semantic reinterpretation.
 *
 * Canonical witness surfaces:
 *   1) Raster witness    -> PGM/PBM
 *   2) Structural witness-> SVG
 *   3) Proof witness     -> NDJSON receipts
 *   4) Binary witness    -> framed binary payload
 */

#ifndef OMNITRON_ARTIFACT_CONTRACT_H
#define OMNITRON_ARTIFACT_CONTRACT_H

#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stddef.h>

#define OMC_ARTIFACT_MAGIC 0x4F4D4346u  /* "OMCF" */
#define OMC_ARTIFACT_VERSION 1u

typedef enum {
    OMC_ARTIFACT_FRAMEBUFFER_BIN = 1,
    OMC_ARTIFACT_RASTER_PGM = 2,
    OMC_ARTIFACT_RASTER_PBM = 3,
    OMC_ARTIFACT_GEOMETRY_SVG = 4,
    OMC_ARTIFACT_PROOF_NDJSON = 5,
    OMC_ARTIFACT_CONTROL_BITBOARD = 6
} OMCArtifactKind;

typedef enum {
    OMC_PIXEL_MONO_1 = 1,   /* packed 1-bit, MSB-first */
    OMC_PIXEL_GRAY_8 = 2,   /* 8-bit scalar */
    OMC_PIXEL_RGB_24 = 3,   /* interleaved RGB */
    OMC_PIXEL_RGBA_32 = 4   /* interleaved RGBA */
} OMCPixelFormat;

typedef struct {
    uint32_t magic;         /* OMC_ARTIFACT_MAGIC */
    uint16_t version;       /* OMC_ARTIFACT_VERSION */
    uint16_t header_bytes;  /* sizeof(OMCFrameHeader) */
    uint32_t artifact_kind; /* OMCArtifactKind */
    uint32_t pixel_format;  /* OMCPixelFormat or 0 for non-raster */
    uint32_t width;         /* pixels/cells as defined by kind */
    uint32_t height;        /* pixels/cells as defined by kind */
    uint32_t stride_bytes;  /* bytes per row for raster payloads */
    uint64_t frame_index;   /* monotonically increasing frame id */
    uint64_t payload_bytes; /* payload length following header */
    uint64_t unix_time_ns;  /* producer timestamp */
    uint64_t flags;         /* reserved for contract flags */
    uint8_t reserved[32];   /* reserved for forward compatibility */
} OMCFrameHeader;

typedef struct {
    int32_t x;
    int32_t y;
    int32_t w;
    int32_t h;
    const char *fill_hex_rgb;   /* "rrggbb" or NULL */
    const char *stroke_hex_rgb; /* "rrggbb" or NULL */
    uint32_t stroke_width;
} OMCSVGCell;

/* Binary framed payload helpers. */
int omc_write_framebuffer_bin(const char *path,
                              const OMCFrameHeader *header,
                              const void *payload,
                              size_t payload_len);

/* Raster witnesses. */
int omc_write_pgm_u8(const char *path,
                     uint32_t width,
                     uint32_t height,
                     const uint8_t *pixels,
                     size_t pixel_len);
int omc_write_pbm_msb1(const char *path,
                       uint32_t width,
                       uint32_t height,
                       const uint8_t *bits,
                       size_t bits_len);

/* SVG structural witness helpers. */
int omc_svg_begin(FILE *out, uint32_t width, uint32_t height, const char *title);
int omc_svg_emit_cell(FILE *out, const OMCSVGCell *cell);
int omc_svg_emit_text(FILE *out, int32_t x, int32_t y, const char *text, const char *fill_hex_rgb);
int omc_svg_end(FILE *out);

/* NDJSON proof witness helper. One object per line. */
int omc_write_receipt_ndjson(FILE *out,
                             const char *event,
                             uint64_t frame_index,
                             const char *artifact_path,
                             const char *sha256_hex,
                             const char *note);

#endif /* OMNITRON_ARTIFACT_CONTRACT_H */
