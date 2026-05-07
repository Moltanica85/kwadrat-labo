// ===== CORE TYPES =====

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Pixel {
  x: number;
  y: number;
  color: Color;
}

export type CanvasSize = 16 | 32 | 48 | 64 | 128 | 256;

export interface Frame {
  id: string;
  pixels: Pixel[];
  duration: number; // ms
  label?: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  frames: Frame[];
}

export interface AnimationPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'locomotion' | 'action' | 'idle' | 'effect';
  frameCount: number;
  fps: number;
}

export interface SpriteProject {
  id: string;
  name: string;
  width: CanvasSize;
  height: CanvasSize;
  layers: Layer[];
  activeLayerId: string;
  activeFrameIndex: number;
  fps: number;
  createdAt: number;
  updatedAt: number;
}

export type Tool =
  | 'pencil'
  | 'eraser'
  | 'bucket'
  | 'eyedropper'
  | 'select'
  | 'move'
  | 'line'
  | 'rect'
  | 'circle'
  | 'mirror';

export type ExportFormat = 'png' | 'gif' | 'spritesheet' | 'json' | 'aseprite';

export interface ExportOptions {
  format: ExportFormat;
  scale: number;
  includeMetadata: boolean;
  spritesheetColumns?: number;
  backgroundColor?: Color;
}

export interface AIGenerationRequest {
  prompt: string;
  preset?: AnimationPreset;
  referenceFrame?: Frame;
  width: number;
  height: number;
  style: 'pixel-art' | 'retro-8bit' | 'retro-16bit' | 'modern-pixel';
  colorPalette?: Color[];
}

export interface HistoryEntry {
  type: string;
  timestamp: number;
  snapshot: string; // serialized layer data
}
