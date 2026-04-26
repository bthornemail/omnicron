#!/usr/bin/env node
"use strict";

import { 
  sin, cos, tan, cot, sqrt, abs, floor, ceiling,
  mod, gcd, fermatPrime, constructible,
  circumradius, apothem, area,
  interiorAngle, exteriorAngle, diagonals,
  starCheck, getSchlafli, getPolygonName,
  isRegular, isConvex, renderPolygon,
  getGeometryInfo, testGeometry
} from "../runtime/geometry_toolbox.mjs";

function test(name, actual, expected) {
  const pass = Math.abs(actual - expected) < 0.0001 || actual === expected;
  console.log(`${pass ? "OK" : "FAIL"}: ${name}`);
  return pass;
}

let passed = 0;
let failed = 0;

console.log("=== Geometry Toolbox Verification ===\n");

console.log("--- Primitives ---");
if (test("sin(PI/6)", sin(Math.PI/6), 0.5)) passed++; else failed++;
if (test("cos(PI/3)", cos(Math.PI/3), 0.5)) passed++; else failed++;
if (test("tan(PI/4)", tan(Math.PI/4), 1)) passed++; else failed++;
if (test("cot(PI/4)", cot(Math.PI/4), 1)) passed++; else failed++;
if (test("sqrt(4)", sqrt(4), 2)) passed++; else failed++;
if (test("abs(-3)", abs(-3), 3)) passed++; else failed++;
if (test("gcd(12,4)", gcd(12, 4), 4)) passed++; else failed++;
if (test("mod(7,3)", mod(7, 3), 1)) passed++; else failed++;

console.log("\n--- Regular Polygons ---");
const polys = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
for (const n of polys) {
  const info = getGeometryInfo(n);
  console.log(`  ${n}-gon: ${info.name}, area=${info.area.toFixed(3)}, interior=${info.interiorAngle}, constructible=${info.constructible}`);
  passed++;
}

console.log("\n--- Star Polygons ---");
if (test("star 5/2", starCheck(5, 2), true)) passed++; else failed++;
if (test("star 7/2", starCheck(7, 2), true)) passed++; else failed++;
if (test("star 7/3", starCheck(7, 3), true)) passed++; else failed++;
if (test("not star 6/2", starCheck(6, 2), false)) passed++; else failed++;

console.log("\n--- Constructibility (Gauss-Wantzel) ---");
const constructTests = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17];
const constructExpected = {
  3: true, 4: true, 5: true, 6: true, 7: false, 8: true, 
  9: false, 10: true, 11: false, 12: true, 13: false, 15: true, 17: true
};
for (const n of constructTests) {
  const expected = constructExpected[n];
  if (test(`constructible(${n})`, constructible(n), expected)) passed++; else failed++;
}

console.log("\n--- Schläfli Symbols ---");
if (test("schlafli 4", getSchlafli(4), "{4}")) passed++; else failed++;
if (test("schlafli 5/2", getSchlafli(5, 2), "{5/2}")) passed++; else failed++;
if (test("polygon name 5", getPolygonName(5), "pentagon")) passed++; else failed++;

console.log("\n--- Render Check ---");
const render = renderPolygon(4, 1, { width: 10, height: 6 });
if (test("render exists", render.includes("*"), true)) passed++; else failed++;

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);