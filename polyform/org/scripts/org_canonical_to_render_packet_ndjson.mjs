#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error(
    "Usage: node scripts/org_canonical_to_render_packet_ndjson.mjs <canonical.ndjson> [render_packet.ndjson]"
  );
}

function clamp01(n) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function makeColorFromChar(ch) {
  const code = ch.charCodeAt(0);
  const r = clamp01(((code * 37) % 255) / 255);
  const g = clamp01(((code * 67) % 255) / 255);
  const b = clamp01(((code * 97) % 255) / 255);
  return [r, g, b, 1];
}

function renderPacketFromCanonical(rec) {
  const payload = String(rec.canonical_payload ?? "");
  const rawLines = payload.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines = rawLines[rawLines.length - 1] === "" ? rawLines.slice(0, -1) : rawLines;
  const width = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const height = lines.length;
  const cell = 12;

  const positions = [];
  const colors = [];
  const indices = [];
  const uvs = [];

  let vertexBase = 0;
  for (let y = 0; y < height; y += 1) {
    const line = lines[y];
    for (let x = 0; x < width; x += 1) {
      const ch = x < line.length ? line[x] : " ";
      const [r, g, b, a] = makeColorFromChar(ch);
      const x0 = x * cell;
      const y0 = y * cell;
      const x1 = x0 + cell;
      const y1 = y0 + cell;

      positions.push(x0, y0, x1, y0, x1, y1, x0, y1);
      uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      for (let i = 0; i < 4; i += 1) {
        colors.push(r, g, b, a);
      }
      indices.push(
        vertexBase + 0,
        vertexBase + 1,
        vertexBase + 2,
        vertexBase + 0,
        vertexBase + 2,
        vertexBase + 3
      );
      vertexBase += 4;
    }
  }

  const labels = [
    {
      text: `artifact:${(rec.artifact_id || "").slice(0, 16)}`,
      x: 4,
      y: height * cell + 20,
      fill: "#cbd5e1"
    }
  ];
  if (rec.virtual_address) {
    labels.push({
      text: `va:${rec.virtual_address}`,
      x: 4,
      y: height * cell + 36,
      fill: "#94a3b8"
    });
  }

  return {
    type: "render_packet",
    schema_version: "1.0.0",
    frame_id: (rec.artifact_id || "").slice(0, 16),
    source_artifact_id: rec.artifact_id || "",
    source_artifact_hash: rec.artifact_hash || "",
    primitive_type: "rect_grid",
    width,
    height,
    cell_size: cell,
    positions,
    colors,
    indices,
    uvs,
    transforms: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    labels,
    overlay_flags: {
      show_grid: true,
      show_labels: true,
      show_addresses: true
    }
  };
}

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? null;
if (!inputPath) {
  usage();
  process.exit(2);
}

const absInput = path.resolve(inputPath);
if (!fs.existsSync(absInput)) {
  console.error(`Input not found: ${absInput}`);
  process.exit(2);
}

const lines = fs
  .readFileSync(absInput, "utf8")
  .split("\n")
  .filter((l) => l.trim().length > 0);

const out = [];
for (const line of lines) {
  let rec;
  try {
    rec = JSON.parse(line);
  } catch (err) {
    console.error(`Skipping invalid JSON line: ${err.message}`);
    continue;
  }
  if (rec.type !== "canonical_artifact") continue;
  out.push(JSON.stringify(renderPacketFromCanonical(rec)));
}

const payload = out.join("\n") + (out.length ? "\n" : "");
if (outputPath) {
  fs.writeFileSync(path.resolve(outputPath), payload, "utf8");
} else {
  process.stdout.write(payload);
}
