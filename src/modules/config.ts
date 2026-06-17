// ---------------------------------------------------------------------------
// Central tuning dashboard for the visualizer.
//
// Everything that affects how the sphere looks and reacts lives here so it can
// be tweaked in one place. Values are commented with their range / intent.
// ---------------------------------------------------------------------------

export const config = {
  audio: {
    fftSize: 2048, // FFT window -> fftSize/2 frequency bins
    smoothing: 0.65, // AnalyserNode built-in smoothing (0..1). Lower = snappier onsets.
    binOffset: 20, // skip the lowest bins; bass clips to the ceiling and clutters the top
    // How many FFT bins (starting at binOffset) are spread across the whole
    // sphere. This is independent of the segment counts: the segments are just
    // spatial resolution, while this is how much of the spectrum is shown.
    // Capped to the available bins (fftSize/2 - binOffset). Music has little
    // energy in the top half, so ~half the spectrum reads best.
    binCount: 512,
  },

  // Per-bin signal processing. This is what fixes "loud = big static blob":
  // instead of reacting to the absolute level, each frequency is auto-gained
  // against its own recent min/max so relative wiggles always fill the range,
  // and a separate onset (rate-of-change) signal drives the satellites.
  analysis: {
    gate: 0.06, // absolute noise gate (raw 0..1 below this counts as silence)
    maxRelease: 0.05, // how fast the running per-bin MAX decays back down toward current
    minRelease: 0.03, // how fast the running per-bin MIN drifts back up toward current
    minRange: 0.06, // bins whose dynamic range is smaller than this are treated as static
    absMix: 0.35, // base level = absMix*absolute + (1-absMix)*dynamic. Higher = more raw loudness.
    attack: 0.6, // base level smoothing when rising (snappy)
    release: 0.12, // base level smoothing when falling (slower, so it breathes)

    // Satellite spring-damper, kicked by onsets. The outward offset is a leaky
    // integral of the onset energy: it accumulates on rapid hits, then relaxes.
    kick: 0.9, // how hard an onset throws a satellite outward
    friction: 0.82, // velocity damping per frame (0..1, higher = floatier)
    spring: 0.1, // pull-back toward the base ball per frame (higher = snappier return)
    offsetMax: 1.2, // clamp on the accumulated offset (before offsetScale)
    flashGain: 3.0, // onset -> flash brightness multiplier
    flashDecay: 0.9, // flash fade kept per frame (0..1)
  },

  sphere: {
    radius: 10,
    widthSegments: 150,
    heightSegments: 150,
    ballDetail: 8, // poly count of each little ball (shared geometry, so cheap)
  },

  // The original sphere of dots. Driven by the blended level signal.
  baseBall: {
    minSize: 0, // size at rest
    sizeGain: 0.6, // size = minSize + level*sizeGain
    move: 0.85, // radial push: radius * (1 + level*move)
    minLight: 0.16, // HSL lightness at rest (dim, so silence is calm)
    lightGain: 0.5, // lightness = minLight + level*lightGain
    saturation: 0.7,
  },

  // The new layer: each satellite starts inside its base ball and spikes outward
  // on transients, flashing white-hot. This carries the "rapid change" energy.
  satellite: {
    minSize: 0, // tiny at rest, hidden inside the base ball
    offsetSizeGain: 0.4, // grows with sustained outward offset
    flashSizeGain: 0.7, // pops on an onset flash
    offsetScale: 6.0, // world units the offset maps to (spike length)
    minLight: 0.15,
    lightGain: 0.35, // brightness from sustained offset
    flashLight: 0.55, // extra brightness on a flash
    saturation: 0.9,
    flashDesat: 0.6, // how white-hot it goes on a flash (subtracted from saturation)
  },

  color: {
    hueStart: 0.95, // hue of the lowest band (0..1; 0.95 ~ pink/magenta)
    hueRange: 0.45, // hue spread toward the highest band (subtracted; ends ~0.5 cyan)
    hueDrift: 0.012, // slow global hue rotation per second (0 = off)
  },

  // Post-processing glow.
  bloom: {
    strength: 0.1,
    radius: 0.2,
    threshold: 0.2, // luminance above which things bloom
  },

  background: 0x05060a, // near-black with a hint of blue
};
