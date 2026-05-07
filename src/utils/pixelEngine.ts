import { v4 as uuidv4 } from 'uuid';
import type { Color, Pixel, Frame, Layer, SpriteProject, CanvasSize } from '../types';

// ===== COLOR UTILS =====
export const colorToHex = (c: Color): string => {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
};

export const colorToRgba = (c: Color): string =>
  `rgba(${c.r},${c.g},${c.b},${c.a})`;

export const hexToColor = (hex: string, a = 1): Color => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
    a,
  };
};

export const TRANSPARENT: Color = { r: 0, g: 0, b: 0, a: 0 };
export const BLACK: Color = { r: 0, g: 0, b: 0, a: 1 };
export const WHITE: Color = { r: 255, g: 255, b: 255, a: 1 };

// ===== FRAME / LAYER CREATION =====
export const createEmptyFrame = (duration = 100): Frame => ({
  id: uuidv4(),
  pixels: [],
  duration,
});

export const createLayer = (name: string): Layer => ({
  id: uuidv4(),
  name,
  visible: true,
  locked: false,
  opacity: 1,
  frames: [createEmptyFrame()],
});

export const createProject = (
  name: string,
  width: CanvasSize = 32,
  height: CanvasSize = 32
): SpriteProject => {
  const layer = createLayer('Layer 1');
  return {
    id: uuidv4(),
    name,
    width,
    height,
    layers: [layer],
    activeLayerId: layer.id,
    activeFrameIndex: 0,
    fps: 12,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

// ===== PIXEL MANIPULATION =====
export const setPixel = (frame: Frame, x: number, y: number, color: Color): Frame => {
  const filtered = frame.pixels.filter((p) => !(p.x === x && p.y === y));
  if (color.a > 0) {
    filtered.push({ x, y, color });
  }
  return { ...frame, pixels: filtered };
};

export const getPixel = (frame: Frame, x: number, y: number): Color | null => {
  const p = frame.pixels.find((p) => p.x === x && p.y === y);
  return p ? p.color : null;
};

export const clearFrame = (frame: Frame): Frame => ({
  ...frame,
  pixels: [],
});

// ===== DRAWING ALGORITHMS =====
export const drawLine = (
  x0: number, y0: number, x1: number, y1: number
): [number, number][] => {
  const points: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0, cy = y0;

  while (true) {
    points.push([cx, cy]);
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
  return points;
};

export const drawRect = (
  x0: number, y0: number, x1: number, y1: number
): [number, number][] => {
  const points: [number, number][] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  for (let x = minX; x <= maxX; x++) {
    points.push([x, minY], [x, maxY]);
  }
  for (let y = minY + 1; y < maxY; y++) {
    points.push([minX, y], [maxX, y]);
  }
  return points;
};

export const drawCircle = (
  cx: number, cy: number, r: number
): [number, number][] => {
  const points: [number, number][] = [];
  let x = r, y = 0, d = 1 - r;
  const plot = (px: number, py: number) => points.push([px, py]);

  while (x >= y) {
    plot(cx + x, cy + y); plot(cx - x, cy + y);
    plot(cx + x, cy - y); plot(cx - x, cy - y);
    plot(cx + y, cy + x); plot(cx - y, cy + x);
    plot(cx + y, cy - x); plot(cx - y, cy - x);
    y++;
    if (d <= 0) {
      d += 2 * y + 1;
    } else {
      x--;
      d += 2 * (y - x) + 1;
    }
  }
  return points;
};

export const floodFill = (
  frame: Frame,
  startX: number,
  startY: number,
  fillColor: Color,
  width: number,
  height: number
): Pixel[] => {
  const targetColor = getPixel(frame, startX, startY);
  const colorsMatch = (a: Color | null, b: Color | null): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
  };

  if (colorsMatch(targetColor, fillColor)) return frame.pixels;

  const visited = new Set<string>();
  const stack: [number, number][] = [[startX, startY]];
  const newPixels = frame.pixels.filter(
    (p) => !colorsMatch(getPixel(frame, p.x, p.y), targetColor)
  );

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const currentColor = getPixel(frame, x, y);
    if (!colorsMatch(currentColor, targetColor)) continue;

    visited.add(key);
    newPixels.push({ x, y, color: fillColor });

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return newPixels;
};

// ===== FRAME TO IMAGEDATA =====
export const frameToImageData = (
  frame: Frame,
  width: number,
  height: number,
  bgColor?: Color
): ImageData => {
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill bg
  if (bgColor) {
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = bgColor.r;
      data[i * 4 + 1] = bgColor.g;
      data[i * 4 + 2] = bgColor.b;
      data[i * 4 + 3] = Math.round(bgColor.a * 255);
    }
  }

  for (const pixel of frame.pixels) {
    if (pixel.x >= 0 && pixel.x < width && pixel.y >= 0 && pixel.y < height) {
      const idx = (pixel.y * width + pixel.x) * 4;
      data[idx] = pixel.color.r;
      data[idx + 1] = pixel.color.g;
      data[idx + 2] = pixel.color.b;
      data[idx + 3] = Math.round(pixel.color.a * 255);
    }
  }

  return new ImageData(data, width, height);
};

// ===== MERGE LAYERS =====
export const mergeLayerFrames = (
  layers: Layer[],
  frameIndex: number,
  width: number,
  height: number
): ImageData => {
  const merged = new Uint8ClampedArray(width * height * 4);

  for (const layer of layers) {
    if (!layer.visible) continue;
    const frame = layer.frames[Math.min(frameIndex, layer.frames.length - 1)];
    if (!frame) continue;

    for (const pixel of frame.pixels) {
      if (pixel.x >= 0 && pixel.x < width && pixel.y >= 0 && pixel.y < height) {
        const idx = (pixel.y * width + pixel.x) * 4;
        const a = pixel.color.a * layer.opacity;
        const srcA = a;
        const dstA = merged[idx + 3] / 255;
        const outA = srcA + dstA * (1 - srcA);

        if (outA > 0) {
          merged[idx] = (pixel.color.r * srcA + merged[idx] * dstA * (1 - srcA)) / outA;
          merged[idx + 1] = (pixel.color.g * srcA + merged[idx + 1] * dstA * (1 - srcA)) / outA;
          merged[idx + 2] = (pixel.color.b * srcA + merged[idx + 2] * dstA * (1 - srcA)) / outA;
          merged[idx + 3] = Math.round(outA * 255);
        }
      }
    }
  }

  return new ImageData(merged, width, height);
};
