#!/usr/bin/env node
"use strict";

/*
 * OMI-LISP GEOMETRY TOOLBOX
 *
 * Maps regular polygons to Omi-Lisp control lattice.
 * Based on Schläfli symbols {n} and polygon properties.
 *
 * Geometry primitives:
 *   sin, cos, tan, cot, pi, sqrt, mod, gcd
 *   area, apothem, circumradius
 *   interior-angle, exterior-angle
 *   diagonals, constructible?, star?
 *   render-polygon
 */

export const PI = Math.PI;
export const E = Math.E;

export function sin(x) {
  return Math.sin(x);
}

export function cos(x) {
  return Math.cos(x);
}

export function tan(x) {
  return Math.tan(x);
}

export function cot(x) {
  return 1 / Math.tan(x);
}

export function sinDeg(degrees) {
  return Math.sin(degrees * PI / 180);
}

export function cosDeg(degrees) {
  return Math.cos(degrees * PI / 180);
}

export function tanDeg(degrees) {
  return Math.tan(degrees * PI / 180);
}

export function sqrt(x) {
  return Math.sqrt(x);
}

export function abs(x) {
  return Math.abs(x);
}

export function floor(x) {
  return Math.floor(x);
}

export function ceiling(x) {
  return Math.ceil(x);
}

export function mod(a, b) {
  return ((a % b) + b) % b;
}

export function gcd(a, b) {
  a = abs(a);
  b = abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function fermatPrime(p) {
  return p === 3 || p === 5 || p === 17 || p === 257 || p === 65537;
}

export function constructible(n) {
  if (n < 1) return false;
  if (n === 1) return true;
  
  while (n % 2 === 0) n = n / 2;
  
  const fermatPrimes = [3, 5, 17, 257, 65537];
  const used = new Set();
  
  for (const p of fermatPrimes) {
    while (n % p === 0) {
      if (used.has(p)) return false;
      used.add(p);
      n = n / p;
    }
  }
  
  return n === 1;
}

export function circumradius(n, side) {
  if (n < 1) return 0;
  return side / (2 * sin(PI / n));
}

export function apothem(n, side) {
  if (n < 1) return 0;
  return side / (2 * tan(PI / n));
}

export function area(n, side) {
  if (n < 1) return 0;
  return (n * side * side) / (4 * tan(PI / n));
}

export function interiorAngle(n) {
  if (n < 1) return 0;
  return ((n - 2) * 180) / n;
}

export function exteriorAngle(n) {
  if (n < 1) return 0;
  return 360 / n;
}

export function diagonals(n) {
  if (n < 3) return 0;
  return (n * (n - 3)) / 2;
}

export function starCheck(p, q) {
  return q > 1 && gcd(p, q) === 1;
}

export function getSchlafli(n, density = 1) {
  if (density === 1) return `{${n}}`;
  return `{${n}/${density}}`;
}

export function getPolygonName(n) {
  const names = {
    3: "triangle",
    4: "square",
    5: "pentagon",
    6: "hexagon",
    7: "heptagon",
    8: "octagon",
    9: "nonagon",
    10: "decagon",
    11: "hendecagon",
    12: "dodecagon"
  };
  return names[n] || `${n}-gon`;
}

export function isRegular(n) {
  return n >= 3 && Number.isInteger(n);
}

export function isConvex(n) {
  return n >= 3 && n <= 12;
}

export function renderPolygon(n, side, options = {}) {
  if (n < 3) return null;
  
  const width = options.width || 80;
  const height = options.height || 24;
  const char = options.char || "*";
  const empty = options.empty || " ";
  
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy) - 2;
  
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * PI * i / n) - PI / 2;
    points.push({
      x: Math.round(cx + r * cos(angle)),
      y: Math.round(cy + r * sin(angle))
    });
  }
  
  const grid = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = empty;
    }
  }
  
  for (const p of points) {
    if (p.y >= 0 && p.y < height && p.x >= 0 && p.x < width) {
      grid[p.y][p.x] = char;
    }
  }
  
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    for (let s = 1; s < steps; s++) {
      const x = Math.round(p1.x + dx * s / steps);
      const y = Math.round(p1.y + dy * s / steps);
      if (y >= 0 && y < height && x >= 0 && x < width) {
        grid[y][x] = char;
      }
    }
  }
  
  let result = "";
  for (let y = 0; y < height; y++) {
    result += grid[y].join("") + "\n";
  }
  
  return result;
}

export function getGeometryInfo(n, density = 1) {
  const side = 1;
  return {
    name: getPolygonName(n),
    schlafli: getSchlafli(n, density),
    sides: n,
    density,
    area: area(n, side),
    circumradius: circumradius(n, side),
    apothem: apothem(n, side),
    interiorAngle: interiorAngle(n),
    exteriorAngle: exteriorAngle(n),
    diagonals: diagonals(n),
    constructible: constructible(n),
    star: density > 1 && starCheck(n, density)
  };
}

export function testGeometry() {
  console.log("=== OMI-LISP GEOMETRY TOOLBOX TESTS ===\n");
  
  const tests = [
    { name: "triangle area", fn: () => area(3, 1), expect: 0.4330127019 },
    { name: "square area", fn: () => area(4, 1), expect: 1.0 },
    { name: "pentagon area", fn: () => area(5, 1), expect: 1.720477401 },
    { name: "hexagon area", fn: () => area(6, 1), expect: 2.598076211 },
    
    { name: "triangle interior", fn: () => interiorAngle(3), expect: 60 },
    { name: "square interior", fn: () => interiorAngle(4), expect: 90 },
    { name: "pentagon interior", fn: () => interiorAngle(5), expect: 108 },
    { name: "hexagon interior", fn: () => interiorAngle(6), expect: 120 },
    
    { name: "triangle diagonals", fn: () => diagonals(3), expect: 0 },
    { name: "square diagonals", fn: () => diagonals(4), expect: 2 },
    { name: "pentagon diagonals", fn: () => diagonals(5), expect: 5 },
    { name: "hexagon diagonals", fn: () => diagonals(6), expect: 9 },
    
    { name: "constructible 3", fn: () => constructible(3), expect: true },
    { name: "constructible 4", fn: () => constructible(4), expect: true },
    { name: "constructible 5", fn: () => constructible(5), expect: true },
    { name: "constructible 6", fn: () => constructible(6), expect: true },
    { name: "constructible 7", fn: () => constructible(7), expect: false },
    { name: "constructible 8", fn: () => constructible(8), expect: true },
    { name: "constructible 9", fn: () => constructible(9), expect: false },
    { name: "constructible 10", fn: () => constructible(10), expect: true },
    { name: "constructible 11", fn: () => constructible(11), expect: false },
    { name: "constructible 12", fn: () => constructible(12), expect: true },
    
    { name: "star 5/2", fn: () => starCheck(5, 2), expect: true },
    { name: "star 7/2", fn: () => starCheck(7, 2), expect: true },
    { name: "star 7/3", fn: () => starCheck(7, 3), expect: true },
    { name: "not star 6/2", fn: () => starCheck(6, 2), expect: false },
    
    { name: "gcd 5,2", fn: () => gcd(5, 2), expect: 1 },
    { name: "gcd 12,4", fn: () => gcd(12, 4), expect: 4 },
    { name: "gcd 17,3", fn: () => gcd(17, 3), expect: 1 }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const actual = test.fn();
    const pass = Math.abs(actual - test.expect) < 0.0001 || actual === test.expect;
    if (pass) {
      console.log(`  OK: ${test.name}`);
      passed++;
    } else {
      console.log(`  FAIL: ${test.name} (got ${actual}, expected ${test.expect})`);
      failed++;
    }
  }
  
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = testGeometry();
  
  console.log("\n=== Triangle Render ===\n");
  console.log(renderPolygon(3, 1, { width: 20, height: 10 }));
  
  console.log("=== Square Render ===\n");
  console.log(renderPolygon(4, 1, { width: 20, height: 10 }));
  
  console.log("=== Pentagon Render ===\n");
  console.log(renderPolygon(5, 1, { width: 20, height: 10 }));
  
  process.exit(result.failed > 0 ? 1 : 0);
}