#!/usr/bin/env node
"use strict";

/*
 * OMI-LISP RELATIONAL GEOMETRY ONTOLOGY
 *
 * Geometry as facts and rules, not floating formulas.
 * Numeric projections are downstream.
 *
 * Core facts:
 *   polygon/2, family/2, dual/2, chirality/2
 *   constructible/1, star/2, density/2
 *
 * Header width mapping:
 *   header8  = n <= 4  (triangle, square)
 *   header16 = n <= 8  (pentagon, hexagon, heptagon, octagon)
 *   header32 = n <= 12 (nonagon, decagon, hendecagon, dodecagon)
 *   header256 = n > 12 (extended polygons)
 */

import { createDatalogEngine } from "./datalog_engine.mjs";
import { NIL } from "./cons_diagram.mjs";

const REL_POLYGON = "polygon";
const REL_FAMILY = "family";
const REL_DUAL = "dual";
const REL_CHIRALITY = "chirality";
const REL_CONSTRUCTIBLE = "constructible";
const REL_STAR = "star";
const REL_DENSITY = "density";
const REL_HEADER_WIDTH = "header_width";
const REL_DIALECT_BAND = "dialect_band";

export function createGeometryOntology() {
  const engine = createDatalogEngine();

  engine.addFact(REL_POLYGON, "triangle", "3");
  engine.addFact(REL_POLYGON, "square", "4");
  engine.addFact(REL_POLYGON, "pentagon", "5");
  engine.addFact(REL_POLYGON, "hexagon", "6");
  engine.addFact(REL_POLYGON, "heptagon", "7");
  engine.addFact(REL_POLYGON, "octagon", "8");
  engine.addFact(REL_POLYGON, "nonagon", "9");
  engine.addFact(REL_POLYGON, "decagon", "10");
  engine.addFact(REL_POLYGON, "hendecagon", "11");
  engine.addFact(REL_POLYGON, "dodecagon", "12");

  engine.addFact(REL_FAMILY, "triangle", "trivial");
  engine.addFact(REL_FAMILY, "square", "trivial");
  engine.addFact(REL_FAMILY, "pentagon", "regular");
  engine.addFact(REL_FAMILY, "hexagon", "regular");
  engine.addFact(REL_FAMILY, "heptagon", "regular");
  engine.addFact(REL_FAMILY, "octagon", "regular");
  engine.addFact(REL_FAMILY, "nonagon", "regular");
  engine.addFact(REL_FAMILY, "decagon", "regular");
  engine.addFact(REL_FAMILY, "hendecagon", "regular");
  engine.addFact(REL_FAMILY, "dodecagon", "regular");

  engine.addFact(REL_HEADER_WIDTH, "3", "header8");
  engine.addFact(REL_HEADER_WIDTH, "4", "header8");
  engine.addFact(REL_HEADER_WIDTH, "5", "header16");
  engine.addFact(REL_HEADER_WIDTH, "6", "header16");
  engine.addFact(REL_HEADER_WIDTH, "7", "header16");
  engine.addFact(REL_HEADER_WIDTH, "8", "header16");
  engine.addFact(REL_HEADER_WIDTH, "9", "header32");
  engine.addFact(REL_HEADER_WIDTH, "10", "header32");
  engine.addFact(REL_HEADER_WIDTH, "11", "header32");
  engine.addFact(REL_HEADER_WIDTH, "12", "header32");

  engine.addFact(REL_DIALECT_BAND, "3", "control");
  engine.addFact(REL_DIALECT_BAND, "4", "structural");
  engine.addFact(REL_DIALECT_BAND, "5", "uppercase");
  engine.addFact(REL_DIALECT_BAND, "6", "uppercase");
  engine.addFact(REL_DIALECT_BAND, "7", "lowercase");
  engine.addFact(REL_DIALECT_BAND, "8", "lowercase");
  engine.addFact(REL_DIALECT_BAND, "9", "digit");
  engine.addFact(REL_DIALECT_BAND, "10", "digit");
  engine.addFact(REL_DIALECT_BAND, "11", "symbol");
  engine.addFact(REL_DIALECT_BAND, "12", "symbol");

  engine.addFact(REL_CONSTRUCTIBLE, "3");
  engine.addFact(REL_CONSTRUCTIBLE, "4");
  engine.addFact(REL_CONSTRUCTIBLE, "5");
  engine.addFact(REL_CONSTRUCTIBLE, "6");
  engine.addFact(REL_CONSTRUCTIBLE, "8");
  engine.addFact(REL_CONSTRUCTIBLE, "10");
  engine.addFact(REL_CONSTRUCTIBLE, "12");
  engine.addFact(REL_CONSTRUCTIBLE, "15");
  engine.addFact(REL_CONSTRUCTIBLE, "17");

  engine.addFact(REL_STAR, "5", "2");
  engine.addFact(REL_STAR, "7", "2");
  engine.addFact(REL_STAR, "7", "3");
  engine.addFact(REL_STAR, "8", "3");
  engine.addFact(REL_STAR, "9", "2");
  engine.addFact(REL_STAR, "9", "4");

  engine.addRule("star_polygon", ["N", "D"], [
    { relation: REL_STAR, args: ["N", "D"] }
  ]);

  engine.addRule("regular_polygon", ["Name", "N"], [
    { relation: REL_POLYGON, args: ["Name", "N"] },
    { relation: REL_FAMILY, args: ["Name", "regular"] }
  ]);

  engine.addRule("constructible_polygon", ["N"], [
    { relation: REL_POLYGON, args: ["_", "N"] },
    { relation: REL_CONSTRUCTIBLE, args: ["N"] }
  ]);

  engine.addRule("header_for_polygon", ["Name", "Width"], [

  engine.addRule("header_for_polygon", ["Name", "Width"], [
    { relation: REL_POLYGON, args: ["Name", "N"] },
    { relation: REL_HEADER_WIDTH, args: ["N", "Width"] }
  ]);

  engine.addRule("dialect_for_polygon", ["Name", "Band"], [
    { relation: REL_POLYGON, args: ["Name", "N"] },
    { relation: REL_DIALECT_BAND, args: ["N", "Band"] }
  ]);

  return engine;
}

export function getPolygonFacts(engine, name) {
  const n = engine.query(REL_POLYGON, [name, "_"]);
  const family = engine.query(REL_FAMILY, [name, "_"]);
  const header = engine.query(REL_HEADER_WIDTH, [n[0]?.[1] || "_", "_"]);
  const dialect = engine.query(REL_DIALECT_BAND, [n[0]?.[1] || "_", "_"]);
  const stars = engine.query(REL_STAR, [n[0]?.[1] || "_", "_"]);
  
  return {
    name,
    sides: n[0]?.[1],
    family: family[0]?.[1],
    header: header[0]?.[1],
    dialect: dialect[0]?.[1],
    star: stars.map(s => s[1])
  };
}

export function queryAllPolygons(engine) {
  const polys = engine.query(REL_POLYGON, ["_", "_"]);
  return polys.map(p => getPolygonFacts(engine, p[0]));
}

export function queryConstructible(engine) {
  const polys = engine.query(REL_POLYGON, ["_", "_"]);
  const result = [];
  for (const p of polys) {
    const n = p[1];
    const isConst = engine.query(REL_CONSTRUCTIBLE, [n]);
    if (isConst.length > 0) {
      result.push(n);
    }
  }
  return result;
}

export function addPlatonicSolids(engine) {
  engine.addFact("solid", "tetrahedron", "platonic");
  engine.addFact("solid", "cube", "platonic");
  engine.addFact("solid", "octahedron", "platonic");
  engine.addFact("solid", "dodecahedron", "platonic");
  engine.addFact("solid", "icosahedron", "platonic");

  engine.addFact(REL_DUAL, "tetrahedron", "tetrahedron");
  engine.addFact(REL_DUAL, "cube", "octahedron");
  engine.addFact(REL_DUAL, "octahedron", "cube");
  engine.addFact(REL_DUAL, "dodecahedron", "icosahedron");
  engine.addFact(REL_DUAL, "icosahedron", "dodecahedron");

  engine.addFact("vertices", "tetrahedron", "4");
  engine.addFact("vertices", "cube", "8");
  engine.addFact("vertices", "octahedron", "6");
  engine.addFact("vertices", "dodecahedron", "20");
  engine.addFact("vertices", "icosahedron", "12");

  engine.addFact("faces", "tetrahedron", "4");
  engine.addFact("faces", "cube", "6");
  engine.addFact("faces", "octahedron", "8");
  engine.addFact("faces", "dodecahedron", "12");
  engine.addFact("faces", "icosahedron", "20");

  engine.addFact("edges", "tetrahedron", "6");
  engine.addFact("edges", "cube", "12");
  engine.addFact("edges", "octahedron", "12");
  engine.addFact("edges", "dodecahedron", "30");
  engine.addFact("edges", "icosahedron", "30");
}

export function testRelationalGeometry() {
  console.log("=== OMI-LISP RELATIONAL GEOMETRY ONTOLOGY ===\n");

  const engine = createGeometryOntology();

  console.log("--- Polygon Facts ---");
  const all = queryAllPolygons(engine);
  for (const p of all) {
    console.log(`  ${p.name}(${p.sides}): family=${p.family}, header=${p.header}, dialect=${p.dialect}`);
  }

  console.log("\n--- Constructible Polygons (Gauss-Wantzel) ---");
  const constructible = queryConstructible(engine);
  console.log(`  ${constructible.join(", ")}`);

  console.log("\n--- Star Polygons ---");
  for (const p of all) {
    if (p.star.length > 0) {
      console.log(`  ${p.name}: ${p.star.map(d => `${d}-pointed`).join(", ")}`);
    }
  }

  console.log("\n--- Platonic Solids ---");
  addPlatonicSolids(engine);
  const solids = engine.query("solid", ["_", "platonic"]);
  for (const s of solids) {
    const v = engine.query("vertices", [s[0], "_"]);
    const f = engine.query("faces", [s[0], "_"]);
    const d = engine.query(REL_DUAL, [s[0], "_"]);
    console.log(`  ${s[0]}: V=${v[0]?.[1]}, F=${f[0]?.[1]}, dual=${d[0]?.[1]}`);
  }

  console.log("\n=== Relational Geometry Complete ===");
  return { polygons: all.length, constructible: constructible.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testRelationalGeometry();
}