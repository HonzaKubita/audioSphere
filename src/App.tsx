import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import { Button } from "./components/ui/button";
import { init } from "./modules/main";
import { useCanvasResize } from "./hooks/useCanvasResize";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useCanvasResize(canvasRef);

  // Keep our state in sync with the real fullscreen status so the native Esc
  // exit (and any other trigger) flips the UI back too.
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const start = () => {
    if (!canvasRef.current) return;
    init(canvasRef.current);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <>
      <canvas ref={canvasRef} className="w-screen h-screen" />

      {!isFullscreen && (
        <div className="flex items-center justify-center absolute bottom-5 w-full">
          <Button variant={"outline"} onClick={start}>
            Select Source
          </Button>
        </div>
      )}

      <Button
        variant={"outline"}
        size="icon"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className="absolute bottom-5 right-5"
      >
        {isFullscreen ? <Minimize /> : <Maximize />}
      </Button>
    </>
  );
}
