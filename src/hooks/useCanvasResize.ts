import { useEffect, type RefObject } from "react";

export function useCanvasResize(
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  const handleResize = (canvas: HTMLCanvasElement) => {
    if (canvas) {
      const parent = canvas.parentElement;
      if (parent) {
        const width = parent.clientWidth;
        const height = parent.clientHeight;

        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle window resize
    const handleWindowResize = () => {
      handleResize(canvas);
    };

    handleWindowResize();

    window.addEventListener("resize", handleWindowResize);

    // Clean up on unmount
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  });
}
