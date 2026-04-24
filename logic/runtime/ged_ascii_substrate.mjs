#!/usr/bin/env node
"use strict";

export const GED_BITS = Object.freeze({
  MEMORY_HOTPLUG: 0,
  SYSTEM_POWERDOWN: 1,
  NVDIMM_HOTPLUG: 2,
  CPU_HOTPLUG: 3
});

export const GED_STRUCTURAL_TOKEN = Object.freeze({
  [GED_BITS.MEMORY_HOTPLUG]: 0x28,   // (
  [GED_BITS.SYSTEM_POWERDOWN]: 0x29, // )
  [GED_BITS.NVDIMM_HOTPLUG]: 0x2e,   // .
  [GED_BITS.CPU_HOTPLUG]: 0x2f       // /
});

export function popcount32(n) {
  let x = n >>> 0;
  let c = 0;
  while (x) {
    c += x & 1;
    x >>>= 1;
  }
  return c;
}

export function decodeGedSelector(mask) {
  if (!Number.isInteger(mask) || mask < 0 || mask > 0xFFFFFFFF) {
    return {
      ok: false,
      error: { code: "E_GED_MASK_RANGE", message: "mask must be uint32" }
    };
  }

  const reserved = (mask >>> 4) & 0x0FFFFFFF;
  if (reserved !== 0) {
    return {
      ok: false,
      error: { code: "E_GED_RESERVED_BITS", message: "bits 4..31 are reserved and must be zero" }
    };
  }

  return {
    ok: true,
    event: {
      mask: mask >>> 0,
      memory_hotplug: ((mask >>> GED_BITS.MEMORY_HOTPLUG) & 1) === 1,
      system_powerdown: ((mask >>> GED_BITS.SYSTEM_POWERDOWN) & 1) === 1,
      nvdimm_hotplug: ((mask >>> GED_BITS.NVDIMM_HOTPLUG) & 1) === 1,
      cpu_hotplug: ((mask >>> GED_BITS.CPU_HOTPLUG) & 1) === 1
    }
  };
}

export function selectorBytesLE(mask) {
  const m = mask >>> 0;
  return [m & 0xff, (m >>> 8) & 0xff, (m >>> 16) & 0xff, (m >>> 24) & 0xff];
}

export function buildGedAsciiSubstrateFrame(mask) {
  const decoded = decodeGedSelector(mask);
  if (!decoded.ok) return decoded;

  const m = mask >>> 0;
  const unaryControl = Array.from({ length: 0x20 }, (_, i) => i);

  const row2Structural = [0x20]; // SP activates structural lane
  for (let bit = 0; bit <= 3; bit += 1) {
    if (((m >>> bit) & 1) === 1) {
      row2Structural.push(GED_STRUCTURAL_TOKEN[bit]);
    }
  }

  // System lexer markers in 0x30 row:
  // first byte carries active-event count as ASCII digit 0..4.
  const active = popcount32(m & 0x0f);
  const row3Logic = [0x30 + active, 0x3a, 0x3f]; // <digit> : ?

  const stream = [...unaryControl, ...row2Structural, ...row3Logic];

  return {
    ok: true,
    frame: {
      type: "ged_ascii_substrate_frame",
      selector_mask: m,
      selector_bytes_le: selectorBytesLE(m),
      configuration_tree: {
        row0_control: [0x00, 0x0f],
        row1_pointer: [0x10, 0x1f],
        row2_structural: row2Structural,
        row3_logic: row3Logic
      },
      stream
    }
  };
}
