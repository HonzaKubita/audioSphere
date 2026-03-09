import { initAudio, updateAudio } from "./audio";
import { initRender, renderUpdate } from "./renderer";

function loop() {
  updateAudio();
  renderUpdate();
  requestAnimationFrame(loop);
}

export async function init(canvas: HTMLCanvasElement) {
  initRender(canvas);
  initAudio();

  requestAnimationFrame(loop);
}
