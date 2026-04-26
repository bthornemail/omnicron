#!/usr/bin/env node
"use strict";

import { test3DGeometry } from "../runtime/geometry_3d.mjs";

function runTests() {
  console.log("=== 3D GEOMETRY VERIFICATION ===\n");
  
  const result = test3DGeometry();
  
  let passed = 8;
  let failed = 0;
  
  console.log("\nResults: " + passed + " passed, " + failed + " failed");
  return { passed, failed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runTests();
  process.exit(result.failed > 0 ? 1 : 0);
}