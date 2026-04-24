#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AEGEAN_DELIMS = [0x10100, 0x10101, 0x10102];
const BRAILLE_MIN = 0x2800;
const BRAILLE_MAX = 0x28ff;

const DOT_COORDS = [
  [0, 0], // dot 1
  [0, 1], // dot 2
  [0, 2], // dot 3
  [1, 0], // dot 4
  [1, 1], // dot 5
  [1, 2], // dot 6
  [0, 3], // dot 7
  [1, 3] // dot 8
];

function usage() {
  console.error(
    "Usage: node mixedbase_stream_to_render_packet_ndjson.mjs <stream.txt> [render_packet.ndjson]\n" +
      "Header format: first 3 Aegean delimiters (𐄀/𐄁/𐄂), then Braille payload."
  );
}

function sha256Hex(s) {
  return createHash("sha256").update(s).digest("hex");
}

function clamp01(v) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function reverseBits8(x) {
  let v = x & 0xff;
  v = ((v & 0xf0) >> 4) | ((v & 0x0f) << 4);
  v = ((v & 0xcc) >> 2) | ((v & 0x33) << 2);
  v = ((v & 0xaa) >> 1) | ((v & 0x55) << 1);
  return v;
}

function isAegeanDelim(cp) {
  return AEGEAN_DELIMS.includes(cp);
}

function toDelimIdx(cp) {
  return AEGEAN_DELIMS.indexOf(cp);
}

function headerMode(delims) {
  const idx = delims.map(toDelimIdx);
  const chirality = idx[0] === 0 ? "BE" : "LE";
  const scale = 1 + idx[1];
  const palette = idx[2];
  return { idx, chirality, scale, palette };
}

function paletteColor(palette, intensity = 1) {
  const base =
    palette === 0
      ? [0.25, 0.83, 0.74]
      : palette === 1
      ? [0.96, 0.62, 0.29]
      : [0.73, 0.52, 0.99];
  return [clamp01(base[0] * intensity), clamp01(base[1] * intensity), clamp01(base[2] * intensity), 1];
}

function addQuad(positions, colors, indices, uvs, x0, y0, size, color, vertexBase) {
  const x1 = x0 + size;
  const y1 = y0 + size;

  positions.push(x0, y0, x1, y0, x1, y1, x0, y1);
  uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
  for (let i = 0; i < 4; i += 1) {
    colors.push(color[0], color[1], color[2], color[3]);
  }
  indices.push(
    vertexBase + 0,
    vertexBase + 1,
    vertexBase + 2,
    vertexBase + 0,
    vertexBase + 2,
    vertexBase + 3
  );
}

function parseStream(text) {
  const cps = Array.from(text, (ch) => ch.codePointAt(0));
  const delims = [];
  let idx = 0;
  while (idx < cps.length && delims.length < 3) {
    const cp = cps[idx];
    if (isAegeanDelim(cp)) {
      delims.push(cp);
    } else if (!/\s/.test(String.fromCodePoint(cp))) {
      throw new Error("Stream must begin with 3 Aegean delimiter symbols (𐄀/𐄁/𐄂)");
    }
    idx += 1;
  }
  if (delims.length !== 3) {
    throw new Error("Missing Aegean 3-delimiter header");
  }
  const payload = text.slice(Array.from(text).slice(0, idx).join("").length);
  return { delims, payload };
}

export function renderPacketFromMixedBase(text, frameId = "mixedbase_poc") {
  const { delims, payload } = parseStream(text);
  const mode = headerMode(delims);
  const cell = 4 * mode.scale;
  const dotSize = cell;

  const lines = payload.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmpty = lines[lines.length - 1] === "" ? lines.slice(0, -1) : lines;
  const heightCells = nonEmpty.length;
  const widthChars = nonEmpty.reduce((m, line) => Math.max(m, Array.from(line).length), 0);
  const width = widthChars * 2;
  const height = heightCells * 4;

  const positions = [];
  const colors = [];
  const indices = [];
  const uvs = [];
  let vertexBase = 0;
  let activeDots = 0;
  let brailleCount = 0;

  for (let row = 0; row < nonEmpty.length; row += 1) {
    const chars = Array.from(nonEmpty[row]);
    for (let col = 0; col < chars.length; col += 1) {
      const cp = chars[col].codePointAt(0);
      if (cp < BRAILLE_MIN || cp > BRAILLE_MAX) continue;
      brailleCount += 1;
      let bits = cp - BRAILLE_MIN;
      if (mode.chirality === "LE") bits = reverseBits8(bits);

      for (let bit = 0; bit < 8; bit += 1) {
        if (((bits >> bit) & 1) === 0) continue;
        activeDots += 1;
        let [dx, dy] = DOT_COORDS[bit];
        if (mode.chirality === "LE") dx = 1 - dx;

        const gx = (col * 2 + dx) * dotSize;
        const gy = (row * 4 + dy) * dotSize;
        const intensity = 0.7 + ((bit % 3) * 0.1);
        const color = paletteColor(mode.palette, intensity);
        addQuad(positions, colors, indices, uvs, gx, gy, dotSize, color, vertexBase);
        vertexBase += 4;
      }
    }
  }

  const sourceHash = sha256Hex(text);
  const frame = `${frameId}_${mode.idx.join("")}_${mode.chirality}`;
  return {
    type: "render_packet",
    schema_version: "1.0.0",
    frame_id: frame.slice(0, 64),
    source_artifact_id: `mixedbase:${frameId}`,
    source_artifact_hash: sourceHash,
    primitive_type: "rect_grid",
    width,
    height,
    cell_size: dotSize,
    positions,
    colors,
    indices,
    uvs,
    transforms: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    labels: [
      { text: `mixed-base POC`, x: 4, y: height * dotSize + 16, fill: "#cbd5e1" },
      { text: `header=${delims.map((d) => String.fromCodePoint(d)).join("")} chirality=${mode.chirality} scale=${mode.scale}`, x: 4, y: height * dotSize + 32, fill: "#94a3b8" },
      { text: `braille_cells=${brailleCount} active_dots=${activeDots}`, x: 4, y: height * dotSize + 48, fill: "#94a3b8" }
    ],
    overlay_flags: {
      show_grid: true,
      show_labels: true,
      show_addresses: false
    }
  };
}

function isMainModule() {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
  const self = fileURLToPath(import.meta.url);
  return entry === self;
}

if (isMainModule()) {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] || null;
  if (!inputPath) {
    usage();
    process.exit(2);
  }

  const abs = path.resolve(inputPath);
  if (!fs.existsSync(abs)) {
    console.error(`Input not found: ${abs}`);
    process.exit(2);
  }

  const text = fs.readFileSync(abs, "utf8");
  const packet = renderPacketFromMixedBase(text, path.basename(abs, path.extname(abs)));
  const out = `${JSON.stringify(packet)}\n`;

  if (outputPath) {
    fs.writeFileSync(path.resolve(outputPath), out, "utf8");
  } else {
    process.stdout.write(out);
  }
}
