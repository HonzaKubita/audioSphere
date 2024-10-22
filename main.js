import { audioInit, audioUpdate } from './src/audio.js';
import { renderUpdate } from './src/render.js';


function loop() {
  let freqData = audioUpdate();
  renderUpdate(freqData);
  
  requestAnimationFrame(loop);
}

function init(file) {
  console.log("Uploading file");

  if (!file) return;

  let fileBlob = URL.createObjectURL(file);

  document.getElementById("upload").style.display = "none";

  audioInit(fileBlob);
  requestAnimationFrame(loop);
}

// Uploading the file is the trigger to start

// Drag and Drop upload
document.getElementById("upload").addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  init(file);
});

// Manual upload
document.getElementById("file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  init(file);
});

let fullscreen = false;

const fullscreenButton = document.getElementById("fullscreen-button");

// Fullscreen button
fullscreenButton.addEventListener("click", () => {
  if (fullscreen) {
    document.exitFullscreen();
    fullscreenButton.src = "icons/fullscreen_enter.svg";
    fullscreen = false;
  } else {
    document.documentElement.requestFullscreen();
    fullscreenButton.src = "icons/fullscreen_exit.svg";
    fullscreen = true;
  }
});