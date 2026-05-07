import { useRef, useEffect, useCallback } from 'react';
import type { Frame } from '../types';
import { mergeLayerFrames } from '../utils/pixelEngine';

interface Props {
  frames: Frame[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  fps: number;
  onFpsChange: (fps: number) => void;
  layers: { id: string; name: string; visible: boolean; locked: boolean; opacity: number; frames: Frame[] }[];
  width: number;
  height: number;
  onionSkin: boolean;
  onOnionSkinToggle: () => void;
}

function FrameThumbnail({
  layers,
  frameIndex,
  width,
  height,
  isActive,
  onClick,
  index,
}: {
  layers: Props['layers'];
  frameIndex: number;
  width: number;
  height: number;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 48, 48);

    // BG
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 48, 48);

    const imageData = mergeLayerFrames(layers, frameIndex, width, height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, 48, 48);
  }, [layers, frameIndex, width, height]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
        isActive
          ? 'border-indigo-500 shadow-lg shadow-indigo-500/30 scale-105'
          : 'border-gray-700 hover:border-gray-500'
      }`}
    >
      <canvas ref={canvasRef} width={48} height={48} style={{ imageRendering: 'pixelated' }} />
      <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-center text-gray-300">
        {index + 1}
      </span>
    </button>
  );
}

export default function Timeline({
  frames,
  activeIndex,
  onSelect,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  isPlaying,
  onPlayToggle,
  fps,
  onFpsChange,
  layers,
  width,
  height,
  onionSkin,
  onOnionSkinToggle,
}: Props) {
  return (
    <div className="bg-gray-900/80 backdrop-blur border-t border-gray-700/50 p-3">
      <div className="flex items-center gap-3">
        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPlayToggle}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
              isPlaying
                ? 'bg-red-600 shadow-lg shadow-red-500/30'
                : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20'
            }`}
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>
          <button
            onClick={onAddFrame}
            className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-lg transition-colors"
            title="Dodaj klatkę"
          >
            ➕
          </button>
          <button
            onClick={() => onDuplicateFrame(activeIndex)}
            className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm transition-colors"
            title="Duplikuj klatkę"
          >
            📋
          </button>
          {frames.length > 1 && (
            <button
              onClick={() => onDeleteFrame(activeIndex)}
              className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-red-700 flex items-center justify-center text-lg transition-colors"
              title="Usuń klatkę"
            >
              🗑️
            </button>
          )}
        </div>

        {/* FPS */}
        <div className="flex items-center gap-2 px-3 border-l border-r border-gray-700">
          <span className="text-xs text-gray-400">FPS</span>
          <input
            type="range"
            min={1}
            max={30}
            value={fps}
            onChange={(e) => onFpsChange(Number(e.target.value))}
            className="w-20 accent-indigo-500"
          />
          <span className="text-xs text-white font-mono w-6">{fps}</span>
        </div>

        {/* Onion Skin */}
        <button
          onClick={onOnionSkinToggle}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            onionSkin
              ? 'bg-amber-600/30 text-amber-300 border border-amber-600/50'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🧅 Onion Skin
        </button>

        {/* Frame Strip */}
        <div className="flex-1 flex gap-2 overflow-x-auto py-1 px-2">
          {frames.map((_, i) => (
            <FrameThumbnail
              key={`frame-${i}`}
              layers={layers}
              frameIndex={i}
              width={width}
              height={height}
              isActive={i === activeIndex}
              onClick={() => onSelect(i)}
              index={i}
            />
          ))}
        </div>

        <div className="text-xs text-gray-500">
          {activeIndex + 1}/{frames.length}
        </div>
      </div>
    </div>
  );
}
