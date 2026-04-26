#!/usr/bin/env node
"use strict";

/*
 * ANDROID SDK/ADB VERIFICATION GATE
 *
 * Tests Android SDK components and ADB connectivity.
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const ANDROID_HOME = process.env.ANDROID_HOME || "/opt/android-sdk";

function checkSDK() {
  return {
    home: existsSync(ANDROID_HOME),
    platformTools: existsSync(join(ANDROID_HOME, "platform-tools")),
    cmdlineTools: existsSync(join(ANDROID_HOME, "cmdline-tools")),
  };
}

function checkADB() {
  const adbPath = join(ANDROID_HOME, "platform-tools", "adb");
  if (!existsSync(adbPath)) {
    return { available: false };
  }
  
  try {
    const out = execSync(`${adbPath} version`, { encoding: "utf8", timeout: 5000 });
    const match = out.match(/Version ([\d.]+)/);
    return { available: true, version: match ? match[1] : "unknown" };
  } catch {
    return { available: false };
  }
}

function checkDevices() {
  const adbPath = join(ANDROID_HOME, "platform-tools", "adb");
  if (!existsSync(adbPath)) {
    return { available: false, devices: [] };
  }
  
  try {
    const out = execSync(`${adbPath} devices`, { encoding: "utf8", timeout: 5000 });
    const lines = out.split("\n").filter(l => l.includes("\tdevice"));
    return { available: true, devices: lines.map(l => l.split("\t")[0]) };
  } catch {
    return { available: true, devices: [] };
  }
}

function verifyAndroidSDK() {
  console.log("=== ANDROID SDK/ADB VERIFICATION ===\n");

  console.log("1. SDK Structure...");
  const sdk = checkSDK();
  console.log(`   home: ${sdk.home ? "FOUND" : "NOT FOUND"}`);
  console.log(`   platform-tools: ${sdk.platformTools ? "FOUND" : "NOT FOUND"}`);
  console.log(`   cmdline-tools: ${sdk.cmdlineTools ? "FOUND" : "NOT FOUND"}`);

  console.log("\n2. ADB Version...");
  const adb = checkADB();
  console.log(`   adb: ${adb.available ? adb.version : "NOT FOUND"}`);

  console.log("\n3. Devices...");
  const devices = checkDevices();
  console.log(`   connected: ${devices.devices.length}`);

  const passed = sdk.home && sdk.platformTools && adb.available;
  console.log(`\nVerification: ${passed ? "PASS" : "FAIL"}`);
  
  return { passed, sdk, adb, devices };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = verifyAndroidSDK();
  process.exit(result.passed ? 0 : 1);
}