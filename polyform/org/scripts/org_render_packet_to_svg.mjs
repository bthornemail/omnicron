#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error(
    "Usage: node scripts/org_render_packet_to_svg.mjs <render_packet.ndjson> [output.svg]"
  );
}

function toHex01(v) {
  const n = Math.max(0, Math.min(255, Math.round(v * 255)));
  return n.toString(16).padStart(2, "0");
}

function rgbaToHex(r, g, b) {
  return `#${toHex01(r)}${toHex01(g)}${toHex01(b)}`;
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
if (lines.length === 0) {
  console.error("No render packet records found.");
  process.exit(2);
}

let packet;
try {
  packet = JSON.parse(lines[0]);
} catch (err) {
  console.error(`Invalid JSON: ${err.message}`);
  process.exit(2);
}
if (packet.type !== "render_packet") {
  console.error("Input record is not type=render_packet.");
  process.exit(2);
}

const widthPx = packet.width * packet.cell_size;
const heightPx = packet.height * packet.cell_size + (packet.labels?.length ? 48 : 0);
const rects = [];

const cellCount = packet.width * packet.height;
for (let i = 0; i < cellCount; i += 1) {
  const p = i * 8;
  const c = i * 16;
  const x = packet.positions[p + 0];
  const y = packet.positions[p + 1];
  const w = packet.cell_size;
  const h = packet.cell_size;
  const fill = rgbaToHex(packet.colors[c + 0], packet.colors[c + 1], packet.colors[c + 2]);
  const stroke = packet.overlay_flags?.show_grid ? ' stroke="#0f172a" stroke-width="0.5"' : "";
  rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${stroke} />`);
}

const labels = (packet.labels || [])
  .map(
    (l) =>
      `<text x="${l.x}" y="${l.y}" fill="${l.fill || "#e2e8f0"}" font-size="12" font-family="monospace">${String(
        l.text || ""
      )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</text>`
  )
  .join("\n");

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthPx} ${heightPx}" width="${widthPx}" height="${heightPx}">`,
  `<rect x="0" y="0" width="${widthPx}" height="${heightPx}" fill="#020617" />`,
  ...rects,
  labels,
  "</svg>"
].join("\n");

if (outputPath) {
  fs.writeFileSync(path.resolve(outputPath), `${svg}\n`, "utf8");
} else {
  process.stdout.write(`${svg}\n`);
}
