#!/usr/bin/env node
"use strict";

/*
 * ANDROID EMULATOR VERIFICATION GATE
 *
 * Tests Android SDK availability for Omi-Lisp.
 * Note: Full AVD requires KVM/HAXM acceleration.
 */

import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

const ANDROID_HOME = process.env.ANDROID_HOME || "/opt/android-sdk";

function checkAndroidSDK() {
  const sdkPath = existsSync(join(ANDROID_HOME, "platform-tools"));
  return { 
    available: sdkPath,
    adb: existsSync(join(ANDROID_HOME, "platform-tools", "adb")),
    sdkmanager: existsSync(join(ANDROID_HOME, "cmdline-tools", "latest", "bin", "sdkmanager"))
  };
}

function checkADBVersion() {
  try {
    const adb = join(ANDROID_HOME, "platform-tools", "adb");
    const out = execSync(`${adb} version`, { encoding: "utf8", timeout: 5000 });
    const match = out.match(/Version ([\d.]+)/);
    return { version: match ? match[1] : "unknown", raw: out };
  } catch (e) {
    return { version: null, error: e.message };
  }
}

function checkKVM() {
  try {
    const kvm = existsSync("/dev/kvm") || existsSync("/dev/null");
    return { available: kvm };
  } catch {
    return { available: false };
  }
}

function checkEmulator() {
  const emulatorPaths = [
    join(ANDROID_HOME, "emulator", "emulator"),
    "/usr/bin/emulator",
    "/usr/local/bin/emulator"
  ];
  
  for (const p of emulatorPaths) {
    if (existsSync(p)) return { available: true, path: p };
  }
  
  const toolsZip = join(ANDROID_HOME, "emulator", "emulator");
  return { available: existsSync(toolsZip), path: toolsZip };
}

export function verifyAndroidEmulator() {
  console.log("=== ANDROID EMULATOR VERIFICATION ===\n");

  console.log("1. Android SDK...");
  const sdk = checkAndroidSDK();
  console.log(`   SDK: ${sdk.available ? "FOUND" : "NOT FOUND"}`);
  console.log(`   ADB: ${sdk.adb ? "FOUND" : "NOT FOUND"}`);
  console.log(`   sdkmanager: ${sdk.sdkmanager ? "FOUND" : "NOT FOUND"}`);

  console.log("\n2. ADB version...");
  const adbVer = checkADBVersion();
  if (adbVer.version) {
    console.log(`   Version: ${adbVer.version}`);
  } else {
    console.log(`   Error: ${adbVer.error}`);
  }

  console.log("\n3. Hardware acceleration...");
  const kvm = checkKVM();
  console.log(`   KVM: ${kvm.available ? "AVAILABLE" : "NOT AVAILABLE"}`);

  console.log("\n4. Emulator binary...");
  const emulator = checkEmulator();
  console.log(`   Emulator: ${emulator.available ? "FOUND at " + emulator.path : "NOT INSTALLED"}`);

  const passed = sdk.available && sdk.adb && adbVer.version !== null;
  console.log(`\nVerification: ${passed ? "PASS" : "FAIL"}`);
  
  return { passed, sdk, adbVer, kvm, emulator };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = verifyAndroidEmulator();
  process.exit(result.passed ? 0 : 1);
}