import { useRef } from "react";
import { Button } from "./components/ui/button";
import { init } from "./modules/main";
import { useCanvasResize } from "./hooks/useCanvasResize";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCanvasResize(canvasRef);

  const start = () => {
    if (!canvasRef.current) return;
    init(canvasRef.current);
  };

  return (
    <>
      <canvas ref={canvasRef} className="w-screen h-screen" />

      <div className="flex items-center justify-center absolute bottom-5 w-full">
        <Button variant={"outline"} onClick={start}>
          Select Source
        </Button>
      </div>
    </>
  );
}
