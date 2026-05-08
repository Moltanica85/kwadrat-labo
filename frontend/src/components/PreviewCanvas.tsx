import { useEffect, useRef } from "react";

type PreviewCanvasProps = {
  imageSrc?: string;
};

const GRID_SIZE = 128;
const PIXEL_SIZE = 4;

export default function PreviewCanvas({
  imageSrc,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = GRID_SIZE * PIXEL_SIZE;
    canvas.height = GRID_SIZE * PIXEL_SIZE;

    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= GRID_SIZE; x++) {
      ctx.beginPath();
      ctx.moveTo(x * PIXEL_SIZE, 0);
      ctx.lineTo(x * PIXEL_SIZE, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= GRID_SIZE; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * PIXEL_SIZE);
      ctx.lineTo(canvas.width, y * PIXEL_SIZE);
      ctx.stroke();
    }

    if (imageSrc) {
      const img = new Image();

      img.onload = () => {
        ctx.drawImage(
          img,
          0,
          0,
          GRID_SIZE * PIXEL_SIZE,
          GRID_SIZE * PIXEL_SIZE
        );
      };

      img.src = imageSrc;
    }
  }, [imageSrc]);

  return (
    <div
      style={{
        border: "1px solid #444",
        width: GRID_SIZE * PIXEL_SIZE,
        height: GRID_SIZE * PIXEL_SIZE,
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
