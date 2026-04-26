#!/usr/bin/env node
"use strict";

/*
 * AUDIO SYNTHESIS: MAP GEOMETRY TO SOUND
 * 
 * - Polygon sides → frequency ratios
 * - Platonic solids → chord structures
 * - Euler characteristic → beat patterns
 * - Chirality (left/right) → stereo panning
 */

const FREQ_A4 = 440;

const POLYGON_RATIOS = {
  3:  { ratio: 4/3, name: "major third" },
  4:  { ratio: 3/2, name: "perfect fifth" },
  5:  { ratio: 5/4, name: "major sixth" },
  6:  { ratio: 2,   name: "octave" },
  7:  { ratio: 7/4, name: "septimal" },
  8:  { ratio: 9/4, name: "major ninth" },
};

const PLATONIC_CHORDS = {
  tetrahedron:  { root: 0, intervals: [0, 4, 7], type: "major" },
  cube:       { root: -5, intervals: [0, 4, 7, 12], type: "major7" },
  octahedron:  { root: -7, intervals: [0, 3, 7], type: "minor" },
  dodecahedron: { root: -9, intervals: [0, 4, 7, 11], type: "dominant7" },
  icosahedron: { root: -12, intervals: [0, 4, 7, 12, 16], type: "major9" },
};

const CHIRAL_PAN = {
  left:  -0.7,
  right:  0.7,
  neutral: 0,
};

function polygonToFreq(n, base = 440) {
  const r = POLYGON_RATIOS[n];
  if (!r) return base;
  return base * r.ratio;
}

function freqToMidi(freq) {
  return 69 + 12 * Math.log2(freq / 440);
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function interpolateNotes(notes, t) {
  return notes.map(n => ({
    freq: midiToFreq(n.freq + t),
    pan: n.pan || 0,
    duration: n.duration || 1,
  }));
}

export function generatePolygonTone(n, duration = 1) {
  const freq = polygonToFreq(n);
  const midi = freqToMidi(freq);
  
  return {
    polygon: n,
    freq,
    midi: Math.round(midi),
    ratio: POLYGON_RATIOS[n]?.ratio,
    name: POLYGON_RATIOS[n]?.name,
    duration,
  };
}

export function generateSolidChord(solid, duration = 2) {
  const chord = PLATONIC_CHORDS[solid];
  if (!chord) return null;
  
  const notes = chord.intervals.map(interval => ({
    freq: midiToFreq(chord.root + interval),
    midi: chord.root + interval,
    pan: interval === 0 ? 0 : (interval % 2 === 0 ? CHIRAL_PAN.left : CHIRAL_PAN.right),
    duration,
  }));
  
  return {
    solid,
    type: chord.type,
    notes,
  };
}

export function generateEulerBeat(V, F, E, tempo = 120) {
  const chi = V - E + F;
  const beatMs = 60000 / tempo;
  
  if (chi === 2) {
    return [{ offset: 0, duration: beatMs, type: "steady" }];
  } else if (chi === 0) {
    return [
      { offset: 0, duration: beatMs / 2, type: "half" },
      { offset: beatMs / 2, duration: beatMs / 2, type: "half" },
    ];
  } else if (chi === 4) {
    return [
      { offset: 0, duration: beatMs / 4, type: "quarter" },
      { offset: beatMs / 4, duration: beatMs / 4, type: "quarter" },
      { offset: beatMs / 2, duration: beatMs / 4, type: "quarter" },
      { offset: 3 * beatMs / 4, duration: beatMs / 4, type: "quarter" },
    ];
  }
  
  return [{ offset: 0, duration: beatMs, type: "steady" }];
}

export function testAudioSynthesis() {
  console.log("=== AUDIO SYNTHESIS ===\n");

  console.log("--- Polygon Frequencies ---");
  for (const n of [3, 4, 5, 6, 7, 8]) {
    const tone = generatePolygonTone(n);
    console.log(`  ${n}-gon: ${tone.freq.toFixed(1)}Hz (${tone.midi}) = ${tone.name}`);
  }

  console.log("\n--- Platonic Chords ---");
  for (const [solid, chord] of Object.entries(PLATONIC_CHORDS)) {
    console.log(`  ${solid}: ${chord.type} at MIDI ${chord.root}`);
  }

  console.log("\n--- Chord Generation ---");
  const cubeChord = generateSolidChord("cube");
  console.log("cube chord:");
  for (const note of cubeChord.notes) {
    console.log(`  MIDI ${note.midi} → ${note.freq.toFixed(1)}Hz, pan ${note.pan}`);
  }

  console.log("\n--- Euler Beats ---");
  const beats = generateEulerBeat(8, 6, 12);
  console.log("cube (V=8, F=6, E=12, χ=2): steady");

  console.log("\n=== Audio Synthesis Ready ===");
  return { tones: Object.keys(POLYGON_RATIOS).length, chords: Object.keys(PLATONIC_CHORDS).length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAudioSynthesis();
}