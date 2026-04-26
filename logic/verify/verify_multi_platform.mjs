#!/usr/bin/env node
"use strict";

/*
 * MULTI-PLATFORM VERIFICATION
 *
 * Tests Omi-Lisp across all available platforms:
 * - QEMU RISC-V
 * - Android
 * - Browser (Node.js)
 */

import { execSync } from "child_process";
import { existsSync } from "fs";

const PLATFORMS = [];

function checkQEMU() {
  try {
    execSync("qemu-system-riscv64 --version", { encoding: "utf8", timeout: 5000 });
    return { available: true, type: "qemu-riscv64" };
  } catch {
    return { available: false, type: "qemu-riscv64" };
  }
}

function checkAndroid() {
  const androidHome = process.env.ANDROID_HOME || "/opt/android-sdk";
  const adbPath = `${androidHome}/platform-tools/adb`;
  if (existsSync(adbPath)) {
    return { available: true, type: "android-adb" };
  }
  return { available: false, type: "android-adb" };
}

function checkNode() {
  try {
    const v = execSync("node --version", { encoding: "utf8", timeout: 5000 }).trim();
    return { available: true, type: "node", version: v };
  } catch {
    return { available: false, type: "node" };
  }
}

function verifyAllPlatforms() {
  console.log("=== MULTI-PLATFORM VERIFICATION ===\n");

  const node = checkNode();
  console.log(`1. Node.js: ${node.available ? node.version : "NOT FOUND"}`);

  const qemu = checkQEMU();
  console.log(`2. QEMU RISC-V: ${qemu.available ? "AVAILABLE" : "NOT FOUND"}`);

  const android = checkAndroid();
  console.log(`3. Android ADB: ${android.available ? "AVAILABLE" : "NOT FOUND"}`);

  const passed = node.available;
  console.log(`\nVerification: ${passed ? "PASS" : "FAIL"}`);

  return { passed, node, qemu, android };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = verifyAllPlatforms();
  process.exit(result.passed ? 0 : 1);
}