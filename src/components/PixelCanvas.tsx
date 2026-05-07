import { useRef, useEffect, useCallback, useState } from 'react';
import type { Frame, Tool, Color } from '../types';
import {
  setPixel,
  floodFill,
  getPixel,
  drawLine,
  drawRect,
  drawCircle,
  mergeLayerFrames,
} from '../utils/pixelEngine';

interface Props {
  frame: Frame;
  width: number;
  height: number;
  tool: Tool;
  color: Color;
  zoom: number;
  mirror: boolean;
  layers: { id: string; name: string; visible: boolean; locked: boolean; opacity: number; frames: Frame[] }[];
  activeLayerId: string;
  frameIndex: number;
  onFrameChange: (frame: Frame) => void;
  onColorPick?: (color: Color) => void;
  showGrid: boolean;
  onionSkin: boolean;
  onionFrame?: Frame;
}

export default function PixelCanvas({
  frame,
  width,
  height,
  tool,
  color,
  zoom,
  mirror,
  layers,
  frameIndex,
  onFrameChange,
  onColorPick,
  showGrid,
  onionSkin,
  onionFrame,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<[number, number] | null>(null);
  const [lastPos, setLastPos] = useState<[number, number] | null>(null);

  const pixelSize = zoom;
  const canvasWidth = width * pixelSize;
  const canvasHeight = height * pixelSize;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Clear
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Checkerboard background
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#2a2a3e' : '#232336';
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    // Onion skin
    if (onionSkin && onionFrame) {
      ctx.globalAlpha = 0.25;
      for (const pixel of onionFrame.pixels) {
        ctx.fillStyle = `rgba(${pixel.color.r},${pixel.color.g},${pixel.color.b},${pixel.color.a})`;
        ctx.fillRect(pixel.x * pixelSize, pixel.y * pixelSize, pixelSize, pixelSize);
      }
      ctx.globalAlpha = 1;
    }

    // Render merged layers
    const merged = mergeLayerFrames(layers, frameIndex, width, height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(merged, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, canvasWidth, canvasHeight);

    // Grid
    if (showGrid && pixelSize >= 4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize, 0);
        ctx.lineTo(x * pixelSize, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize);
        ctx.lineTo(canvasWidth, y * pixelSize);
        ctx.stroke();
      }
    }
  }, [frame, width, height, pixelSize, canvasWidth, canvasHeight, layers, frameIndex, showGrid, onionSkin, onionFrame]);

  useEffect(() => {
    render();
  }, [render]);

  const getGridPos = (e: React.MouseEvent): [number, number] => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    return [Math.max(0, Math.min(width - 1, x)), Math.max(0, Math.min(height - 1, y))];
  };

  const applyPixel = (f: Frame, x: number, y: number): Frame => {
    let newFrame = f;
    if (tool === 'pencil') {
      newFrame = setPixel(newFrame, x, y, color);
      if (mirror) {
        const mx = width - 1 - x;
        newFrame = setPixel(newFrame, mx, y, color);
      }
    } else if (tool === 'eraser') {
      newFrame = setPixel(newFrame, x, y, { r: 0, g: 0, b: 0, a: 0 });
      if (mirror) {
        newFrame = setPixel(newFrame, width - 1 - x, y, { r: 0, g: 0, b: 0, a: 0 });
      }
    }
    return newFrame;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const [x, y] = getGridPos(e);
    setIsDrawing(true);
    setStartPos([x, y]);
    setLastPos([x, y]);

    if (tool === 'pencil' || tool === 'eraser') {
      onFrameChange(applyPixel(frame, x, y));
    } else if (tool === 'bucket') {
      const newPixels = floodFill(frame, x, y, color, width, height);
      onFrameChange({ ...frame, pixels: newPixels });
    } else if (tool === 'eyedropper') {
      const c = getPixel(frame, x, y);
      if (c && onColorPick) onColorPick(c);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const [x, y] = getGridPos(e);

    if ((tool === 'pencil' || tool === 'eraser') && lastPos) {
      const points = drawLine(lastPos[0], lastPos[1], x, y);
      let newFrame = frame;
      for (const [px, py] of points) {
        newFrame = applyPixel(newFrame, px, py);
      }
      onFrameChange(newFrame);
      setLastPos([x, y]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPos) {
      setIsDrawing(false);
      return;
    }

    const [x, y] = getGridPos(e);

    if (tool === 'line') {
      const points = drawLine(startPos[0], startPos[1], x, y);
      let newFrame = frame;
      for (const [px, py] of points) {
        newFrame = setPixel(newFrame, px, py, color);
      }
      onFrameChange(newFrame);
    } else if (tool === 'rect') {
      const points = drawRect(startPos[0], startPos[1], x, y);
      let newFrame = frame;
      for (const [px, py] of points) {
        newFrame = setPixel(newFrame, px, py, color);
      }
      onFrameChange(newFrame);
    } else if (tool === 'circle') {
      const r = Math.round(
        Math.sqrt(Math.pow(x - startPos[0], 2) + Math.pow(y - startPos[1], 2))
      );
      const points = drawCircle(startPos[0], startPos[1], r);
      let newFrame = frame;
      for (const [px, py] of points) {
        if (px >= 0 && px < width && py >= 0 && py < height) {
          newFrame = setPixel(newFrame, px, py, color);
        }
      }
      onFrameChange(newFrame);
    }

    setIsDrawing(false);
    setStartPos(null);
    setLastPos(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="cursor-crosshair border border-gray-700 rounded"
      style={{ imageRendering: 'pixelated' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDrawing(false);
        setStartPos(null);
        setLastPos(null);
      }}
    />
  );
}
