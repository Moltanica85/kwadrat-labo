import { useRef, useEffect, useCallback, useState } from 'react';
import type { Layer } from '../types';
import { mergeLayerFrames } from '../utils/pixelEngine';

interface Props {
  layers: Layer[];
  width: number;
  height: number;
  fps: number;
  isPlaying: boolean;
  maxFrames: number;
}

export default function PreviewPanel({ layers, width, height, fps, isPlaying, maxFrames }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [previewScale, setPreviewScale] = useState(4);
  const [bgColor, setBgColor] = useState<'transparent' | 'black' | 'white' | 'green'>('transparent');

  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if (bgColor === 'transparent') {
      const cs = previewScale;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#333' : '#444';
          ctx.fillRect(x * cs, y * cs, cs, cs);
        }
      }
    } else {
      const colors = { black: '#000', white: '#fff', green: '#00ff00' };
      ctx.fillStyle = colors[bgColor];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const imageData = mergeLayerFrames(layers, frameIndex, width, height);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, width * previewScale, height * previewScale);
  }, [layers, width, height, previewScale, bgColor]);

  useEffect(() => {
    renderFrame(currentFrame);
  }, [currentFrame, renderFrame]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % maxFrames);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [isPlaying, fps, maxFrames]);

  useEffect(() => {
    if (!isPlaying) setCurrentFrame(0);
  }, [isPlaying]);

  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">👁 Podgląd</h3>
        <div className="flex gap-1">
          {(['transparent', 'black', 'white', 'green'] as const).map((bg) => (
            <button
              key={bg}
              onClick={() => setBgColor(bg)}
              className={`w-5 h-5 rounded border text-[8px] ${
                bgColor === bg ? 'border-indigo-500' : 'border-gray-600'
              }`}
              style={{
                backgroundColor:
                  bg === 'transparent'
                    ? 'repeating-conic-gradient(#333 0% 25%, #444 0% 50%) 50% / 8px 8px'
                    : bg === 'black'
                    ? '#000'
                    : bg === 'white'
                    ? '#fff'
                    : '#0f0',
              }}
              title={bg}
            />
          ))}
        </div>
      </div>

      {/* Preview Scale */}
      <div className="flex gap-1 mb-2">
        {[2, 4, 6, 8].map((s) => (
          <button
            key={s}
            onClick={() => setPreviewScale(s)}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              previewScale === s
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="flex justify-center bg-gray-950 rounded-lg p-2 overflow-auto">
        <canvas
          ref={canvasRef}
          width={width * previewScale}
          height={height * previewScale}
          style={{ imageRendering: 'pixelated' }}
          className="border border-gray-700/30"
        />
      </div>
    </div>
  );
}
