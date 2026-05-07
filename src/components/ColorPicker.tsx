import { useState } from 'react';
import type { Color } from '../types';
import { colorToHex, hexToColor } from '../utils/pixelEngine';
import { PIXEL_PALETTES } from '../utils/aiEngine';

interface Props {
  color: Color;
  onColorChange: (color: Color) => void;
  activePalette: string;
  onPaletteChange: (name: string) => void;
}

export default function ColorPicker({ color, onColorChange, activePalette, onPaletteChange }: Props) {
  const [showPalettes, setShowPalettes] = useState(false);
  const currentHex = colorToHex(color);
  const palette = PIXEL_PALETTES[activePalette as keyof typeof PIXEL_PALETTES] || PIXEL_PALETTES.sweetie16;

  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50 p-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">🎨 Kolory</h3>

      {/* Current Color */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-10 h-10 rounded-lg border-2 border-gray-600 shadow-inner"
          style={{ backgroundColor: currentHex }}
        />
        <div className="flex-1">
          <input
            type="color"
            value={currentHex}
            onChange={(e) => onColorChange(hexToColor(e.target.value))}
            className="w-full h-8 rounded cursor-pointer bg-transparent"
          />
          <span className="text-xs text-gray-500 font-mono">{currentHex}</span>
        </div>
      </div>

      {/* Palette Selector */}
      <div className="mb-2">
        <button
          onClick={() => setShowPalettes(!showPalettes)}
          className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <span>{showPalettes ? '▼' : '▶'}</span>
          <span className="font-medium">{activePalette.toUpperCase()}</span>
        </button>
        {showPalettes && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.keys(PIXEL_PALETTES).map((name) => (
              <button
                key={name}
                onClick={() => {
                  onPaletteChange(name);
                  setShowPalettes(false);
                }}
                className={`text-xs px-2 py-1 rounded ${
                  activePalette === name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Palette Colors */}
      <div className="grid grid-cols-8 gap-0.5">
        {palette.map((hex, i) => (
          <button
            key={`${hex}-${i}`}
            onClick={() => onColorChange(hexToColor(hex))}
            className={`w-5 h-5 rounded-sm border transition-transform hover:scale-125 hover:z-10 ${
              currentHex === hex ? 'border-white scale-110 z-10' : 'border-gray-700'
            }`}
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>
    </div>
  );
}
