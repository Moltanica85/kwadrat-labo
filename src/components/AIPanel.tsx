import { useState } from 'react';
import type { AnimationPreset, Frame, Pixel } from '../types';
import { ANIMATION_PRESETS, PRESET_CATEGORIES } from '../utils/animationPresets';
import { generateAnimation, generateFromPrompt, PIXEL_PALETTES } from '../utils/aiEngine';

interface Props {
  width: number;
  height: number;
  onAnimationGenerated: (frames: Frame[]) => void;
  currentFramePixels?: Pixel[];
  activePalette: string;
}

export default function AIPanel({
  width,
  height,
  onAnimationGenerated,
  currentFramePixels,
  activePalette,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('locomotion');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AnimationPreset | null>(null);

  const filteredPresets = ANIMATION_PRESETS.filter((p) => p.category === activeCategory);

  const handleGenerate = async (preset: AnimationPreset) => {
    setGenerating(true);
    setSelectedPreset(preset);

    // Simulate AI processing delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const frames = generateAnimation(
      preset,
      width,
      height,
      activePalette as keyof typeof PIXEL_PALETTES,
      currentFramePixels
    );
    onAnimationGenerated(frames);
    setGenerating(false);
  };

  const handlePromptGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const frames = generateFromPrompt(
      prompt,
      width,
      height,
      activePalette as keyof typeof PIXEL_PALETTES
    );
    onAnimationGenerated(frames);
    setGenerating(false);
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50 p-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
        🤖 AI Animator
        <span className="text-[10px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold">
          ENGINE
        </span>
      </h3>

      {/* Text Prompt */}
      <div className="mb-3">
        <div className="flex gap-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="np. 'postać biegnąca', 'walk cycle'..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:border-indigo-500 outline-none transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handlePromptGenerate()}
          />
          <button
            onClick={handlePromptGenerate}
            disabled={generating || !prompt.trim()}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
          >
            {generating ? '⏳' : '✨'} Generuj
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-2">
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 text-xs py-1.5 rounded-lg transition-all ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleGenerate(preset)}
            disabled={generating}
            className={`w-full text-left p-2 rounded-lg border transition-all ${
              selectedPreset?.id === preset.id && generating
                ? 'bg-indigo-900/50 border-indigo-500/50 animate-pulse'
                : 'bg-gray-800/60 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'
            } disabled:opacity-60`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{preset.icon}</span>
              <div className="flex-1">
                <div className="text-xs font-semibold text-white">{preset.name}</div>
                <div className="text-[10px] text-gray-400">{preset.description}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-500">{preset.frameCount} klatek</div>
                <div className="text-[10px] text-gray-500">{preset.fps} FPS</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="mt-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          💡 <strong className="text-gray-400">Silnik AI</strong> generuje animacje proceduralnie na bazie
          algorytmów kinematyki postaci. Obsługuje transformacje szkieletowe, interpolację klatek
          i fizyczne symulacje ruchu. Użyj referencyjnej klatki aby zachować styl postaci.
        </p>
      </div>
    </div>
  );
}
