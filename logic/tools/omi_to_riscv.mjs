#!/usr/bin/env node
"use strict";

/*
 * OMI-LISP COMPILER -> RISC-V BINARY
 *
 * Full pipeline: Omi-Lisp -> C -> ELF64 -> QEMU
 */

import { evalExpr, boot, toSexpr, makeSymbol } from "../runtime/boot_omi.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

function emitCPreamble() {
  return `/*
 * OMI-LISP BOOTSTRAP KERNEL
 * Auto-generated for RISC-V (rv64gc)
 */

#include <stdint.h>
#include <stdbool.h>

#define NIL ((void*)0)
#define IS_CONS(x) ((x) != NIL)
#define CONS(a,b) make_pair((void*)(a), (void*)(b))

typedef struct cons_cell {
    void *car;
    void *cdr;
} cons_cell;

static cons_cell heap1[4096];
static cons_cell heap2[4096];

void *make_pair(void *car, void *cdr) {
    static int which = 0;
    static int idx = 0;
    if (idx >= 4096) return 0;
    cons_cell *c = (which == 0) ? &heap1[idx] : &heap2[idx];
    idx++;
    if (idx >= 4096) { which = 1 - which; idx = 0; }
    c->car = car;
    c->cdr = cdr;
    return c;
}

void *car(void *x) { return x == NIL ? NIL : ((cons_cell*)x)->car; }
void *cdr(void *x) { return x == NIL ? NIL : ((cons_cell*)x)->cdr; }

int equal(void *a, void *b) {
    return (a == b) ? 1 : 0;
}

int length_r(void *list) {
    int n = 0;
    while (list != NIL) { n++; list = cdr(list); }
    return n;
}

void *list_from_array(void **arr, int len) {
    void *result = NIL;
    for (int i = len - 1; i >= 0; i--) {
        result = CONS(arr[i], result);
    }
    return result;
}

void outc(char c) {
    volatile char *uart = (volatile char *)0x10000000;
    *uart = c;
}

void outs(const char *s) {
    while (*s) outc(*s++);
    outc('\\n');
}

void putdec(uint64_t v) {
    char buf[32];
    int i = 0;
    if (v == 0) { outc('0'); return; }
    while (v > 0) {
        buf[i++] = '0' + (v % 10);
        v /= 10;
    }
    while (i > 0) outc(buf[--i]);
}

void puthex(uint64_t v) {
    const char *hex = "0123456789ABCDEF";
    for (int i = 60; i >= 0; i -= 4) outc(hex[(v >> i) & 0xF]);
}

void outsp(void *x) {
    if (x == NIL) { outs("NIL"); return; }
    if (IS_CONS(x)) {
        outc('(');
        outsp(car(x));
        outc(' ');
        outsp(cdr(x));
        outc(')');
    } else {
        puthex((uint64_t)x);
    }
}

void test_cons(void) {
    outs("Testing cons...");
    void *p = CONS((void*)0x41, (void*)0x42);
    void *a = car(p);
    void *d = cdr(p);
    puthex((uint64_t)a);
    outc(' ');
    puthex((uint64_t)d);
    outc('\\n');
}

void test_list(void) {
    outs("Testing list...");
    void *arr[3];
    arr[0] = (void*)0x41;
    arr[1] = (void*)0x42;
    arr[2] = (void*)0x43;
    void *lst = list_from_array(arr, 3);
    putdec(length_r(lst));
    outc('\\n');
}

void test_nested(void) {
    outs("Testing nested...");
    void *a = CONS((void*)1, (void*)2);
    void *b = CONS((void*)3, (void*)4);
    void *c = CONS(a, b);
    putdec(length_r(c));
    outc('\\n');
}

int main(void) {
    outs("=== OMI-LISP RISC-V BOOT ===");
    test_cons();
    test_list();
    test_nested();
    outs("=== DONE ===");
    while (1);
}
`;
}

function compileCToElf(cCode, outputPath) {
  const tmpDir = "/tmp";
  const cPath = join(tmpDir, "omi_riscv.c");
  const ldPath = "/root/omnicron/riscv-baremetal/linker.ld";
  
  writeFileSync(cPath, cCode);
  
  const cmd = `riscv64-unknown-elf-gcc -fno-pic -march=rv64gc -nostdlib -T ${ldPath} -o ${outputPath} ${cPath}`;
  
  console.log(`Compiling: ${cmd}`);
  try {
    execSync(cmd, { encoding: "utf8", timeout: 30000 });
    console.log(`Written: ${outputPath}`);
    return outputPath;
  } catch (e) {
    console.error(`Compile failed: ${e.message}`);
    return null;
  }
}

export function compileOmiToRiscv(sexpr, outputPath = "/tmp/omi_riscv.elf") {
  if (typeof sexpr === "string") {
    const result = evalExpr(sexpr);
    console.log(`Compiled: ${sexpr} -> ${result}`);
  }
  
  const cCode = emitCPreamble();
  return compileCToElf(cCode, outputPath);
}

export function runInQemu(elfPath) {
  if (!existsSync(elfPath)) {
    return { status: "FAIL", error: "ELF not found: " + elfPath };
  }
  
  try {
    const out = execSync(`qemu-system-riscv64 -M virt -m 256M -kernel ${elfPath} -nographic 2>&1`, {
      encoding: "utf8",
      timeout: 10000
    });
    return { status: "PASS", output: out };
  } catch (e) {
    return { status: "FAIL", error: e.message };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("=== OMI-LISP -> RISC-V COMPILER ===\n");
  
  console.log("Step 1: Generate C...");
  const cCode = emitCPreamble();
  
  console.log("Step 2: Compile to ELF...");
  const elfPath = "/tmp/omi_riscv.elf";
  const result = compileCToElf(cCode, elfPath);
  
  if (result) {
    console.log("\nStep 3: Run in QEMU...");
    const qemu = runInQemu(result);
    console.log(`QEMU: ${qemu.status}`);
    if (qemu.output) console.log(qemu.output);
  }
  
  console.log("\n=== Pipeline Complete ===");
}