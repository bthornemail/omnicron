# AGENT_GUARDRAILS.md

## Purpose

Fix the coding agent so it stops substituting SBCL/Common Lisp for omi-lisp. This file aligns the agent to YOUR system.

---

## Your System: OMI-LISP

OMI-LISP is NOT:
- Common Lisp
- SBCL
- Scheme
- Any Lisp variant

OMI-LISP is:
- Pre-eval/apply control lattice
- Pre-language, pre-runtime control selectors
- HEADER8 runtime injection surface
- Dot-notation as canonical structure
- QEMU/RISC-V as target substrate

---

## Your Stack (Use These Words)

| Term | Meaning |
|-----|---------|
| control plane | 32 control codes (0x00-0x1F) |
| HEADER8 | 8-slot runtime injection surface |
| plane | ASCII/BRAILLE/AEGEAN/OMICRON decoding |
| dot-notation | `(a . b)` structural language |
| rewrite | byte→HEADER8→match→fixpoint→emit |
| QEMU runtime | RISC-V virt machine target |

---

## The Pipeline

```
byte stream
→ control lattice (pre-language)
→ HEADER8 (runtime witness)
→ rewrite/fixpoint
→ emit
```

NOT: write Lisp → eval/apply → done

---

## Files in Your System

| File | What It Is |
|------|-----------|
| omi_loader.lisp | byte→HEADER8→emit engine |
| omi_header8_reader.lisp | HEADER8 interpreter |
| omi_rewrite_core.lisp | rewrite/fixpoint |
| omi_riscv_vm.c | RISC-V kernel |
| omi-braille-table.lisp | Braille encoding |
| omi-aegean-table.lisp | Aegean encoding |
| omi-bom-table.lisp | BOM (sign + channels) |

---

## Before Writing Code: Ask

1. Which layer are we changing?
   - language grammar
   - runtime state machine
   - QEMU boot path
   - notation tables
   - docs

2. Is this extending YOUR files or replacing with SBCL?

---

## Never Say

- "use SBCL"
- "Common Lisp has this"
- "in Lisp we'd do"
- "try eval/apply"

---

## Always Do

- Use YOUR terminology
- Extend existing files
- Stay in YOUR frame
- Read the code first

---

## Quick Alignment Test

Before responding, verify:
- Did I use SBCL? → WRONG
- Did I use Common Lisp terms? → WRONG  
- Did I read YOUR code? → CORRECT
- Did I use YOUR words? → CORRECT

---

## Repo Anchors

The code overrides speculation:
- omi_loader.lisp
- omi_header8_reader.lisp  
- omi_rewrite_core.lisp
- omi_riscv_vm.c
- omi-braille-table.lisp
- omi-aegean-table.lisp
- omi-bom-table.lisp

---

## Short Reminder

> Omi-lisp is NOT a Lisp variant. It is pre-eval/apply control lattice with HEADER8 runtime. Use YOUR words. Extend YOUR files.