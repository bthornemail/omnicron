#!/usr/bin/env node
"use strict";

/*
 * POLYFORM SUBSYSTEM
 * 
 * Polyforms as Pure Functional Continuation Bricks
 * 1D → 2D → 2.5D → 3D polyforms with barcode framing
 * 
 * Key types from dev-docs/front-end/archive/:
 *   - Polyominoes (squares)
 *   - Polycubes (cubes)  
 *   - Polyiamonds (triangles)
 *   - Polyhexes (hexagons)
 *   - Polytans (right triangles)
 *   - Polyocts (octagons + squares)
 * 
 * Barcode frames:
 *   - Aztec
 *   - MaxiCode
 *   - Code 16K (USS-16K)
 *   - BEEtag
 */

export const BASIS_KINDS = {
  POLYOMINO: { dimension: 2, cell: "square", base: "square" },
  POLYCUBE: { dimension: 3, cell: "cube", base: "cube" },
  POLYDIAMOND: { dimension: 2, cell: "triangle", base: "triangle" },
  POLYHEX: { dimension: 2, cell: "hexagon", base: "hexagon" },
  POLYTAN: { dimension: 2, cell: "right_triangle", base: "triangle" },
  POLYOCT: { dimension: 2, cell: "octagon", base: "octagon" },
  POLYSTICK: { dimension: 1, cell: "edge", base: "line" },
};

export const POLYFORM_DIMENSIONS = {
  1: "polysticks",
  2: "polyominoes + polyiamonds + polyhexes + polytans + polyocts",
  2.5: "extruded polyforms (height from Aztec layers)",
  3: "polycubes",
};

export const BARCODE_FRAMES = {
  AZTEC: {
    name: "Aztec",
    type: "matrix",
    layers: "concentric square rings",
    capacity: "variable",
    redundancy: "reedsolomon",
  },
  MAXICODE: {
    name: "MaxiCode",
    type: "matrix",
    pattern: "hexagonal modules",
    capacity: "144 data bytes",
    redundancy: "reedsolomon",
  },
  CODE16K: {
    name: "Code 16K",
    type: "stacked",
    rows: "2-8",
    capacity: "77 ASCII chars",
    redundancy: "checksum",
  },
  BEEtag: {
    name: "BEEtag",
    type: "matrix",
    pattern: "bee honeycomb",
    capacity: "variable",
    redundancy: "error correction",
  },
};

export const CONSTITUTIONAL_CHANNELS = {
  FS: { name: "FS", description: "function select" },
  GS: { name: "GS", description: "generation select" },
  RS: { name: "RS", description: "reduction select" },
  US: { name: "US", description: "unification select" },
};

class PolyformCell {
  constructor(kind, type, continuation = null) {
    this.kind = kind;
    this.type = type;
    this.continuation = continuation;
  }
  
  static terminal(kind) {
    return new PolyformCell(kind, "terminal");
  }
  
  static branch(kind, left, right) {
    return new PolyformCell(kind, "branch", { left, right });
  }
  
  static loop(kind, forward, backward) {
    return new PolyformCell(kind, "loop", { forward, backward });
  }
  
  static func(kind, transform, body) {
    return new PolyformCell(kind, "func", { transform, body });
  }
}

class Polyform {
  constructor(cells, entry, exit) {
    this.cells = cells;
    this.entry = entry;
    this.exit = exit;
  }
  
  grow(direction) {
    return new Polyform(
      [...this.cells, PolyformCell.terminal(this.kind)],
      this.entry,
      this.exit
    );
  }
}

function createPolyomino(n) {
  const cells = [];
  for (let i = 0; i < n; i++) {
    cells.push(PolyformCell.terminal("polyomino"));
  }
  return new Polyform(cells, cells[0], cells[cells.length - 1]);
}

function createPolycube(n) {
  const cells = [];
  for (let i = 0; i < n; i++) {
    cells.push(PolyformCell.terminal("polycube"));
  }
  return new Polyform(cells, cells[0], cells[cells.length - 1]);
}

export function testPolyformSubsystem() {
  console.log("=== POLYFORM SUBSYSTEM ===\n");

  console.log("--- Basis Kinds ---");
  for (const [name, basis] of Object.entries(BASIS_KINDS)) {
    console.log(`  ${name}: ${basis.dimension}D, cell=${basis.cell}`);
  }

  console.log("\n--- Dimensions ---");
  for (const [dim, desc] of Object.entries(POLYFORM_DIMENSIONS)) {
    console.log(`  ${dim}: ${desc}`);
  }

  console.log("\n--- Barcode Frames ---");
  for (const [code, frame] of Object.entries(BARCODE_FRAMES)) {
    console.log(`  ${code}: ${frame.type}, ${frame.redundancy}`);
  }

  console.log("\n--- Constitutional Channels ---");
  for (const [ch, info] of Object.entries(CONSTITUTIONAL_CHANNELS)) {
    console.log(`  ${ch}: ${info.description}`);
  }

  console.log("\n--- Polyominoes (n=1..5) ---");
  for (let i = 1; i <= 5; i++) {
    const p = createPolyomino(i);
    console.log(`  n=${i}: cells=${p.cells.length}`);
  }

  console.log("\n--- Polycubes (n=1..4) ---");
  for (let i = 1; i <= 4; i++) {
    const p = createPolycube(i);
    console.log(`  n=${i}: cells=${p.cells.length}`);
  }

  console.log("\n=== Polyform Subsystem Ready ===");
  return { 
    basis: Object.keys(BASIS_KINDS).length,
    frames: Object.keys(BARCODE_FRAMES).length,
    channels: Object.keys(CONSTITUTIONAL_CHANNELS).length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testPolyformSubsystem();
}