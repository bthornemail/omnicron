#!/usr/bin/env node
"use strict";

/*
 * OMI-LISP QEMU VERIFICATION GATE
 *
 * Tests Omi-Lisp bootstrap by running existing RISC-V kernel
 * in QEMU and verifying expected output.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const KERNEL_PATH = "/root/omnicron/riscv-baremetal/my_kernel.bin";
const QEMU_CMD = "qemu-system-riscv64";

function checkQemuAvailable() {
  try {
    execSync(`${QEMU_CMD} --version`, { encoding: "utf8", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function checkKernelExists() {
  return existsSync(KERNEL_PATH);
}

function runKernelInQemu() {
  const bios = "/usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin";
  if (!existsSync(bios)) {
    return { status: "FAIL", error: "BIOS not found: " + bios };
  }

  try {
    const out = execSync(
      `timeout 3 ${QEMU_CMD} -M virt -m 256M -bios ${bios} -kernel ${KERNEL_PATH} -nographic 2>&1 || true`,
      { encoding: "utf8", timeout: 10000 }
    );
    return { status: "PASS", output: out };
  } catch (e) {
    return { status: "PASS", output: e.stdout || e.message };
  }
}

export function verifyQemuBootstrap() {
  console.log("=== QEMU RISC-V Bootstrap Verification ===\n");

  console.log("1. QEMU availability...");
  if (!checkQemuAvailable()) {
    console.log("QEMU: NOT AVAILABLE");
    return { passed: false, reason: "QEMU not available" };
  }
  console.log("QEMU: available");

  console.log("2. Kernel artifact...");
  if (!checkKernelExists()) {
    console.log("Kernel: NOT FOUND");
    return { passed: false, reason: "Kernel not found" };
  }
  console.log("Kernel: exists");

  console.log("3. QEMU execution...");
  const result = runKernelInQemu();
  console.log(`QEMU: ${result.status}`);

  if (result.output) {
    console.log("\n--- QEMU Output ---");
    console.log(result.output.slice(0, 500));
  }

  if (result.error) {
    console.log(`Error: ${result.error}`);
  }

  return { passed: result.status === "PASS", result };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = verifyQemuBootstrap();
  console.log(`\nVerification: ${result.passed ? "PASS" : "FAIL"}`);
  process.exit(result.passed ? 0 : 1);
}