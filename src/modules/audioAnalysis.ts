// ---------------------------------------------------------------------------
// Turns the raw FFT byte buffer into the signals the visuals actually use.
//
// The problem with driving visuals straight off getByteFrequencyData() is that
// it reports absolute spectral level. In a loud passage almost every bin pins
// near the top, so everything inflates and just sits there. What reads as
// "changing rapidly" to the eye is *relative* change and *transients*, not the
// absolute level. So per bin we compute two independent things:
//
//   level[]  - the bin auto-gained against its own recent min/max (so subtle
//              wiggles in a loud bin fill the whole range), blended with a touch
//              of absolute loudness so sustained sound never fully disappears.
//   offset[] - a spring-damper "charge" kicked by onsets (positive rate of
//              change) and leaking back to zero. This is the leaky integral of
//              the onset energy and drives the satellite spikes.
//   flash[]  - a fast-decaying onset envelope for the white-hot satellite pop.
// ---------------------------------------------------------------------------

import { config } from "./config";

const N = config.audio.fftSize / 2;

// --- per-bin running state ---
const runMax = new Float32Array(N);
const runMin = new Float32Array(N);
const levelSmooth = new Float32Array(N);
const prevRaw = new Float32Array(N);
const vel = new Float32Array(N);
const offsetState = new Float32Array(N);
const flashState = new Float32Array(N);

// --- public outputs (read by the sphere each frame) ---
export const analysis = {
  level: new Float32Array(N), // 0..1 base-ball drive (loudness + dynamics)
  offset: new Float32Array(N), // satellite radial offset (leaky integral of onsets)
  flash: new Float32Array(N), // 0..1 onset flash
};

// Convert a per-frame "keep fraction" into a frame-rate-independent one.
function keepFor(factor: number, step: number) {
  return Math.pow(factor, step);
}

// Convert a per-frame lerp factor into a frame-rate-independent one.
function lerpFor(factor: number, step: number) {
  return 1 - Math.pow(1 - factor, step);
}

export function updateAnalysis(freqData: Uint8Array, dt: number) {
  const c = config.analysis;

  // Normalise rates to 60fps so a 120Hz display doesn't double every speed.
  const step = Math.min(Math.max(dt * 60, 0.5), 2);
  const attack = lerpFor(c.attack, step);
  const release = lerpFor(c.release, step);
  const maxRelease = lerpFor(c.maxRelease, step);
  const minRelease = lerpFor(c.minRelease, step);
  const frictionKeep = keepFor(c.friction, step);
  const springKeep = keepFor(1 - c.spring, step);
  const flashKeep = keepFor(c.flashDecay, step);

  for (let b = 0; b < N; b++) {
    const raw = freqData[b] / 255;

    // --- adaptive per-bin envelope (fast attack, slow release) ---
    if (raw > runMax[b]) runMax[b] = raw;
    else runMax[b] += (raw - runMax[b]) * maxRelease;
    if (raw < runMin[b]) runMin[b] = raw;
    else runMin[b] += (raw - runMin[b]) * minRelease;

    const range = runMax[b] - runMin[b];

    // Expand the bin's current operating range to full scale. A bin that just
    // hovers near 255 has a tiny range -> gated to 0 (a constant tone should be
    // calm, not big); a bin that wiggles fills 0..1 no matter how loud it is.
    let dyn = 0;
    if (raw >= c.gate && range >= c.minRange) {
      dyn = (raw - runMin[b]) / range;
      if (dyn < 0) dyn = 0;
      else if (dyn > 1) dyn = 1;
    }

    const abs = raw >= c.gate ? raw : 0;
    const target = c.absMix * abs + (1 - c.absMix) * dyn;

    // Asymmetric smoothing: rise quickly, fall gently.
    const k = target > levelSmooth[b] ? attack : release;
    levelSmooth[b] += (target - levelSmooth[b]) * k;
    analysis.level[b] = levelSmooth[b];

    // --- onset (positive rate of change) ---
    const delta = raw - prevRaw[b];
    prevRaw[b] = raw;
    const onset = delta > 0 ? delta : 0;

    // Flash: jump up on an onset, decay away.
    const decayed = flashState[b] * flashKeep;
    const lit = onset * c.flashGain;
    flashState[b] = lit > decayed ? lit : decayed;
    if (flashState[b] > 1) flashState[b] = 1;
    analysis.flash[b] = flashState[b];

    // --- satellite spring-damper, kicked by onsets ---
    vel[b] += onset * c.kick;
    vel[b] *= frictionKeep;
    offsetState[b] += vel[b] * step;
    offsetState[b] *= springKeep; // pull back toward the base ball
    if (offsetState[b] < 0) offsetState[b] = 0;
    if (offsetState[b] > c.offsetMax) {
      offsetState[b] = c.offsetMax;
      if (vel[b] > 0) vel[b] = 0;
    }
    analysis.offset[b] = offsetState[b];
  }
}
