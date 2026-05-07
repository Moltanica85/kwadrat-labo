import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { SpriteProject, ExportOptions, Layer } from '../types';
import { mergeLayerFrames } from './pixelEngine';

// ===== RENDER FRAME TO CANVAS =====
const renderFrameToCanvas = (
  layers: Layer[],
  frameIndex: number,
  width: number,
  height: number,
  scale: number
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const imageData = mergeLayerFrames(layers, frameIndex, width, height);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(imageData, 0, 0);

  ctx.drawImage(tempCanvas, 0, 0, width * scale, height * scale);
  return canvas;
};

// ===== EXPORT SINGLE PNG =====
export const exportSinglePNG = (
  project: SpriteProject,
  frameIndex: number,
  scale: number
): void => {
  const canvas = renderFrameToCanvas(
    project.layers, frameIndex, project.width, project.height, scale
  );
  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, `${project.name}_frame${frameIndex}.png`);
  });
};

// ===== EXPORT ALL FRAMES AS PNG ZIP =====
export const exportAllFramesPNG = async (
  project: SpriteProject,
  scale: number
): Promise<void> => {
  const zip = new JSZip();
  const maxFrames = Math.max(...project.layers.map((l) => l.frames.length));

  for (let i = 0; i < maxFrames; i++) {
    const canvas = renderFrameToCanvas(
      project.layers, i, project.width, project.height, scale
    );
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!))
    );
    zip.file(`frame_${String(i).padStart(3, '0')}.png`, blob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${project.name}_frames.zip`);
};

// ===== EXPORT SPRITESHEET =====
export const exportSpritesheet = (
  project: SpriteProject,
  scale: number,
  columns?: number
): void => {
  const maxFrames = Math.max(...project.layers.map((l) => l.frames.length));
  const cols = columns || Math.ceil(Math.sqrt(maxFrames));
  const rows = Math.ceil(maxFrames / cols);
  const fw = project.width * scale;
  const fh = project.height * scale;

  const canvas = document.createElement('canvas');
  canvas.width = fw * cols;
  canvas.height = fh * rows;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < maxFrames; i++) {
    const frameCanvas = renderFrameToCanvas(
      project.layers, i, project.width, project.height, scale
    );
    const col = i % cols;
    const row = Math.floor(i / cols);
    ctx.drawImage(frameCanvas, col * fw, row * fh);
  }

  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, `${project.name}_spritesheet.png`);
  });
};

// ===== EXPORT JSON (CUSTOM FORMAT) =====
export const exportJSON = (project: SpriteProject): void => {
  const data = {
    format: 'SpriteForge v1.0',
    project: {
      name: project.name,
      width: project.width,
      height: project.height,
      fps: project.fps,
      layers: project.layers.map((layer) => ({
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        frames: layer.frames.map((frame) => ({
          duration: frame.duration,
          pixels: frame.pixels.map((p) => ({
            x: p.x,
            y: p.y,
            r: p.color.r,
            g: p.color.g,
            b: p.color.b,
            a: p.color.a,
          })),
        })),
      })),
    },
    metadata: {
      exportedAt: new Date().toISOString(),
      totalFrames: Math.max(...project.layers.map((l) => l.frames.length)),
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  saveAs(blob, `${project.name}.spriteforge.json`);
};

// ===== EXPORT GIF (simplified - frame sequence) =====
export const exportGIF = async (
  project: SpriteProject,
  scale: number
): Promise<void> => {
  // GIF export - we export as APNG-style (individual frames + metadata)
  // For true GIF we'd need a GIF encoder, so we export a spritesheet + animation data
  const maxFrames = Math.max(...project.layers.map((l) => l.frames.length));
  const zip = new JSZip();

  for (let i = 0; i < maxFrames; i++) {
    const canvas = renderFrameToCanvas(
      project.layers, i, project.width, project.height, scale
    );
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!))
    );
    zip.file(`frame_${String(i).padStart(3, '0')}.png`, blob);
  }

  // Add animation metadata
  const meta = {
    fps: project.fps,
    frameCount: maxFrames,
    width: project.width * scale,
    height: project.height * scale,
    frameDurations: project.layers[0]?.frames.map((f) => f.duration) || [],
  };
  zip.file('animation.json', JSON.stringify(meta, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${project.name}_animation.zip`);
};

// ===== EXPORT GODOT RESOURCE =====
export const exportGodotResource = async (
  project: SpriteProject,
  scale: number
): Promise<void> => {
  const zip = new JSZip();
  const maxFrames = Math.max(...project.layers.map((l) => l.frames.length));

  // Export spritesheet
  const cols = Math.ceil(Math.sqrt(maxFrames));
  const rows = Math.ceil(maxFrames / cols);
  const fw = project.width * scale;
  const fh = project.height * scale;

  const canvas = document.createElement('canvas');
  canvas.width = fw * cols;
  canvas.height = fh * rows;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < maxFrames; i++) {
    const frameCanvas = renderFrameToCanvas(
      project.layers, i, project.width, project.height, scale
    );
    const col = i % cols;
    const row = Math.floor(i / cols);
    ctx.drawImage(frameCanvas, col * fw, row * fh);
  }

  const blob = await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b!))
  );
  zip.file(`${project.name}_spritesheet.png`, blob);

  // Godot .tres resource
  const tres = `[gd_resource type="SpriteFrames" format=3]

[resource]
animations = [{
"frames": [${Array.from({ length: maxFrames }, (_, i) => `{
"duration": 1.0,
"texture": ExtResource("${i + 1}")
}`).join(', ')}],
"loop": true,
"name": &"default",
"speed": ${project.fps}.0
}]
`;
  zip.file(`${project.name}.tres`, tres);

  // README
  zip.file('README.txt', `SpriteForge Export for Godot Engine
=====================================
1. Import ${project.name}_spritesheet.png into your Godot project
2. Set import preset to "2D Pixel" (disable filter)
3. Spritesheet: ${cols} columns x ${rows} rows
4. Frame size: ${fw}x${fh}
5. FPS: ${project.fps}
6. Total frames: ${maxFrames}
`);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${project.name}_godot.zip`);
};

// ===== EXPORT UNITY READY =====
export const exportUnityReady = async (
  project: SpriteProject,
  scale: number
): Promise<void> => {
  const zip = new JSZip();
  const maxFrames = Math.max(...project.layers.map((l) => l.frames.length));

  // Individual frames for Unity sprite editor
  for (let i = 0; i < maxFrames; i++) {
    const canvas = renderFrameToCanvas(
      project.layers, i, project.width, project.height, scale
    );
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!))
    );
    zip.file(`Sprites/${project.name}_${String(i).padStart(3, '0')}.png`, blob);
  }

  // Unity .anim metadata hint
  const animMeta = {
    name: project.name,
    sampleRate: project.fps,
    frameCount: maxFrames,
    frameSize: { width: project.width * scale, height: project.height * scale },
    pixelsPerUnit: project.width,
  };
  zip.file('animation_meta.json', JSON.stringify(animMeta, null, 2));

  zip.file('README.txt', `SpriteForge Export for Unity
==============================
1. Drag the Sprites folder into your Unity Assets
2. Select all sprites → Inspector → Pixels Per Unit: ${project.width}
3. Filter Mode: Point (no filter)
4. Compression: None
5. Create Animation from sprites in Animation window
6. Set sample rate to ${project.fps}
`);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${project.name}_unity.zip`);
};

// ===== MASTER EXPORT =====
export const exportProject = async (
  project: SpriteProject,
  options: ExportOptions
): Promise<void> => {
  switch (options.format) {
    case 'png':
      await exportAllFramesPNG(project, options.scale);
      break;
    case 'spritesheet':
      exportSpritesheet(project, options.scale, options.spritesheetColumns);
      break;
    case 'json':
      exportJSON(project);
      break;
    case 'gif':
      await exportGIF(project, options.scale);
      break;
    case 'aseprite':
      exportJSON(project); // fallback
      break;
  }
};
