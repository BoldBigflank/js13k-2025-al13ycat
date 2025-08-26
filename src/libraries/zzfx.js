/**
 * ZzFX - A tiny JavaScript sound effect library
 * Converted to ES module format
 */

// Module-scoped variables (previously global)
const zzfxV = 0.3; // global volume
const zzfxR = 44100; // global sample rate
const zzfxX = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Generate sound samples
 * @param {number} q - Volume
 * @param {number} k - Frequency variation
 * @param {number} c - Base frequency
 * @param {number} e - Attack time
 * @param {number} t - Decay time
 * @param {number} u - Sustain time
 * @param {number} r - Waveform type
 * @param {number} F - Distortion
 * @param {number} v - Frequency slide
 * @param {number} z - Frequency slide delta
 * @param {number} w - Frequency slide delta 2
 * @param {number} A - Frequency slide delta 3
 * @param {number} l - Loop length
 * @param {number} B - Loop frequency slide
 * @param {number} x - Loop frequency slide delta
 * @param {number} G - Loop frequency slide delta 2
 * @param {number} d - Delay
 * @param {number} y - Sustain level
 * @param {number} m - Sustain time 2
 * @param {number} C - Sustain level 2
 * @returns {Array<number>} Array of sample data
 */
const zzfxG = (
  q = 1,
  k = 0.05,
  c = 220,
  e = 0,
  t = 0,
  u = 0.1,
  r = 0,
  F = 1,
  v = 0,
  z = 0,
  w = 0,
  A = 0,
  l = 0,
  B = 0,
  x = 0,
  G = 0,
  d = 0,
  y = 1,
  m = 0,
  C = 0,
) => {
  let b = 2 * Math.PI;
  let H = (v *= (500 * b) / zzfxR ** 2);
  let I = ((0 < x ? 1 : -1) * b) / 4;
  let D = (c *= ((1 + 2 * k * Math.random() - k) * b) / zzfxR);
  let Z = [];
  let g = 0;
  let E = 0;
  let a = 0;
  let n = 1;
  let J = 0;
  let K = 0;
  let f = 0;
  let p, h;

  e = 99 + zzfxR * e;
  m *= zzfxR;
  t *= zzfxR;
  u *= zzfxR;
  d *= zzfxR;
  z *= (500 * b) / zzfxR ** 3;
  x *= b / zzfxR;
  w *= b / zzfxR;
  A *= zzfxR;
  l = (zzfxR * l) | 0;

  for (h = (e + m + t + u + d) | 0; a < h; Z[a++] = f) {
    ++K % ((100 * G) | 0) ||
      ((f = r
        ? 1 < r
          ? 2 < r
            ? 3 < r
              ? Math.sin((g % b) ** 3)
              : Math.max(Math.min(Math.tan(g), 1), -1)
            : 1 - (((((2 * g) / b) % 2) + 2) % 2)
          : 1 - 4 * Math.abs(Math.round(g / b) - g / b)
        : Math.sin(g)),
      (f =
        (l ? 1 - C + C * Math.sin((2 * Math.PI * a) / l) : 1) *
        (0 < f ? 1 : -1) *
        Math.abs(f) ** F *
        q *
        zzfxV *
        (a < e
          ? a / e
          : a < e + m
            ? 1 - ((a - e) / m) * (1 - y)
            : a < e + m + t
              ? y
              : a < h - d
                ? ((h - a - d) / u) * y
                : 0)),
      (f = d
        ? f / 2 +
          (d > a ? 0 : ((a < h - d ? 1 : (h - a) / d) * Z[(a - d) | 0]) / 2)
        : f));
    p = (c += v += z) * Math.sin(E * x - I);
    g += p - p * B * (1 - ((1e9 * (Math.sin(a) + 1)) % 2));
    E += p - p * B * (1 - ((1e9 * (Math.sin(a) ** 2 + 1)) % 2));
    n && ++n > A && ((c += w), (D += w), (n = 0));
    !l || ++J % l || ((c = D), (v = H), (n = n || 1));
  }

  return Z;
};

/**
 * Play sound samples
 * @param {...Array<number>} t - Array of sample data
 * @returns {AudioBufferSourceNode} Audio buffer source node
 */
const zzfxP = (...t) => {
  let e = zzfxX.createBufferSource();
  let f = zzfxX.createBuffer(t.length, t[0].length, zzfxR);
  t.map((d, i) => f.getChannelData(i).set(d));
  e.buffer = f;
  e.connect(zzfxX.destination);
  e.start();
  return e;
};

/**
 * Main entry point - generates and plays sound
 * @param {...any} t - Sound parameters
 * @returns {AudioBufferSourceNode} Audio buffer source node
 */
const zzfx = (...t) => zzfxP(zzfxG(...t));
// Export all functions and constants
export { zzfx, zzfxG, zzfxP, zzfxV, zzfxR, zzfxX };

// Default export for convenience
export default zzfx;
