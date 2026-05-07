import type { Tool } from '../types';

interface Props {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  mirror: boolean;
  onMirrorToggle: () => void;
}

const TOOLS: { id: Tool; icon: string; label: string; shortcut: string }[] = [
  { id: 'pencil', icon: '✏️', label: 'Ołówek', shortcut: 'B' },
  { id: 'eraser', icon: '🧹', label: 'Gumka', shortcut: 'E' },
  { id: 'bucket', icon: '🪣', label: 'Wypełnienie', shortcut: 'G' },
  { id: 'eyedropper', icon: '💧', label: 'Próbnik', shortcut: 'I' },
  { id: 'line', icon: '📏', label: 'Linia', shortcut: 'L' },
  { id: 'rect', icon: '⬜', label: 'Prostokąt', shortcut: 'R' },
  { id: 'circle', icon: '⭕', label: 'Okrąg', shortcut: 'C' },
  { id: 'select', icon: '⬚', label: 'Zaznaczenie', shortcut: 'M' },
  { id: 'move', icon: '✥', label: 'Przesuń', shortcut: 'V' },
];

export default function Toolbar({ activeTool, onToolChange, mirror, onMirrorToggle }: Props) {
  return (
    <div className="flex flex-col gap-1 p-2 bg-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => onToolChange(t.id)}
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center text-lg
            transition-all duration-150 relative group
            ${activeTool === t.id
              ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30 scale-105'
              : 'bg-gray-800 hover:bg-gray-700'
            }
          `}
          title={`${t.label} (${t.shortcut})`}
        >
          {t.icon}
          <span className="absolute left-12 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-gray-700">
            {t.label} <kbd className="ml-1 text-gray-400">{t.shortcut}</kbd>
          </span>
        </button>
      ))}

      <div className="border-t border-gray-700 my-1" />

      <button
        onClick={onMirrorToggle}
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center text-lg
          transition-all duration-150
          ${mirror ? 'bg-purple-600 shadow-lg shadow-purple-500/30' : 'bg-gray-800 hover:bg-gray-700'}
        `}
        title="Rysowanie lustrzane"
      >
        🪞
      </button>
    </div>
  );
}
