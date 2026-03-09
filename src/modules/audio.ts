const audioContext = new AudioContext();

const analyserNode = audioContext.createAnalyser();
analyserNode.fftSize = 2048;

const freqDataBufferLength = analyserNode.frequencyBinCount;
export const freqDataBuffer = new Uint8Array(freqDataBufferLength);

export async function initAudio() {
  await audioContext.resume();

  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true,
  });

  stream.getVideoTracks().forEach((t) => t.stop());

  const audioTracks = stream.getAudioTracks();

  if (audioTracks.length < 1) {
    console.error("No audio track provided");
    return;
  }

  const audio1 = audioTracks[0];

  const audioStream = new MediaStream();
  audioStream.addTrack(audio1);

  const sourceNode = audioContext.createMediaStreamSource(audioStream);

  sourceNode.connect(analyserNode);
}

export function updateAudio() {
  analyserNode.getByteFrequencyData(freqDataBuffer);
}
