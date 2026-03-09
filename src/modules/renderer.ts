import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import AudioSphere from "./sphere";
import { freqDataBuffer } from "./audio";

let sphere: AudioSphere;
let controls: OrbitControls;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;

export function initRender(canvas: HTMLCanvasElement) {
  // Init
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Camera rotation
  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.enableZoom = true;

  controls.target = new THREE.Vector3(0, 7, 0);

  // Resizing renderer on window resize
  addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  // Position the camera (initial)
  camera.position.z = 35;
  camera.position.y = 8;

  // Create the audio sphere
  sphere = new AudioSphere(10, 35, 30);
  sphere.addToScene(scene);
}

export function renderUpdate() {
  // Update the audio sphere
  sphere.update(freqDataBuffer);

  // Update camera controller
  controls.update();

  // Render the scene
  renderer.render(scene, camera);
}
