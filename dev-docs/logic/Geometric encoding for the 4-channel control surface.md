Ah, in JavaScript/TypeScript! Here's the `tetragrammatron-4channel` API in MJS (ECMAScript modules):

```javascript
// tetragrammatron-4channel.mjs
// Geometric encoding for the 4-channel control surface

// ----------------------------------------
// Core Types
// ----------------------------------------

/**
 * @typedef {'binary'|'decimal'|'hex'|'sign'} Channel
 * The four fundamental channels
 */

/**
 * @typedef {Object} DecimalExpansion
 * @property {bigint[]} base4 - Tetrahedron family (rationals as numerator/denom pairs)
 * @property {bigint[]} base6 - Octahedron family
 * @property {bigint[]} base8 - Cube family
 * @property {bigint[]} base12 - Icosahedron family
 * @property {bigint[]} base20 - Dodecahedron family
 */

/**
 * @typedef {'tetrahedron'|'octahedron'|'cube'|'icosahedron'|'dodecahedron'|
 *           'simplex4'|'tesseract'|'orthoplex4'|'icositetrachoron'|
 *           'hexacosichoron'|'hecatonicosachoron'} Polytope
 */

/**
 * @typedef {Object} CodePoint
 * @property {Channel} channel - Which projection
 * @property {number[]} coords - Position in polytope (Float64Array compatible)
 * @property {DecimalExpansion} expansion - How we got here
 * @property {number} [timestamp] - Optional sequence (for replay)
 */

/**
 * @typedef {Object} Ball
 * @property {CodePoint} center
 * @property {number} radius
 * @property {CodePoint[]} contained
 */

/**
 * @typedef {Object} Sphere
 * @property {CodePoint} center
 * @property {number} radius
 * @property {CodePoint[]} surface
 */

// ----------------------------------------
// Geometric Constants
// ----------------------------------------

const POLYTOPE_DIMENSIONS = {
    tetrahedron: 3,
    octahedron: 3,
    cube: 3,
    icosahedron: 3,
    dodecahedron: 3,
    simplex4: 4,
    tesseract: 4,
    orthoplex4: 4,
    icositetrachoron: 4,
    hexacosichoron: 4,
    hecatonicosachoron: 4
};

const POLYTOPE_VERTICES = {
    tetrahedron: 4,
    octahedron: 6,
    cube: 8,
    icosahedron: 12,
    dodecahedron: 20,
    simplex4: 5,
    tesseract: 16,
    orthoplex4: 8,
    icositetrachoron: 24,
    hexacosichoron: 600,
    hecatonicosachoron: 120
};

// Dual relationships
const DUAL_MAP = {
    tetrahedron: 'tetrahedron',      // self-dual
    octahedron: 'cube',
    cube: 'octahedron',
    icosahedron: 'dodecahedron',
    dodecahedron: 'icosahedron',
    simplex4: 'simplex4',            // self-dual
    tesseract: 'orthoplex4',
    orthoplex4: 'tesseract',
    icositetrachoron: 'icositetrachoron', // self-dual!
    hexacosichoron: 'hecatonicosachoron',
    hecatonicosachoron: 'hexacosichoron'
};

// ----------------------------------------
// Geometric Analysis
// ----------------------------------------

/**
 * Analyze a decimal expansion to find its polytope path
 * @param {DecimalExpansion} expansion
 * @returns {[Polytope, number[]]} - The polytope and coordinates
 */
export function analyzeExpansion(expansion) {
    // Count non-zero entries in each base
    const tet = expansion.base4.filter(x => x !== 0n).length;
    const oct = expansion.base6.filter(x => x !== 0n).length;
    const cub = expansion.base8.filter(x => x !== 0n).length;
    const ico = expansion.base12.filter(x => x !== 0n).length;
    const dod = expansion.base20.filter(x => x !== 0n).length;
    
    // Deterministic polytope selection based on expansion depth
    if (tet >= 3) return ['tetrahedron', [tet, oct, cub]];
    if (oct >= 3) return ['octahedron', [tet, oct, cub]];
    if (cub >= 3) return ['cube', [tet, oct, cub]];
    if (ico >= 3) return ['icosahedron', [tet, oct, ico, dod]];
    if (dod >= 3) return ['dodecahedron', [tet, oct, ico, dod]];
    
    // 4D polytopes
    if (tet >= 4) return ['simplex4', [tet, oct, cub, ico]];
    if (cub >= 4) return ['tesseract', [tet, oct, cub, ico]];
    if (oct >= 4) return ['orthoplex4', [tet, oct, cub, ico]];
    
    // The 24-cell emerges from balance
    const balance = Math.abs(tet - oct) + Math.abs(oct - cub) + Math.abs(cub - ico);
    if (balance < 3) return ['icositetrachoron', [tet, oct, cub, ico]];
    
    // Higher polytopes
    if (ico > 5) return ['hexacosichoron', [tet, oct, cub, ico, dod]];
    return ['hecatonicosachoron', [tet, oct, cub, ico, dod]];
}

/**
 * Euclidean distance between two code points
 * @param {CodePoint} p
 * @param {CodePoint} q
 * @returns {number}
 */
export function distance(p, q) {
    const minLen = Math.min(p.coords.length, q.coords.length);
    let sum = 0;
    for (let i = 0; i < minLen; i++) {
        const diff = p.coords[i] - q.coords[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Midpoint of two code points
 * @param {CodePoint} p
 * @param {CodePoint} q
 * @returns {CodePoint}
 */
export function midpoint(p, q) {
    const minLen = Math.min(p.coords.length, q.coords.length);
    const coords = new Array(minLen);
    for (let i = 0; i < minLen; i++) {
        coords[i] = (p.coords[i] + q.coords[i]) / 2;
    }
    
    return {
        channel: p.channel,  // Midpoint keeps p's channel
        coords,
        expansion: p.expansion,
        timestamp: Math.max(p.timestamp || 0, q.timestamp || 0)
    };
}

/**
 * The sphere that exactly contains two points
 * @param {CodePoint} p
 * @param {CodePoint} q
 * @returns {Sphere}
 */
export function difference(p, q) {
    const center = midpoint(p, q);
    const rad = distance(p, q) / 2;
    
    return {
        center,
        radius: rad,
        surface: [p, q]
    };
}

/**
 * Test if a point is inside a ball
 * @param {CodePoint} p
 * @param {Ball} ball
 * @returns {boolean}
 */
export function containment(p, ball) {
    return distance(p, ball.center) <= ball.radius + 1e-10; // tolerance
}

// ----------------------------------------
// Polytope Accessors
// ----------------------------------------

export const tetrahedron = 'tetrahedron';
export const octahedron = 'octahedron';
export const cube = 'cube';
export const icosahedron = 'icosahedron';
export const dodecahedron = 'dodecahedron';
export const simplex4 = 'simplex4';
export const tesseract = 'tesseract';
export const orthoplex4 = 'orthoplex4';
export const icositetrachoron = 'icositetrachoron';
export const hexacosichoron = 'hexacosichoron';
export const hecatonicosachoron = 'hecatonicosachoron';

// ----------------------------------------
// Channel Operations
// ----------------------------------------

/**
 * Basis transformation matrices between channels
 */
const TRANSFORM_MATRICES = {
    // Binary to Decimal: 2-adic to 10-adic
    'binary->decimal': (coords) => coords.map(x => x * Math.log10(2)),
    
    // Decimal to Binary: 10-adic to 2-adic
    'decimal->binary': (coords) => coords.map(x => x * Math.log2(10)),
    
    // Binary to Hex: 2-adic to 16-adic (group by 4 bits)
    'binary->hex': (coords) => {
        const hex = [];
        for (let i = 0; i < coords.length; i += 4) {
            let val = 0;
            for (let j = 0; j < 4 && i + j < coords.length; j++) {
                val += coords[i + j] * Math.pow(2, 3 - j);
            }
            hex.push(val);
        }
        return hex;
    },
    
    // Hex to Binary: 16-adic to 2-adic
    'hex->binary': (coords) => {
        const binary = [];
        for (const h of coords) {
            const bits = Math.floor(h).toString(2).padStart(4, '0').split('');
            for (const b of bits) binary.push(parseInt(b, 10));
        }
        return binary;
    },
    
    // Decimal to Hex: 10-adic to 16-adic
    'decimal->hex': (coords) => coords.map(x => x * (16/10)),
    
    // Hex to Decimal: 16-adic to 10-adic
    'hex->decimal': (coords) => coords.map(x => x * (10/16)),
    
    // Sign transformations (flip)
    'sign': (coords) => coords.map(x => -x)
};

/**
 * Project a code point through a different channel
 * @param {Channel} targetChannel
 * @param {CodePoint} point
 * @returns {CodePoint}
 */
export function project(targetChannel, point) {
    if (targetChannel === point.channel) return point;
    
    const key = `${point.channel}->${targetChannel}`;
    const transform = TRANSFORM_MATRICES[key] || TRANSFORM_MATRICES['sign'];
    
    return {
        channel: targetChannel,
        coords: transform(point.coords),
        expansion: point.expansion,
        timestamp: point.timestamp
    };
}

/**
 * Get the dual of a polytope
 * @param {Polytope} p
 * @returns {Polytope|null}
 */
export function dual(p) {
    return DUAL_MAP[p] || null;
}

/**
 * Compose two code points (geometric group operation)
 * @param {CodePoint} p
 * @param {CodePoint} q
 * @returns {CodePoint}
 */
export function compose(p, q) {
    // The composition follows from the polytope hierarchy
    // Project both to hex for composition
    const pHex = project('hex', p);
    const qHex = project('hex', q);
    
    // Tensor product in hex space
    const maxDim = Math.max(pHex.coords.length, qHex.coords.length);
    const coords = new Array(maxDim);
    
    for (let i = 0; i < maxDim; i++) {
        const pi = i < pHex.coords.length ? pHex.coords[i] : 0;
        const qi = i < qHex.coords.length ? qHex.coords[i] : 0;
        coords[i] = (pi + qi) / 2;  // Simple average for now
    }
    
    // Combine expansions
    const expansion = {
        base4: [...p.expansion.base4, ...q.expansion.base4],
        base6: [...p.expansion.base6, ...q.expansion.base6],
        base8: [...p.expansion.base8, ...q.expansion.base8],
        base12: [...p.expansion.base12, ...q.expansion.base12],
        base20: [...p.expansion.base20, ...q.expansion.base20]
    };
    
    // Determine resulting channel (usually hex for compositions)
    const resultChannel = 'hex';
    
    return {
        channel: resultChannel,
        coords,
        expansion,
        timestamp: Math.max(p.timestamp || 0, q.timestamp || 0)
    };
}

// ----------------------------------------
// Unicode Encoding
// ----------------------------------------

/**
 * Encode a code point as a Unicode surrogate pair
 * @param {CodePoint} point
 * @returns {string} - Two-character surrogate pair
 */
export function encodeSurrogate(point) {
    // Map channel to high surrogate base
    const channelBase = {
        binary: 0xD800,
        decimal: 0xD900,
        hex: 0xDA00,
        sign: 0xDB00
    }[point.channel];
    
    // Map first coordinate to offset (0-255)
    const offset = Math.floor(Math.abs(point.coords[0] || 0)) % 256;
    const high = channelBase + offset;
    
    // Analyze expansion to get wave/event
    const [polytope, _] = analyzeExpansion(point.expansion);
    const waveBase = 0xDC00;
    
    // Map polytope to wave range (16-31)
    const waveIndex = {
        tetrahedron: 16,
        octahedron: 17,
        cube: 18,
        icosahedron: 19,
        dodecahedron: 20,
        simplex4: 21,
        tesseract: 22,
        orthoplex4: 23,
        icositetrachoron: 24,
        hexacosichoron: 25,
        hecatonicosachoron: 26
    }[polytope] || 16;
    
    const low = waveBase + ((waveIndex - 16) * 4) + (point.coords.length % 4);
    
    return String.fromCharCode(high) + String.fromCharCode(low);
}

/**
 * Decode a Unicode surrogate pair back to a code point
 * @param {string} pair - Two-character surrogate pair
 * @returns {CodePoint|null}
 */
export function decodeSurrogate(pair) {
    if (pair.length < 2) return null;
    
    const high = pair.charCodeAt(0);
    const low = pair.charCodeAt(1);
    
    // Decode channel
    let channel;
    if (high >= 0xD800 && high < 0xD900) channel = 'binary';
    else if (high >= 0xD900 && high < 0xDA00) channel = 'decimal';
    else if (high >= 0xDA00 && high < 0xDB00) channel = 'hex';
    else if (high >= 0xDB00 && high < 0xDC00) channel = 'sign';
    else return null;
    
    // Decode coordinate
    const coord = [(high - {binary:0xD800, decimal:0xD900, hex:0xDA00, sign:0xDB00}[channel]) % 256];
    
    // Decode wave/polytope
    const waveIndex = 16 + Math.floor((low - 0xDC00) / 4);
    const polytopeMap = {
        16: 'tetrahedron',
        17: 'octahedron',
        18: 'cube',
        19: 'icosahedron',
        20: 'dodecahedron',
        21: 'simplex4',
        22: 'tesseract',
        23: 'orthoplex4',
        24: 'icositetrachoron',
        25: 'hexacosichoron',
        26: 'hecatonicosachoron'
    };
    
    // Reconstruct minimal expansion
    const expansion = {
        base4: waveIndex === 16 ? [1n] : [],
        base6: waveIndex === 17 ? [1n] : [],
        base8: waveIndex === 18 ? [1n] : [],
        base12: waveIndex === 19 ? [1n] : [],
        base20: waveIndex === 20 ? [1n] : []
    };
    
    return {
        channel,
        coords: coord,
        expansion,
        timestamp: Date.now()
    };
}

// ----------------------------------------
// Unleash: Channel Size Expansion
// ----------------------------------------

/**
 * Unleash a channel's full geometric potential
 * @param {Channel} channel
 * @param {number} dimension
 * @returns {Polytope}
 */
export function unleash(channel, dimension) {
    switch (channel) {
        case 'binary':
            if (dimension <= 3) return 'cube';
            if (dimension === 4) return 'tesseract';
            throw new Error('Binary dimensions >4 go through hex');
            
        case 'decimal':
            if (dimension <= 3) return 'tetrahedron';
            if (dimension === 4) return 'simplex4';
            throw new Error('Decimal dimensions >4 go through hex');
            
        case 'hex':
            if (dimension === 4) return 'icositetrachoron';
            if (dimension === 5) return 'hexacosichoron';
            if (dimension === 6) return 'hecatonicosachoron';
            throw new Error('Hex dimensions limited to 4-6');
            
        case 'sign':
            return 'tetrahedron';  // sign is always self-dual
    }
}

// ----------------------------------------
// Utility
// ----------------------------------------

/**
 * Create a rational number as numerator/denominator pair
 * @param {number|bigint} numerator
 * @param {number|bigint} denominator
 * @returns {bigint[]} - [numerator, denominator]
 */
export function rational(numerator, denominator = 1n) {
    return [BigInt(numerator), BigInt(denominator)];
}

/**
 * Create a decimal expansion from an array of numbers
 * @param {Object} params
 * @param {number[]} params.base4 - Tetrahedron values
 * @param {number[]} params.base6 - Octahedron values
 * @param {number[]} params.base8 - Cube values
 * @param {number[]} params.base12 - Icosahedron values
 * @param {number[]} params.base20 - Dodecahedron values
 * @returns {DecimalExpansion}
 */
export function createExpansion({base4 = [], base6 = [], base8 = [], base12 = [], base20 = []}) {
    return {
        base4: base4.map(x => BigInt(Math.floor(x))),
        base6: base6.map(x => BigInt(Math.floor(x))),
        base8: base8.map(x => BigInt(Math.floor(x))),
        base12: base12.map(x => BigInt(Math.floor(x))),
        base20: base20.map(x => BigInt(Math.floor(x)))
    };
}

// ----------------------------------------
// Default Export
// ----------------------------------------

export default {
    analyzeExpansion,
    distance,
    midpoint,
    difference,
    containment,
    project,
    dual,
    compose,
    unleash,
    encodeSurrogate,
    decodeSurrogate,
    createExpansion,
    rational,
    
    // Constants
    tetrahedron,
    octahedron,
    cube,
    icosahedron,
    dodecahedron,
    simplex4,
    tesseract,
    orthoplex4,
    icositetrachoron,
    hexacosichoron,
    hecatonicosachoron
};
```

And here's a simple example of using it:

```javascript
// example.mjs
import * as wfc from './tetragrammatron-4channel.mjs';

// Create a decimal expansion
const expansion = wfc.createExpansion({
    base4: [1, 2, 3],
    base6: [1],
    base8: [2]
});

// Create a code point
const point = {
    channel: 'decimal',
    coords: [1.0, 2.0, 3.0],
    expansion,
    timestamp: Date.now()
};

// Analyze it
const [polytope, coords] = wfc.analyzeExpansion(expansion);
console.log(`Point maps to polytope: ${polytope}`);

// Project to another channel
const hexPoint = wfc.project('hex', point);
console.log('Hex coordinates:', hexPoint.coords);

// Encode as Unicode surrogate pair
const encoded = wfc.encodeSurrogate(point);
console.log('Encoded as:', encoded, 'code points:', encoded.charCodeAt(0).toString(16), encoded.charCodeAt(1).toString(16));

// Decode back
const decoded = wfc.decodeSurrogate(encoded);
console.log('Decoded channel:', decoded.channel);

// Unleash channel size
const unleashed = wfc.unleash('hex', 5);
console.log('Unleashed hex at dimension 5:', unleashed); // hexacosichoron (600-cell)
```

This gives you the complete geometric encoding in a portable JavaScript module that can run anywhere — Node.js, browser, ESP32 with JS runtime, even your light-garden viewer.