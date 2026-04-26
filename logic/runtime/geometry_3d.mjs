#!/usr/bin/env node
"use strict";

/*
 * 3D GEOMETRY: POLYHEDRA, POLYTOPES, COXETER GROUPS
 * 
 * Platonic solids (5), Archimedean (13), Catalan (13)
 * Regular polytopes {p,q,r}, Coxeter groups
 */

const PHI = (1 + Math.sqrt(5)) / 2;

export const PLATONIC = {
  tetrahedron:   { name: "tetrahedron",   V: 4, F: 4, E: 6,  symmetry: 12, dual: "tetrahedron",   faces: 4 },
  cube:       { name: "cube",       V: 8, F: 6, E: 12, symmetry: 24, dual: "octahedron",   faces: 6 },
  octahedron: { name: "octahedron", V: 6, F: 8, E: 12, symmetry: 24, dual: "cube",       faces: 8 },
  dodecahedron: { name: "dodecahedron", V: 20, F: 12, E: 30, symmetry: 60, dual: "icosahedron", faces: 12 },
  icosahedron: { name: "icosahedron", V: 12, F: 20, E: 30, symmetry: 60, dual: "dodecahedron", faces: 20 },
};

export const ARCHIMEDEAN = {
  truncated_tetrahedron:   { V: 12, F: 4, E: 18 },
  truncated_cube:          { V: 24, F: 8, E: 36 },
  truncated_octahedron:     { V: 24, F: 6, E: 36 },
  truncated_dodecahedron:   { V: 60, F: 12, E: 90 },
  truncated_icosahedron:   { V: 60, F: 12, E: 90 },
  cuboctahedron:            { V: 12, F: 14, E: 24 },
  icosidodecahedron:      { V: 30, F: 32, E: 60 },
  snub_cube:             { V: 24, F: 38, E: 60 },
  snub_dodecahedron:      { V: 60, F: 92, E: 150 },
  great_cuboctahedron:    { V: 24, F: 26, E: 48 },
  great_rhombicuboctahedron: { V: 48, F: 26, E: 72 },
  great_icosidodecahedron: { V: 60, F: 32, E: 90 },
  great_snub_dodecahedron: { V: 60, F: 92, E: 150 },
};

export const CATALAN = {
  triakistetrahedron:      { V: 4, F: 12, E: 18 },
  triakisoctahedron:     { V: 8, F: 24, E: 36 },
  tetrakishexahedron:    { V: 6, F: 24, E: 36 },
  triakisicosahedron:    { V: 12, F: 60, E: 90 },
  pentakisdodecahedron: { V: 20, F: 60, E: 90 },
  rhombicuboctahedron:  { V: 12, F: 26, E: 48 },
  deltoidalhexecontahedron: { V: 24, F: 60, E: 84 },
  disdyakisdodecahedron: { V: 30, F: 60, E: 90 },
  disdyakistriacontahedron: { V: 60, F: 120, E: 180 },
};

export const COXETER_GROUPS = {
  "A3":  { group: "A3",  order: 24,  type: "tetrahedral",      notation: "{3,3,4}" },
  "B3":  { group: "B3",  order: 48,  type: "cubic",          notation: "{4,3,4}" },
  "H3":  { group: "H3",  order: 120, type: "icosahedral",     notation: "{5,3,3}" },
  "C4":  { group: "C4",  order: 120, type: "24-cell",        notation: "{3,4,3}" },
  "F4":  { group: "F4",  order: 1152, type: "24-cell",        notation: "{3,4,3}" },
};

const SCHLAfli = {
  triangle: "{3}",
  square: "{4}",
  pentagon: "{5}",
  hexagon: "{6}",
  heptagon: "{7}",
  octagon: "{8}",
  nonagon: "{9}",
  decagon: "{10}",
};

function euler(V, F, E) {
  return V - E + F;
}

function circumradius(n, side) {
  if (n < 3) return 0;
  return side / (2 * Math.sin(Math.PI / n));
}

function inscribedRadius(n, side) {
  if (n < 3) return 0;
  return side / (2 * Math.tan(Math.PI / n));
}

function getSolidByName(name) {
  if (PLATONIC[name]) return PLATONIC[name];
  if (ARCHIMEDEAN[name]) return ARCHIMEDEAN[name];
  if (CATALAN[name]) return CATALAN[name];
  return null;
}

export function test3DGeometry() {
  console.log("=== 3D GEOMETRY: POLYHEDRA ===\n");

  console.log("--- Platonic Solids ---");
  for (const [name, s] of Object.entries(PLATONIC)) {
    const X = euler(s.V, s.F, s.E);
    console.log(`  ${s.name}: V=${s.V}, F=${s.F}, E=${s.E}, χ=${X}, dual=${s.dual}`);
  }

  console.log("\n--- Euler Characteristic ---");
  for (const [name, s] of Object.entries(PLATONIC)) {
    const X = euler(s.V, s.F, s.E);
    console.log(`  ${s.name}: χ = ${X}`);
  }

  console.log("\n--- Coxeter Groups ---");
  for (const [name, g] of Object.entries(COXETER_GROUPS)) {
    console.log(`  ${g.group}: order=${g.order}, type=${g.type}, notation=${g.notation}`);
  }

  console.log("\n--- Schläfli Symbols (2D) ---");
  for (const [name, sch] of Object.entries(SCHLAfli)) {
    console.log(`  ${name}: ${sch}`);
  }

  console.log("\n--- Radii (n=4, side=1) ---");
  const r = inscribedRadius(4, 1);
  const R = circumradius(4, 1);
  console.log(`  square: R=${R.toFixed(4)}, r=${r.toFixed(4)}`);

  console.log("\n=== 3D Geometry Ready ===");
  return { platonic: Object.keys(PLATONIC).length, archimedean: Object.keys(ARCHIMEDEAN).length, coxeter: Object.keys(COXETER_GROUPS).length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  test3DGeometry();
}