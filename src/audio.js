// create a new audio context
let audioContext = null;
let isAudioContextInitialized = false;

function initAudioContext() {
  if (!isAudioContextInitialized) {
    // create a new audio context
    audioContext = new AudioContext();
    isAudioContextInitialized = true;
  }
}

// create an analyser node to perform the FFT
let analyserNode = null;

function createAnalyserNode() {
  // create an analyser node to perform the FFT
  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;
}

// create a buffer to hold the frequency data
let bufferLength = null;
let frequencyData = null;

function createFrequencyBuffer() {
  // create a buffer to hold the frequency data
  bufferLength = analyserNode.frequencyBinCount;
  frequencyData = new Uint8Array(bufferLength);
}

// define a function to start playing the audio file
async function startAudio(file) {
  // load the audio file
  let audioElement = new Audio(file);

  // create a source node from the audio element
  let sourceNode = audioContext.createMediaElementSource(audioElement);

  // connect the source node to the analyser node
  sourceNode.connect(analyserNode);

  // connect the analyser node to the output node
  analyserNode.connect(audioContext.destination);

  // start playing the audio file
  audioElement.play();

  // start the update loop
  requestAnimationFrame(audioUpdate);
}

// define a function to perform the FFT and update the frequency data
export function audioUpdate() {
  analyserNode.getByteFrequencyData(frequencyData);
  
  return frequencyData;
}

// add a click event listener to the button
export function audioInit(file) {
  initAudioContext();
  createAnalyserNode();
  createFrequencyBuffer();
  startAudio(file);
}