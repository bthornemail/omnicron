#include "omnitron_artifact_contract.h"

#include <errno.h>
#include <inttypes.h>
#include <string.h>

static int write_all(FILE *f, const void *buf, size_t len) {
    if (len == 0) {
        return 0;
    }
    return fwrite(buf, 1, len, f) == len ? 0 : -1;
}

int omc_write_framebuffer_bin(const char *path,
                              const OMCFrameHeader *header,
                              const void *payload,
                              size_t payload_len) {
    FILE *f = NULL;
    OMCFrameHeader hdr = {0};

    if (path == NULL || header == NULL) {
        errno = EINVAL;
        return -1;
    }
    if (payload_len > 0 && payload == NULL) {
        errno = EINVAL;
        return -1;
    }

    hdr = *header;
    if (hdr.magic == 0u) {
        hdr.magic = OMC_ARTIFACT_MAGIC;
    }
    if (hdr.version == 0u) {
        hdr.version = OMC_ARTIFACT_VERSION;
    }
    if (hdr.header_bytes == 0u) {
        hdr.header_bytes = (uint16_t)sizeof(OMCFrameHeader);
    }
    hdr.payload_bytes = (uint64_t)payload_len;

    f = fopen(path, "wb");
    if (f == NULL) {
        return -1;
    }
    if (write_all(f, &hdr, sizeof(hdr)) != 0 || write_all(f, payload, payload_len) != 0) {
        int saved = errno;
        fclose(f);
        errno = saved == 0 ? EIO : saved;
        return -1;
    }
    if (fclose(f) != 0) {
        return -1;
    }
    return 0;
}

int omc_write_pgm_u8(const char *path,
                     uint32_t width,
                     uint32_t height,
                     const uint8_t *pixels,
                     size_t pixel_len) {
    FILE *f = NULL;
    size_t needed = (size_t)width * (size_t)height;

    if (path == NULL || pixels == NULL || width == 0u || height == 0u) {
        errno = EINVAL;
        return -1;
    }
    if (pixel_len < needed) {
        errno = EINVAL;
        return -1;
    }

    f = fopen(path, "wb");
    if (f == NULL) {
        return -1;
    }
    if (fprintf(f, "P5\n%" PRIu32 " %" PRIu32 "\n255\n", width, height) < 0 ||
        write_all(f, pixels, needed) != 0) {
        int saved = errno;
        fclose(f);
        errno = saved == 0 ? EIO : saved;
        return -1;
    }
    if (fclose(f) != 0) {
        return -1;
    }
    return 0;
}

int omc_write_pbm_msb1(const char *path,
                       uint32_t width,
                       uint32_t height,
                       const uint8_t *bits,
                       size_t bits_len) {
    FILE *f = NULL;
    size_t row_bytes = ((size_t)width + 7u) / 8u;
    size_t needed = row_bytes * (size_t)height;

    if (path == NULL || bits == NULL || width == 0u || height == 0u) {
        errno = EINVAL;
        return -1;
    }
    if (bits_len < needed) {
        errno = EINVAL;
        return -1;
    }

    f = fopen(path, "wb");
    if (f == NULL) {
        return -1;
    }
    if (fprintf(f, "P4\n%" PRIu32 " %" PRIu32 "\n", width, height) < 0 ||
        write_all(f, bits, needed) != 0) {
        int saved = errno;
        fclose(f);
        errno = saved == 0 ? EIO : saved;
        return -1;
    }
    if (fclose(f) != 0) {
        return -1;
    }
    return 0;
}

int omc_svg_begin(FILE *out, uint32_t width, uint32_t height, const char *title) {
    if (out == NULL || width == 0u || height == 0u) {
        errno = EINVAL;
        return -1;
    }
    if (fprintf(out,
                "<svg xmlns=\"http://www.w3.org/2000/svg\" "
                "width=\"%" PRIu32 "\" height=\"%" PRIu32 "\" "
                "viewBox=\"0 0 %" PRIu32 " %" PRIu32 "\">\n",
                width, height, width, height) < 0) {
        return -1;
    }
    if (title != NULL && title[0] != '\0') {
        if (fprintf(out, "  <title>%s</title>\n", title) < 0) {
            return -1;
        }
    }
    return 0;
}

int omc_svg_emit_cell(FILE *out, const OMCSVGCell *cell) {
    const char *fill = "none";
    const char *stroke = "none";

    if (out == NULL || cell == NULL || cell->w <= 0 || cell->h <= 0) {
        errno = EINVAL;
        return -1;
    }
    if (cell->fill_hex_rgb != NULL) {
        fill = cell->fill_hex_rgb;
    }
    if (cell->stroke_hex_rgb != NULL) {
        stroke = cell->stroke_hex_rgb;
    }

    if (fprintf(out,
                "  <rect x=\"%d\" y=\"%d\" width=\"%d\" height=\"%d\" "
                "fill=\"#%s\" stroke=\"#%s\" stroke-width=\"%" PRIu32 "\"/>\n",
                cell->x, cell->y, cell->w, cell->h, fill, stroke, cell->stroke_width) < 0) {
        return -1;
    }
    return 0;
}

int omc_svg_emit_text(FILE *out, int32_t x, int32_t y, const char *text, const char *fill_hex_rgb) {
    const char *fill = fill_hex_rgb == NULL ? "000000" : fill_hex_rgb;
    if (out == NULL || text == NULL) {
        errno = EINVAL;
        return -1;
    }
    if (fprintf(out, "  <text x=\"%d\" y=\"%d\" fill=\"#%s\">%s</text>\n", x, y, fill, text) < 0) {
        return -1;
    }
    return 0;
}

int omc_svg_end(FILE *out) {
    if (out == NULL) {
        errno = EINVAL;
        return -1;
    }
    return fprintf(out, "</svg>\n") < 0 ? -1 : 0;
}

int omc_write_receipt_ndjson(FILE *out,
                             const char *event,
                             uint64_t frame_index,
                             const char *artifact_path,
                             const char *sha256_hex,
                             const char *note) {
    if (out == NULL || event == NULL || artifact_path == NULL) {
        errno = EINVAL;
        return -1;
    }
    if (sha256_hex == NULL) {
        sha256_hex = "";
    }
    if (note == NULL) {
        note = "";
    }

    if (fprintf(out,
                "{\"event\":\"%s\",\"frame\":%" PRIu64 ",\"artifact\":\"%s\","
                "\"sha256\":\"%s\",\"note\":\"%s\"}\n",
                event, frame_index, artifact_path, sha256_hex, note) < 0) {
        return -1;
    }
    return 0;
}
