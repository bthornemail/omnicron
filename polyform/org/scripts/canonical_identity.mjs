#!/usr/bin/env node

import { createHash } from "node:crypto";

export function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

export function deriveAddressSeed(stepIdentity, frameLaw) {
  return sha256Hex(`seed|${stepIdentity}|${frameLaw}`);
}

export function deriveVirtualAddress(addressSeed) {
  const lane = Number.parseInt(addressSeed.slice(0, 2), 16) % 16;
  const channel = Number.parseInt(addressSeed.slice(2, 4), 16) % 16;
  const slot = Number.parseInt(addressSeed.slice(4, 8), 16) % 60;
  const page = Number.parseInt(addressSeed.slice(8, 16), 16) >>> 0;
  return `va:${page.toString(16).padStart(8, "0")}:${lane}.${channel}.${slot}`;
}

export function deriveBalancedAddress(addressSeed) {
  const raw = Number.parseInt(addressSeed.slice(16, 24), 16) % 8192;
  const signed = raw - 4096;
  const chiralityBit = Number.parseInt(addressSeed.slice(24, 26), 16) & 0x1;
  const chirality = chiralityBit === 0 ? "left" : "right";
  const sign = signed >= 0 ? "+" : "";
  return `ba:${chirality}:${sign}${signed}`;
}

export function deriveReceiptAnchor(stepIdentity, addressSeed) {
  return sha256Hex(`receipt|${stepIdentity}|${addressSeed}`);
}

export function deriveArtifactId({
  stepIdentity,
  addressSeed,
  virtualAddress,
  balancedAddress,
  sourcePath,
  artifactKind
}) {
  return sha256Hex(
    [stepIdentity, addressSeed, virtualAddress, balancedAddress, sourcePath, artifactKind].join("|")
  );
}

export function deriveArtifactHash({
  artifactId,
  contentSha256,
  payloadKind,
  receiptAnchor,
  semanticFingerprint
}) {
  return sha256Hex(
    [artifactId, contentSha256, payloadKind, receiptAnchor, semanticFingerprint].join("|")
  );
}
