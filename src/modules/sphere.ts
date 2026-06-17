import * as THREE from "three";
import { config } from "./config";
import { analysis } from "./audioAnalysis";

// Reused scratch objects so the per-frame loop allocates nothing.
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _color = new THREE.Color();

export default class AudioSphere {
  // Two instanced layers sharing one ball geometry:
  //   baseMesh - the sphere of dots, driven by the blended level signal
  //   satMesh  - satellites that spike outward from each dot on transients
  baseMesh: THREE.InstancedMesh;
  satMesh: THREE.InstancedMesh;

  count: number;
  private dirs: Float32Array; // unit radial direction per instance (3 floats each)
  private binLo: Int32Array; // lower bin bracketing each instance
  private binHi: Int32Array; // upper bin bracketing each instance
  private binT: Float32Array; // 0..1 blend weight between binLo and binHi
  private hue: Float32Array; // 0..1 base hue per instance (frequency mapped)
  private radius: number;
  private hueShift = 0;

  constructor() {
    const { radius, ballCount, ballDetail } = config.sphere;
    this.radius = radius;
    this.count = Math.max(1, ballCount);

    this.dirs = new Float32Array(this.count * 3);
    this.binLo = new Int32Array(this.count);
    this.binHi = new Int32Array(this.count);
    this.binT = new Float32Array(this.count);
    this.hue = new Float32Array(this.count);

    // Spread `binCount` bins across all the balls -> the ball count is purely
    // resolution; the whole chosen spectrum is always mapped.
    const bins = config.audio.fftSize / 2;
    const binOffset = config.audio.binOffset;
    const binCount = Math.max(
      1,
      Math.min(config.audio.binCount, bins - binOffset),
    );
    const denom = Math.max(1, this.count - 1);

    // Golden-angle (Fibonacci) spiral: distributes the balls evenly over the
    // sphere so every frequency gets the same density of balls -> no polar
    // cramming, the highs keep their detail. Frequency runs along the spiral
    // index, which still reads as a smooth spatial gradient because a point's
    // nearest neighbours sit a Fibonacci number of steps away (a tiny bin gap).
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let k = 0; k < this.count; k++) {
      // z marches from near +1 (top) to near -1 (bottom); r is the ring radius.
      const z = 1 - (2 * k + 1) / this.count;
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      const phi = k * goldenAngle;
      this.dirs[k * 3] = Math.cos(phi) * r;
      this.dirs[k * 3 + 1] = z;
      this.dirs[k * 3 + 2] = Math.sin(phi) * r;

      // Each ball lands *between* two real bins and stores that pair plus a
      // blend weight, so the rendered surface ramps smoothly between gains.
      const frac = k / denom;
      const fpos = frac * (binCount - 1); // fractional bin position
      const i0 = Math.min(Math.floor(fpos), binCount - 1);
      const i1 = Math.min(i0 + 1, binCount - 1);
      this.binLo[k] = binOffset + i0;
      this.binHi[k] = binOffset + i1;
      this.binT[k] = fpos - i0;
      this.hue[k] = frac; // 0..1 low -> high freq
    }

    // Unit ball, scaled per instance.
    const ballGeo = new THREE.SphereGeometry(0.4, ballDetail, ballDetail);
    const satGeo = new THREE.SphereGeometry(0.2, ballDetail, ballDetail);

    const baseMat = new THREE.MeshBasicMaterial({ toneMapped: false });
    // Satellites are pure light: additive so overlaps brighten and feed the bloom.
    const satMat = new THREE.MeshBasicMaterial({
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.baseMesh = new THREE.InstancedMesh(ballGeo, baseMat, this.count);
    this.satMesh = new THREE.InstancedMesh(satGeo, satMat, this.count);
    this.baseMesh.frustumCulled = false;
    this.satMesh.frustumCulled = false;

    // Touch every instance once so the matrix/color buffers are allocated.
    for (let k = 0; k < this.count; k++) {
      this.baseMesh.setColorAt(k, _color.setRGB(0, 0, 0));
      this.satMesh.setColorAt(k, _color.setRGB(0, 0, 0));
    }
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.baseMesh, this.satMesh);
  }

  update(dt: number) {
    const cb = config.baseBall;
    const cs = config.satellite;
    const cc = config.color;

    this.hueShift = (this.hueShift + cc.hueDrift * dt) % 1;

    for (let k = 0; k < this.count; k++) {
      // Interpolate each signal between the two bins this ball sits between.
      const lo = this.binLo[k];
      const hi = this.binHi[k];
      const t = this.binT[k];
      const level =
        analysis.level[lo] + (analysis.level[hi] - analysis.level[lo]) * t;
      const off =
        analysis.offset[lo] + (analysis.offset[hi] - analysis.offset[lo]) * t;
      const flash =
        analysis.flash[lo] + (analysis.flash[hi] - analysis.flash[lo]) * t;

      const dx = this.dirs[k * 3];
      const dy = this.dirs[k * 3 + 1];
      const dz = this.dirs[k * 3 + 2];

      let h = cc.hueStart - this.hue[k] * cc.hueRange + this.hueShift;
      h -= Math.floor(h); // wrap into 0..1

      // --- base ball: sits on the (expanded) sphere surface ---
      const baseR = this.radius * (1 + level * cb.move);
      const bx = dx * baseR;
      const by = dy * baseR;
      const bz = dz * baseR;
      const baseSize = cb.minSize + level * cb.sizeGain;

      _p.set(bx, by, bz);
      _s.set(baseSize, baseSize, baseSize);
      _m.compose(_p, _q, _s);
      this.baseMesh.setMatrixAt(k, _m);

      _color.setHSL(h, cb.saturation, cb.minLight + level * cb.lightGain);
      this.baseMesh.setColorAt(k, _color);

      // --- satellite: starts at the base ball, spikes further outward ---
      const offW = off * cs.offsetScale;
      const satSize =
        cs.minSize + off * cs.offsetSizeGain + flash * cs.flashSizeGain;

      _p.set(bx + dx * offW, by + dy * offW, bz + dz * offW);
      _s.set(satSize, satSize, satSize);
      _m.compose(_p, _q, _s);
      this.satMesh.setMatrixAt(k, _m);

      const satLight = Math.min(
        1,
        cs.minLight + off * cs.lightGain + flash * cs.flashLight,
      );
      const satSat = Math.max(0, cs.saturation - flash * cs.flashDesat);
      _color.setHSL(h, satSat, satLight);
      this.satMesh.setColorAt(k, _color);
    }

    this.baseMesh.instanceMatrix.needsUpdate = true;
    this.satMesh.instanceMatrix.needsUpdate = true;
    if (this.baseMesh.instanceColor)
      this.baseMesh.instanceColor.needsUpdate = true;
    if (this.satMesh.instanceColor)
      this.satMesh.instanceColor.needsUpdate = true;
  }
}
