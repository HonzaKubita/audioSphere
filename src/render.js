import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import AudioSphere from './models/audioSphere';

// Init
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera rotation
let controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.enableZoom = true;

controls.target = new THREE.Vector3(0, 7, 0);

// Resizing renderer on window resize
addEventListener("resize", (event) => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize( width, height );
});

// Position the camera (initial)
camera.position.z = 35;
camera.position.y = 8;

// Create the audio sphere
const audioSphere = new AudioSphere(10, 35, 30);
audioSphere.addToScene(scene);

export function renderUpdate(freqData) {
  // Update the audio sphere
  audioSphere.update(freqData);

  // Update camera controller
  controls.update();

  // Render the scene
  renderer.render( scene, camera );
}