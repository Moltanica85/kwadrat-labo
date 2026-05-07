import { useState } from 'react';
import type { SpriteProject } from '../types';
import {
  exportAllFramesPNG,
  exportSpritesheet,
  exportJSON,
  exportGIF,
  exportGodotResource,
  exportUnityReady,
  exportSinglePNG,
} from '../utils/exportEngine';

interface Props {
  project: SpriteProject;
  activeFrameIndex: number;
}

interface ExportOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  engine?: string;
  action: (project: SpriteProject, scale: number) => Promise<void> | void;
}

export default function ExportPanel({ project, activeFrameIndex }: Props) {
  const [scale, setScale] = useState(4);
  const [exporting, setExporting] = useState<string | null>(null);
  const [columns, setColumns] = useState(4);

  const options: ExportOption[] = [
    {
      id: 'png-current',
      name: 'Bieżąca klatka PNG',
      icon: '🖼️',
      description: 'Eksportuj aktywną klatkę jako PNG',
      action: (p, s) => exportSinglePNG(p, activeFrameIndex, s),
    },
    {
      id: 'png-all',
      name: 'Wszystkie klatki PNG',
      icon: '📦',
      description: 'ZIP z osobnymi plikami PNG dla każdej klatki',
      action: (p, s) => exportAllFramesPNG(p, s),
    },
    {
      id: 'spritesheet',
      name: 'Spritesheet',
      icon: '🗺️',
      description: 'Pojedynczy PNG z siatką wszystkich klatek',
      action: (p, s) => exportSpritesheet(p, s, columns),
    },
    {
      id: 'animation-pack',
      name: 'Paczka animacji',
      icon: '🎬',
      description: 'Klatki PNG + metadane animacji (JSON)',
      action: (p, s) => exportGIF(p, s),
    },
    {
      id: 'json',
      name: 'SpriteForge JSON',
      icon: '📄',
      description: 'Pełny zapis projektu z danymi pikseli',
      action: (p) => exportJSON(p),
    },
    {
      id: 'godot',
      name: 'Godot Engine',
      icon: '🤖',
      description: 'Spritesheet + .tres resource + instrukcje',
      engine: 'Godot 4.x',
      action: (p, s) => exportGodotResource(p, s),
    },
    {
      id: 'unity',
      name: 'Unity',
      icon: '🎮',
      description: 'Sprites folder + meta animacji + instrukcje',
      engine: 'Unity 2022+',
      action: (p, s) => exportUnityReady(p, s),
    },
  ];

  const handleExport = async (option: ExportOption) => {
    setExporting(option.id);
    try {
      await option.action(project, scale);
    } catch (e) {
      console.error('Export error:', e);
    }
    setTimeout(() => setExporting(null), 500);
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50 p-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        📤 Eksport
      </h3>

      {/* Scale */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-800/50 rounded-lg">
        <span className="text-xs text-gray-400">Skala:</span>
        <div className="flex gap-1">
          {[1, 2, 4, 8, 16].map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                scale === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-500 ml-auto">
          {project.width * scale}×{project.height * scale}px
        </span>
      </div>

      {/* Columns for spritesheet */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-800/50 rounded-lg">
        <span className="text-xs text-gray-400">Kolumny spritesheet:</span>
        <input
          type="number"
          min={1}
          max={32}
          value={columns}
          onChange={(e) => setColumns(Number(e.target.value))}
          className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-xs text-white text-center"
        />
      </div>

      {/* Export Options */}
      <div className="space-y-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleExport(opt)}
            disabled={exporting !== null}
            className={`w-full text-left p-2.5 rounded-lg border transition-all ${
              exporting === opt.id
                ? 'bg-green-900/30 border-green-500/50'
                : 'bg-gray-800/60 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'
            } disabled:opacity-60`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{opt.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{opt.name}</span>
                  {opt.engine && (
                    <span className="text-[9px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">
                      {opt.engine}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400">{opt.description}</div>
              </div>
              {exporting === opt.id ? (
                <span className="text-green-400 text-sm animate-bounce">✓</span>
              ) : (
                <span className="text-gray-600 text-sm">→</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Format Info */}
      <div className="mt-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          🎯 <strong className="text-gray-400">Kompatybilność:</strong> PNG/Spritesheet działa z każdym silnikiem.
          Eksporty Godot/Unity zawierają gotowe konfiguracje i instrukcje importu.
          JSON zachowuje pełne dane projektu do ponownego otwarcia.
        </p>
      </div>
    </div>
  );
}
