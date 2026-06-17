import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import AudioSphere from "./sphere";
import { freqDataBuffer } from "./audio";
import { updateAnalysis } from "./audioAnalysis";
import { config } from "./config";

let sphere: AudioSphere;
let controls: OrbitControls;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let clock: THREE.Clock;

export function initRender(canvas: HTMLCanvasElement) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(config.background);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 35;
  camera.position.y = 8;

  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Camera rotation
  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.enableZoom = true;
  controls.target = new THREE.Vector3(0, 7, 0);

  // Post-processing: bloom gives everything its glow, OutputPass handles the
  // tone mapping / sRGB conversion now that we render through a composer.
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    config.bloom.strength,
    config.bloom.radius,
    config.bloom.threshold,
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Resizing renderer on window resize
  addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    bloom.setSize(width, height);
  });

  // Create the audio sphere
  sphere = new AudioSphere();
  sphere.addToScene(scene);

  clock = new THREE.Clock();
}

export function renderUpdate() {
  const dt = clock.getDelta();

  // Process the latest FFT frame into the signals the sphere consumes.
  updateAnalysis(freqDataBuffer, dt);

  // Update the audio sphere
  sphere.update(dt);

  // Update camera controller
  controls.update();

  // Render the scene (through the bloom composer)
  composer.render();
}
