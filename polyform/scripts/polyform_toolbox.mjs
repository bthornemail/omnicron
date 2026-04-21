#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const VALID_CARRIERS = new Set(["aztec", "maxi", "beecode", "code16k"]);
const VALID_MODES = new Set(["barcode", "polyform", "polygon"]);

function usage() {
  console.error(
    "Usage:\n" +
      "  node polyform/scripts/polyform_toolbox.mjs build <input.bitboard> <object_id> <carrier> [mode]\n" +
      "  node polyform/scripts/polyform_toolbox.mjs derive-patterns <input.logic> <pattern_prefix>\n" +
      "  node polyform/scripts/polyform_toolbox.mjs verify <object_id> [repo_root]"
  );
}

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, t, data, crc]);
}

function writeGrayPng(filePath, width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // grayscale
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowSize = width + 1;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y += 1) {
    const rowOff = y * rowSize;
    raw[rowOff] = 0;
    for (let x = 0; x < width; x += 1) {
      raw[rowOff + 1 + x] = pixels[y * width + x];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const payload = Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
  fs.writeFileSync(filePath, payload);
}

function parseBitboard(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");

  const words = new Map();
  const grid = [];
  let inGrid = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line === "GRID_16x16:") {
      inGrid = true;
      continue;
    }
    if (inGrid && /^[.#]{16}$/.test(line)) {
      grid.push(line);
      continue;
    }
    if (line.startsWith("#")) continue;
    if (!inGrid) {
      const wm = line.match(/^WORD_([0-9]+)=0x([0-9A-Fa-f]{8})$/);
      if (wm) words.set(Number.parseInt(wm[1], 10), `0x${wm[2].toUpperCase()}`);
    }
  }

  const orderedWordIndexes = [...words.keys()].sort((a, b) => a - b);
  if (orderedWordIndexes.length === 0) throw new Error("No WORD_n rows found");
  if (grid.length === 0) throw new Error("No GRID_16x16 rows found");
  if (grid.some((r) => r.length !== 16) || grid.length !== 16) {
    throw new Error("Bitboard GRID_16x16 must be exactly 16 rows of 16 chars");
  }

  const wordLines = orderedWordIndexes.map((idx) => `WORD_${idx}=${words.get(idx)}`);
  const canonicalPayload = `${wordLines.join("\n")}\nGRID_16x16:\n${grid.join("\n")}\n`;
  return { words: wordLines, grid, canonicalPayload };
}

function bitboardFromGrid(grid) {
  const words = [];
  for (let chunk = 0; chunk < 8; chunk += 1) {
    let word = 0;
    for (let bit = 0; bit < 32; bit += 1) {
      const flat = chunk * 32 + bit;
      const y = Math.floor(flat / 16);
      const x = flat % 16;
      if (grid[y][x] === "#") {
        word |= 1 << (31 - bit);
      }
    }
    words.push(`WORD_${chunk}=0x${(word >>> 0).toString(16).padStart(8, "0").toUpperCase()}`);
  }
  return `${words.join("\n")}\nGRID_16x16:\n${grid.join("\n")}\n`;
}

function gridFromActiveSet(activeSet) {
  const rows = [];
  for (let y = 0; y < 16; y += 1) {
    let row = "";
    for (let x = 0; x < 16; x += 1) {
      row += activeSet.has(y * 16 + x) ? "#" : ".";
    }
    rows.push(row);
  }
  return rows;
}

function deriveCarrierGridFromFacts(facts, carrier) {
  const active = new Set();
  for (let i = 0; i < facts.length; i += 1) {
    const line = facts[i];
    const digest = sha256Hex(`${carrier}|${i}|${line}`);
    const idxA = Number.parseInt(digest.slice(0, 8), 16) % 256;
    const idxB = Number.parseInt(digest.slice(8, 16), 16) % 256;
    active.add(idxA);
    active.add(idxB);
  }
  if (active.size === 0) active.add(0);
  return gridFromActiveSet(active);
}

function gridToPixels(grid) {
  const pixels = new Uint8Array(16 * 16);
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const on = grid[y][x] === "#";
      pixels[y * 16 + x] = on ? 0 : 255;
    }
  }
  return pixels;
}

function collectOnCells(grid) {
  const cells = [];
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      if (grid[y][x] === "#") cells.push({ x, y });
    }
  }
  return cells;
}

function makePolyformGeometry(cells, objectId) {
  return cells.map((c, idx) => ({
    type: "polyform_geometry",
    object_id: objectId,
    geometry_mode: "polyform",
    primitive: "polygon",
    cell_index: idx,
    points: [
      [c.x, c.y],
      [c.x + 1, c.y],
      [c.x + 1, c.y + 1],
      [c.x, c.y + 1]
    ]
  }));
}

function makeBarcodeGeometry(grid, objectId) {
  const out = [];
  let idx = 0;
  for (let y = 0; y < 16; y += 1) {
    let x = 0;
    while (x < 16) {
      while (x < 16 && grid[y][x] !== "#") x += 1;
      if (x >= 16) break;
      const start = x;
      while (x < 16 && grid[y][x] === "#") x += 1;
      const end = x;
      out.push({
        type: "polyform_geometry",
        object_id: objectId,
        geometry_mode: "barcode",
        primitive: "rect",
        run_index: idx,
        x: start,
        y,
        width: end - start,
        height: 1,
        points: [
          [start, y],
          [end, y],
          [end, y + 1],
          [start, y + 1]
        ]
      });
      idx += 1;
    }
  }
  return out;
}

function makePolygonGeometry(cells, objectId) {
  if (cells.length === 0) return [];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const c of cells) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x + 1);
    maxY = Math.max(maxY, c.y + 1);
  }
  return [
    {
      type: "polyform_geometry",
      object_id: objectId,
      geometry_mode: "polygon",
      primitive: "polygon",
      component_index: 0,
      points: [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY]
      ],
      bounds: { min_x: minX, min_y: minY, max_x: maxX, max_y: maxY }
    }
  ];
}

function geometryForMode(mode, grid, objectId) {
  const cells = collectOnCells(grid);
  if (mode === "barcode") return makeBarcodeGeometry(grid, objectId);
  if (mode === "polygon") return makePolygonGeometry(cells, objectId);
  return makePolyformGeometry(cells, objectId);
}

function ensureDirs(root) {
  for (const rel of ["attributes", "geometries", "objects", "transformations", "patterns"]) {
    fs.mkdirSync(path.join(root, rel), { recursive: true });
  }
}

function lispRecord({
  objectId,
  carrier,
  mode,
  bitboardSha,
  geometrySha,
  cellCount,
  sourceBitboardPath
}) {
  return (
    ";; projection-only transform record\n" +
    "(polyform-transform\n" +
    `  (id ${objectId})\n` +
    `  (carrier ${carrier})\n` +
    `  (code16k-mode ${mode})\n` +
    "  (authority bitboard)\n" +
    `  (source-bitboard \"${sourceBitboardPath}\")\n` +
    `  (source-bitboard-sha256 \"${bitboardSha}\")\n` +
    `  (geometry-sha256 \"${geometrySha}\")\n` +
    `  (active-cell-count ${cellCount})\n` +
    "  (pipeline (bitboard canonical geometry render-packet projection)))\n"
  );
}

function build(inputBitboard, objectId, carrier, mode) {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const polyRoot = path.join(repoRoot, "polyform");

  ensureDirs(polyRoot);
  const sourcePath = path.resolve(inputBitboard);
  if (!fs.existsSync(sourcePath)) throw new Error(`Input not found: ${sourcePath}`);
  if (!VALID_CARRIERS.has(carrier)) throw new Error(`Invalid carrier: ${carrier}`);
  if (!VALID_MODES.has(mode)) throw new Error(`Invalid mode: ${mode}`);

  const raw = fs.readFileSync(sourcePath, "utf8");
  const summary = buildFromPayload(polyRoot, raw, objectId, carrier, mode, sourcePath);
  process.stdout.write(`${JSON.stringify(summary)}\n`);
}

function buildFromPayload(polyRoot, payload, objectId, carrier, mode, sourcePath) {
  const parsed = parseBitboard(payload);
  const bitboardSha = sha256Hex(parsed.canonicalPayload);
  const cells = collectOnCells(parsed.grid);
  const geometryRecords = geometryForMode(mode, parsed.grid, objectId);
  const geometryPayload = geometryRecords.map((r) => JSON.stringify(r)).join("\n") + "\n";
  const geometrySha = sha256Hex(geometryPayload);

  const attributes = {
    type: "polyform_attribute",
    schema_version: "1.0.0",
    object_id: objectId,
    carrier_family: carrier,
    code16k_mode: mode,
    authority: {
      source_kind: "bitboard",
      source_file: sourcePath,
      source_sha256: bitboardSha
    },
    dimensions: { width: 16, height: 16 },
    counts: {
      active_cells: cells.length,
      geometry_records: geometryRecords.length
    },
    hashes: {
      bitboard_sha256: bitboardSha,
      geometry_sha256: geometrySha
    },
    provenance: {
      derived_from: "polyform_toolbox_v1",
      lexical_substrates: ["ascii", "braille", "aegean"]
    }
  };

  const attrPath = path.join(polyRoot, "attributes", `${objectId}.json`);
  const geoPath = path.join(polyRoot, "geometries", `${objectId}.ndjson`);
  const objBitboardPath = path.join(polyRoot, "objects", `${objectId}.bitboard`);
  const objPngPath = path.join(polyRoot, "objects", `${objectId}.png`);
  const transformPath = path.join(polyRoot, "transformations", `${objectId}.lisp`);

  fs.writeFileSync(attrPath, `${JSON.stringify(attributes, null, 2)}\n`, "utf8");
  fs.writeFileSync(geoPath, geometryPayload, "utf8");
  fs.writeFileSync(objBitboardPath, parsed.canonicalPayload, "utf8");
  writeGrayPng(objPngPath, 16, 16, gridToPixels(parsed.grid));
  fs.writeFileSync(
    transformPath,
    lispRecord({
      objectId,
      carrier,
      mode,
      bitboardSha,
      geometrySha,
      cellCount: cells.length,
      sourceBitboardPath: sourcePath
    }),
    "utf8"
  );

  return {
    type: "polyform_toolbox_build",
    object_id: objectId,
    carrier,
    code16k_mode: mode,
    files: {
      attributes: attrPath,
      geometry: geoPath,
      bitboard: objBitboardPath,
      png: objPngPath,
      transform: transformPath
    },
    hashes: { bitboard_sha256: bitboardSha, geometry_sha256: geometrySha }
  };
}

function derivePatterns(logicPath, patternPrefix) {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const polyRoot = path.join(repoRoot, "polyform");
  ensureDirs(polyRoot);

  const sourcePath = path.resolve(logicPath);
  if (!fs.existsSync(sourcePath)) throw new Error(`Input not found: ${sourcePath}`);

  const lines = fs
    .readFileSync(sourcePath, "utf8")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("%"));
  if (lines.length === 0) throw new Error("No facts found in logic file");

  const carriers = ["aztec", "maxi", "beecode", "code16k"];
  const results = [];

  for (const carrier of carriers) {
    const grid = deriveCarrierGridFromFacts(lines, carrier);
    const payload = bitboardFromGrid(grid);
    const patternBitboardPath = path.join(polyRoot, "patterns", `${patternPrefix}.${carrier}.bitboard`);
    fs.writeFileSync(patternBitboardPath, payload, "utf8");

    if (carrier === "code16k") {
      for (const mode of ["barcode", "polyform", "polygon"]) {
        const objectId = `${patternPrefix}_${carrier}_${mode}`;
        results.push(buildFromPayload(polyRoot, payload, objectId, carrier, mode, sourcePath));
      }
    } else {
      const defaultMode = carrier === "maxi" ? "barcode" : carrier === "beecode" ? "polygon" : "polyform";
      const objectId = `${patternPrefix}_${carrier}`;
      results.push(buildFromPayload(polyRoot, payload, objectId, carrier, defaultMode, sourcePath));
    }
  }

  const manifestPath = path.join(polyRoot, "patterns", `${patternPrefix}.manifest.ndjson`);
  const manifestLines = results.map((r) =>
    JSON.stringify({
      type: "polyform_pattern_manifest_record",
      object_id: r.object_id,
      carrier: r.carrier,
      code16k_mode: r.code16k_mode,
      bitboard_sha256: r.hashes.bitboard_sha256,
      geometry_sha256: r.hashes.geometry_sha256,
      source_logic: sourcePath
    })
  );
  fs.writeFileSync(manifestPath, `${manifestLines.join("\n")}\n`, "utf8");

  process.stdout.write(
    `${JSON.stringify({
      type: "polyform_pattern_derivation",
      source_logic: sourcePath,
      pattern_prefix: patternPrefix,
      outputs: results.map((r) => r.object_id),
      manifest: manifestPath
    })}\n`
  );
}

function verify(objectId, repoRootArg) {
  const repoRoot =
    repoRootArg ||
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const polyRoot = path.join(repoRoot, "polyform");
  const attrPath = path.join(polyRoot, "attributes", `${objectId}.json`);
  const geoPath = path.join(polyRoot, "geometries", `${objectId}.ndjson`);
  const objBitboardPath = path.join(polyRoot, "objects", `${objectId}.bitboard`);
  const objPngPath = path.join(polyRoot, "objects", `${objectId}.png`);
  const transformPath = path.join(polyRoot, "transformations", `${objectId}.lisp`);

  for (const p of [attrPath, geoPath, objBitboardPath, objPngPath, transformPath]) {
    if (!fs.existsSync(p)) throw new Error(`Missing expected artifact: ${p}`);
  }

  const attrs = JSON.parse(fs.readFileSync(attrPath, "utf8"));
  const bitboardSha = sha256Hex(fs.readFileSync(objBitboardPath, "utf8"));
  const geometrySha = sha256Hex(fs.readFileSync(geoPath, "utf8"));
  if (attrs.hashes.bitboard_sha256 !== bitboardSha) {
    throw new Error("bitboard sha mismatch in attributes");
  }
  if (attrs.hashes.geometry_sha256 !== geometrySha) {
    throw new Error("geometry sha mismatch in attributes");
  }
  if (!VALID_CARRIERS.has(attrs.carrier_family)) {
    throw new Error(`invalid carrier in attributes: ${attrs.carrier_family}`);
  }
  if (!VALID_MODES.has(attrs.code16k_mode)) {
    throw new Error(`invalid mode in attributes: ${attrs.code16k_mode}`);
  }

  process.stdout.write(
    `${JSON.stringify({
      type: "polyform_toolbox_verify",
      object_id: objectId,
      ok: true,
      carrier: attrs.carrier_family,
      mode: attrs.code16k_mode
    })}\n`
  );
}

const cmd = process.argv[2];
if (!cmd) {
  usage();
  process.exit(2);
}

try {
  if (cmd === "build") {
    const input = process.argv[3];
    const objectId = process.argv[4];
    const carrier = (process.argv[5] || "").toLowerCase();
    const mode = (process.argv[6] || "polyform").toLowerCase();
    if (!input || !objectId || !carrier) {
      usage();
      process.exit(2);
    }
    build(input, objectId, carrier, mode);
  } else if (cmd === "derive-patterns") {
    const logicPath = process.argv[3];
    const patternPrefix = process.argv[4];
    if (!logicPath || !patternPrefix) {
      usage();
      process.exit(2);
    }
    derivePatterns(logicPath, patternPrefix);
  } else if (cmd === "verify") {
    const objectId = process.argv[3];
    const repoRoot = process.argv[4];
    if (!objectId) {
      usage();
      process.exit(2);
    }
    verify(objectId, repoRoot);
  } else {
    usage();
    process.exit(2);
  }
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
}
