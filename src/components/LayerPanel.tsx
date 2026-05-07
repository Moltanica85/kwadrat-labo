import type { Layer } from '../types';

interface Props {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onReorderLayer: (id: string, direction: 'up' | 'down') => void;
  onOpacityChange: (id: string, opacity: number) => void;
}

export default function LayerPanel({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onToggleVisibility,
  onToggleLock,
  onRenameLayer,
  onReorderLayer,
  onOpacityChange,
}: Props) {
  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">📑 Warstwy</h3>
        <button
          onClick={onAddLayer}
          className="text-xs bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded text-white transition-colors"
        >
          + Nowa
        </button>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {[...layers].reverse().map((layer, ri) => {
          const i = layers.length - 1 - ri;
          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer transition-all ${
                activeLayerId === layer.id
                  ? 'bg-indigo-900/50 border border-indigo-500/40'
                  : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
              }`}
            >
              {/* Visibility */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                  layer.visible ? 'text-white' : 'text-gray-600'
                }`}
                title={layer.visible ? 'Ukryj' : 'Pokaż'}
              >
                {layer.visible ? '👁' : '🚫'}
              </button>

              {/* Lock */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(layer.id);
                }}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                  layer.locked ? 'text-red-400' : 'text-gray-500'
                }`}
                title={layer.locked ? 'Odblokuj' : 'Zablokuj'}
              >
                {layer.locked ? '🔒' : '🔓'}
              </button>

              {/* Name */}
              <input
                value={layer.name}
                onChange={(e) => onRenameLayer(layer.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent text-xs text-white border-none outline-none"
              />

              {/* Opacity */}
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(layer.opacity * 100)}
                onChange={(e) => onOpacityChange(layer.id, Number(e.target.value) / 100)}
                onClick={(e) => e.stopPropagation()}
                className="w-12 accent-indigo-500"
                title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
              />

              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, 'up');
                  }}
                  className="text-[8px] text-gray-500 hover:text-white leading-none"
                  disabled={i === layers.length - 1}
                >
                  ▲
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, 'down');
                  }}
                  className="text-[8px] text-gray-500 hover:text-white leading-none"
                  disabled={i === 0}
                >
                  ▼
                </button>
              </div>

              {/* Delete */}
              {layers.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                  title="Usuń warstwę"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
