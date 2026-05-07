import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SpriteProject, Tool, Color, Frame, CanvasSize } from './types';
import {
  createProject,
  createLayer,
  createEmptyFrame,
  hexToColor,
  colorToHex,
  clearFrame,
} from './utils/pixelEngine';
import PixelCanvas from './components/PixelCanvas';
import Toolbar from './components/Toolbar';
import ColorPicker from './components/ColorPicker';
import Timeline from './components/Timeline';
import LayerPanel from './components/LayerPanel';
import AIPanel from './components/AIPanel';
import ExportPanel from './components/ExportPanel';
import PreviewPanel from './components/PreviewPanel';
import ReferenceImport from './components/ReferenceImport';

type SidePanel = 'ai' | 'export' | 'reference' | 'settings';

export default function App() {
  const [project, setProject] = useState<SpriteProject>(() => createProject('Moja postać', 32, 32));
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState<Color>(hexToColor('#e43b44'));
  const [zoom, setZoom] = useState(14);
  const [mirror, setMirror] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [onionSkin, setOnionSkin] = useState(false);
  const [activePalette, setActivePalette] = useState('sweetie16');
  const [sidePanel, setSidePanel] = useState<SidePanel>('ai');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectSize, setNewProjectSize] = useState<CanvasSize>(32);
  const [newProjectName, setNewProjectName] = useState('');

  // Get current active layer and frame
  const activeLayer = project.layers.find((l) => l.id === project.activeLayerId)!;
  const activeFrame = activeLayer.frames[project.activeFrameIndex] || activeLayer.frames[0];
  const maxFrames = Math.max(...project.layers.map((l) => l.frames.length));

  // Previous frame for onion skin
  const onionFrame = project.activeFrameIndex > 0
    ? activeLayer.frames[project.activeFrameIndex - 1]
    : undefined;

  // Animation playback
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProject((prev) => ({
        ...prev,
        activeFrameIndex: (prev.activeFrameIndex + 1) % maxFrames,
      }));
    }, 1000 / project.fps);
    return () => clearInterval(interval);
  }, [isPlaying, project.fps, maxFrames]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'b': setTool('pencil'); break;
        case 'e': setTool('eraser'); break;
        case 'g': setTool('bucket'); break;
        case 'i': setTool('eyedropper'); break;
        case 'l': setTool('line'); break;
        case 'r': setTool('rect'); break;
        case 'c': setTool('circle'); break;
        case 'm': setTool('select'); break;
        case 'v': setTool('move'); break;
        case ' ':
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case '+':
        case '=':
          setZoom((z) => Math.min(32, z + 2));
          break;
        case '-':
          setZoom((z) => Math.max(2, z - 2));
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ===== PROJECT MUTATIONS =====
  const updateFrame = useCallback((newFrame: Frame) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      layers: prev.layers.map((layer) =>
        layer.id === prev.activeLayerId
          ? {
              ...layer,
              frames: layer.frames.map((f, i) =>
                i === prev.activeFrameIndex ? newFrame : f
              ),
            }
          : layer
      ),
    }));
  }, []);

  const addFrame = useCallback(() => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => ({
        ...layer,
        frames: [...layer.frames, createEmptyFrame()],
      })),
      activeFrameIndex: Math.max(...prev.layers.map((l) => l.frames.length)),
    }));
  }, []);

  const duplicateFrame = useCallback((index: number) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => {
        const sourceFrame = layer.frames[index] || layer.frames[layer.frames.length - 1];
        const newFrame = { ...sourceFrame, id: uuidv4() };
        const newFrames = [...layer.frames];
        newFrames.splice(index + 1, 0, newFrame);
        return { ...layer, frames: newFrames };
      }),
      activeFrameIndex: index + 1,
    }));
  }, []);

  const deleteFrame = useCallback((index: number) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) => ({
        ...layer,
        frames: layer.frames.filter((_, i) => i !== index),
      })),
      activeFrameIndex: Math.max(0, index - 1),
    }));
  }, []);

  const addLayer = useCallback(() => {
    const newLayer = createLayer(`Layer ${project.layers.length + 1}`);
    // Match frame count
    while (newLayer.frames.length < maxFrames) {
      newLayer.frames.push(createEmptyFrame());
    }
    setProject((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      activeLayerId: newLayer.id,
    }));
  }, [project.layers.length, maxFrames]);

  const deleteLayer = useCallback((id: string) => {
    setProject((prev) => {
      const newLayers = prev.layers.filter((l) => l.id !== id);
      return {
        ...prev,
        layers: newLayers,
        activeLayerId: newLayers[newLayers.length - 1]?.id || '',
      };
    });
  }, []);

  const handleAnimationGenerated = useCallback((frames: Frame[]) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) =>
        layer.id === prev.activeLayerId
          ? { ...layer, frames }
          : layer
      ),
      activeFrameIndex: 0,
      updatedAt: Date.now(),
    }));
    setIsPlaying(true);
  }, []);

  const handleReferenceImport = useCallback((frame: Frame) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) =>
        layer.id === prev.activeLayerId
          ? {
              ...layer,
              frames: layer.frames.map((f, i) =>
                i === prev.activeFrameIndex ? frame : f
              ),
            }
          : layer
      ),
      updatedAt: Date.now(),
    }));
  }, []);

  const handleNewProject = () => {
    const name = newProjectName.trim() || 'Nowy projekt';
    setProject(createProject(name, newProjectSize, newProjectSize));
    setShowNewProject(false);
    setNewProjectName('');
    setIsPlaying(false);
  };

  const handleClearFrame = () => {
    updateFrame(clearFrame(activeFrame));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white overflow-hidden select-none">
      {/* ===== TOP BAR ===== */}
      <header className="h-12 flex items-center justify-between px-4 bg-gray-900/90 backdrop-blur border-b border-gray-800/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ⚒️ SpriteForge
          </h1>
          <span className="text-[10px] bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
            AI STUDIO
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 mr-2">
            📐 {project.width}×{project.height}px
          </span>

          <input
            value={project.name}
            onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white max-w-[160px] focus:border-indigo-500 outline-none"
          />

          <button
            onClick={() => setShowNewProject(true)}
            className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-gray-300 transition-colors"
          >
            📄 Nowy
          </button>

          <button
            onClick={handleClearFrame}
            className="text-xs bg-gray-800 hover:bg-red-700 px-3 py-1.5 rounded-lg text-gray-300 transition-colors"
          >
            🧹 Wyczyść
          </button>

          <div className="h-5 w-px bg-gray-700 mx-1" />

          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Zoom</span>
            <input
              type="range"
              min={2}
              max={32}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-20 accent-indigo-500"
            />
            <span className="text-xs text-white font-mono w-8">{zoom}x</span>
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`text-xs px-2 py-1 rounded ${
              showGrid ? 'bg-indigo-600/30 text-indigo-300' : 'bg-gray-800 text-gray-500'
            }`}
          >
            Grid
          </button>
        </div>
      </header>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className="w-14 flex-shrink-0 flex flex-col items-center py-3 bg-gray-900/40">
          <Toolbar
            activeTool={tool}
            onToolChange={setTool}
            mirror={mirror}
            onMirrorToggle={() => setMirror(!mirror)}
          />
        </div>

        {/* LEFT PANEL */}
        <div className="w-52 flex-shrink-0 p-2 space-y-2 overflow-y-auto bg-gray-900/20">
          <ColorPicker
            color={color}
            onColorChange={setColor}
            activePalette={activePalette}
            onPaletteChange={setActivePalette}
          />
          <LayerPanel
            layers={project.layers}
            activeLayerId={project.activeLayerId}
            onSelectLayer={(id) => setProject((p) => ({ ...p, activeLayerId: id }))}
            onAddLayer={addLayer}
            onDeleteLayer={deleteLayer}
            onToggleVisibility={(id) =>
              setProject((p) => ({
                ...p,
                layers: p.layers.map((l) =>
                  l.id === id ? { ...l, visible: !l.visible } : l
                ),
              }))
            }
            onToggleLock={(id) =>
              setProject((p) => ({
                ...p,
                layers: p.layers.map((l) =>
                  l.id === id ? { ...l, locked: !l.locked } : l
                ),
              }))
            }
            onRenameLayer={(id, name) =>
              setProject((p) => ({
                ...p,
                layers: p.layers.map((l) =>
                  l.id === id ? { ...l, name } : l
                ),
              }))
            }
            onReorderLayer={(id, dir) => {
              setProject((p) => {
                const idx = p.layers.findIndex((l) => l.id === id);
                const newIdx = dir === 'up' ? idx + 1 : idx - 1;
                if (newIdx < 0 || newIdx >= p.layers.length) return p;
                const newLayers = [...p.layers];
                [newLayers[idx], newLayers[newIdx]] = [newLayers[newIdx], newLayers[idx]];
                return { ...p, layers: newLayers };
              });
            }}
            onOpacityChange={(id, opacity) =>
              setProject((p) => ({
                ...p,
                layers: p.layers.map((l) =>
                  l.id === id ? { ...l, opacity } : l
                ),
              }))
            }
          />
          <PreviewPanel
            layers={project.layers}
            width={project.width}
            height={project.height}
            fps={project.fps}
            isPlaying={isPlaying}
            maxFrames={maxFrames}
          />
        </div>

        {/* CANVAS CENTER */}
        <div className="flex-1 flex items-center justify-center overflow-auto bg-gray-950/30 relative">
          {/* Canvas background pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative z-10">
            <PixelCanvas
              frame={activeFrame}
              width={project.width}
              height={project.height}
              tool={tool}
              color={color}
              zoom={zoom}
              mirror={mirror}
              layers={project.layers}
              activeLayerId={project.activeLayerId}
              frameIndex={project.activeFrameIndex}
              onFrameChange={updateFrame}
              onColorPick={setColor}
              showGrid={showGrid}
              onionSkin={onionSkin}
              onionFrame={onionFrame}
            />

            {/* Color indicator */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div
                className="w-5 h-5 rounded border border-gray-600"
                style={{ backgroundColor: colorToHex(color) }}
              />
              <span className="text-[10px] text-gray-500 font-mono">{colorToHex(color)}</span>
              <span className="text-[10px] text-gray-600 mx-2">|</span>
              <span className="text-[10px] text-gray-500">
                {project.width}×{project.height} @ {zoom}x
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-72 flex-shrink-0 flex flex-col bg-gray-900/20">
          {/* Panel Tabs */}
          <div className="flex border-b border-gray-800/50">
            {[
              { id: 'ai' as const, icon: '🤖', label: 'AI' },
              { id: 'export' as const, icon: '📤', label: 'Eksport' },
              { id: 'reference' as const, icon: '📁', label: 'Import' },
              { id: 'settings' as const, icon: '⚙️', label: 'Ustawienia' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSidePanel(tab.id)}
                className={`flex-1 py-2 text-xs transition-all ${
                  sidePanel === tab.id
                    ? 'bg-gray-800/50 text-white border-b-2 border-indigo-500'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {sidePanel === 'ai' && (
              <AIPanel
                width={project.width}
                height={project.height}
                onAnimationGenerated={handleAnimationGenerated}
                currentFramePixels={activeFrame.pixels}
                activePalette={activePalette}
              />
            )}

            {sidePanel === 'export' && (
              <ExportPanel
                project={project}
                activeFrameIndex={project.activeFrameIndex}
              />
            )}

            {sidePanel === 'reference' && (
              <ReferenceImport
                width={project.width}
                height={project.height}
                onImport={handleReferenceImport}
              />
            )}

            {sidePanel === 'settings' && (
              <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50 p-3 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  ⚙️ Ustawienia projektu
                </h3>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Rozmiar canvas</label>
                  <div className="grid grid-cols-3 gap-1">
                    {([16, 32, 48, 64, 128, 256] as CanvasSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          if (confirm(`Zmiana rozmiaru usunie aktualny rysunek. Kontynuować?`)) {
                            setProject(createProject(project.name, size, size));
                          }
                        }}
                        className={`text-xs py-1.5 rounded transition-all ${
                          project.width === size
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {size}×{size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Skróty klawiszowe</label>
                  <div className="bg-gray-800/50 rounded-lg p-2 space-y-1">
                    {[
                      ['B', 'Ołówek'],
                      ['E', 'Gumka'],
                      ['G', 'Wypełnienie'],
                      ['I', 'Próbnik koloru'],
                      ['L', 'Linia'],
                      ['R', 'Prostokąt'],
                      ['C', 'Okrąg'],
                      ['Space', 'Play/Pause'],
                      ['+/-', 'Zoom'],
                    ].map(([key, desc]) => (
                      <div key={key} className="flex justify-between text-[10px]">
                        <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 font-mono">{key}</kbd>
                        <span className="text-gray-500">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <strong className="text-gray-400">SpriteForge AI Studio</strong><br />
                    Wolna alternatywa dla PixelLab. Silnik proceduralny generujący
                    animacje postaci pixel art. Eksport do Godot, Unity i formatów
                    uniwersalnych. Twój sprite, Twoja gra! 🎮
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== TIMELINE ===== */}
      <Timeline
        frames={activeLayer.frames}
        activeIndex={project.activeFrameIndex}
        onSelect={(i) => setProject((p) => ({ ...p, activeFrameIndex: i }))}
        onAddFrame={addFrame}
        onDuplicateFrame={duplicateFrame}
        onDeleteFrame={deleteFrame}
        isPlaying={isPlaying}
        onPlayToggle={() => setIsPlaying(!isPlaying)}
        fps={project.fps}
        onFpsChange={(fps) => setProject((p) => ({ ...p, fps }))}
        layers={project.layers}
        width={project.width}
        height={project.height}
        onionSkin={onionSkin}
        onOnionSkinToggle={() => setOnionSkin(!onionSkin)}
      />

      {/* ===== NEW PROJECT MODAL ===== */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-96 shadow-2xl">
            <h2 className="text-lg font-bold mb-4 text-white">📄 Nowy projekt</h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nazwa</label>
                <input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="np. Warrior, Knight..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Rozmiar</label>
                <div className="grid grid-cols-3 gap-2">
                  {([16, 32, 48, 64, 128, 256] as CanvasSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setNewProjectSize(size)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        newProjectSize === size
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {size}×{size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowNewProject(false)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleNewProject}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20"
              >
                Utwórz ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
