import { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Frame, Pixel } from '../types';

interface Props {
  width: number;
  height: number;
  onImport: (frame: Frame) => void;
}

export default function ReferenceImport({ width, height, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const img = new Image();
    const url = URL.createObjectURL(file);
    setPreview(url);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      // Scale to fit
      const scaleX = width / img.width;
      const scaleY = height / img.height;
      const scale = Math.min(scaleX, scaleY);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (width - drawW) / 2;
      const offsetY = (height - drawH) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels: Pixel[] = [];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const a = imageData.data[i + 3] / 255;
          if (a > 0.1) {
            pixels.push({
              x,
              y,
              color: {
                r: imageData.data[i],
                g: imageData.data[i + 1],
                b: imageData.data[i + 2],
                a,
              },
            });
          }
        }
      }

      const frame: Frame = {
        id: uuidv4(),
        pixels,
        duration: 100,
        label: file.name,
      };

      onImport(frame);
      setImporting(false);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50 p-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
        📁 Importuj referencję
      </h3>

      <p className="text-[10px] text-gray-500 mb-2">
        Załaduj obraz referencyjny (PNG/JPG). Zostanie przeskalowany do {width}×{height}px
        i skonwertowany na pixel art.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="w-full py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 border-dashed rounded-lg text-xs text-gray-300 transition-colors disabled:opacity-50"
      >
        {importing ? '⏳ Importowanie...' : '📂 Wybierz plik obrazu'}
      </button>

      {preview && (
        <div className="mt-2 flex justify-center">
          <img
            src={preview}
            alt="Reference preview"
            className="max-h-16 rounded border border-gray-700"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      )}

      {/* JSON Import */}
      <div className="mt-3 border-t border-gray-700/50 pt-2">
        <p className="text-[10px] text-gray-500 mb-1">
          Lub załaduj projekt SpriteForge JSON:
        </p>
        <input
          type="file"
          accept=".json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const data = JSON.parse(text);
              if (data.format?.startsWith('SpriteForge') && data.project?.layers?.[0]?.frames?.[0]) {
                const frameData = data.project.layers[0].frames[0];
                const pixels: Pixel[] = frameData.pixels.map((p: { x: number; y: number; r: number; g: number; b: number; a: number }) => ({
                  x: p.x,
                  y: p.y,
                  color: { r: p.r, g: p.g, b: p.b, a: p.a },
                }));
                onImport({ id: uuidv4(), pixels, duration: 100, label: 'Imported' });
              }
            } catch (err) {
              console.error('JSON import error:', err);
            }
          }}
          className="w-full text-[10px] text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600"
        />
      </div>
    </div>
  );
}
