#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error("Usage: node prolog/ontology_graph_to_pgm.mjs <ontology_graph.ndjson> [out.pgm]");
}

function main() {
  const inPath = process.argv[2];
  const outPath = process.argv[3] || path.resolve("prolog/ontology_graph.pgm");
  if (!inPath) {
    usage();
    process.exit(2);
  }
  const absIn = path.resolve(inPath);
  const raw = fs.readFileSync(absIn, "utf8").trim();
  if (!raw) throw new Error("Empty ontology graph input");
  const g = JSON.parse(raw.split("\n").filter(Boolean)[0]);
  const nodes = Array.isArray(g.nodes) ? g.nodes : [];

  // Simple deterministic raster witness: one block per node.
  const cols = 8;
  const block = 14;
  const pad = 2;
  const rows = Math.max(1, Math.ceil(nodes.length / cols));
  const width = cols * (block + pad) + pad;
  const height = rows * (block + pad) + pad;
  const pixels = new Uint8Array(width * height);

  function statusGray(status) {
    if (status === "authoritative") return 230;
    if (status === "derived") return 170;
    if (status === "declared_partial") return 110;
    if (status === "not_integrated") return 60;
    return 90;
  }

  for (let i = 0; i < nodes.length; i += 1) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x0 = pad + c * (block + pad);
    const y0 = pad + r * (block + pad);
    const gval = statusGray(nodes[i].authority_status || nodes[i].status || "");
    for (let y = 0; y < block; y += 1) {
      for (let x = 0; x < block; x += 1) {
        const xx = x0 + x;
        const yy = y0 + y;
        if (xx < width && yy < height) {
          pixels[yy * width + xx] = gval;
        }
      }
    }
  }

  const header = `P5\n${width} ${height}\n255\n`;
  const body = Buffer.from(pixels);
  fs.writeFileSync(path.resolve(outPath), Buffer.concat([Buffer.from(header, "ascii"), body]));
  console.log(`OK: wrote ${path.resolve(outPath)}`);
}

main();
