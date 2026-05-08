import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { useGenerationStore } from "../stores/generationStore";

interface PreviewCanvasProps {
  width?: number;
  height?: number;
}

export function PreviewCanvas({ width = 512, height = 512 }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(12);

  const { outputPngUrl, taskStatus } = useGenerationStore();

  // Inicjalizacja PixiJS
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application();

    app.init({
      width,
      height,
      backgroundColor: 0x0f172a, // Ciemniejsze tło bazy
      antialias: false,
      resolution: window.devicePixelRatio || 1,
    }).then(() => {
      canvasRef.current!.appendChild(app.canvas);
      appRef.current = app;

      // 1. Rysowanie szachownicy przezroczystości (klasyczny motyw edytorów)
      const checkerSize = 16;
      const checkerboard = new PIXI.Graphics();
      for (let y = 0; y < height; y += checkerSize) {
        for (let x = 0; x < width; x += checkerSize) {
          const isDark = (x / checkerSize + y / checkerSize) % 2 === 0;
          checkerboard.rect(x, y, checkerSize, checkerSize).fill(isDark ? 0x1e293b : 0x0f172a);
        }
      }
      app.stage.addChild(checkerboard);

      // 2. Rysowanie głównej siatki (128x128)
      const GRID_SIZE = 128;
      const grid = new PIXI.Graphics();
      for (let x = 0; x < width; x += GRID_SIZE) {
        grid.moveTo(x, 0).lineTo(x, height).stroke({ color: 0x334155, width: 1, alpha: 0.8 });
      }
      for (let y = 0; y < height; y += GRID_SIZE) {
        grid.moveTo(0, y).lineTo(width, y).stroke({ color: 0x334155, width: 1, alpha: 0.8 });
      }
      
      // Wyróżnienie środka (opcjonalne, pomaga przy pozycjonowaniu)
      grid.moveTo(width / 2, 0).lineTo(width / 2, height).stroke({ color: 0x475569, width: 2, alpha: 0.8 });
      grid.moveTo(0, height / 2).lineTo(width, height / 2).stroke({ color: 0x475569, width: 2, alpha: 0.8 });

      app.stage.addChild(grid);
    });

    return () => {
      app.destroy(true);
      appRef.current = null;
    };
  }, [width, height]);

  // Ładowanie spritesheeta gdy gotowy
  useEffect(() => {
    if (!outputPngUrl || !appRef.current) return;

    const frameCount = taskStatus?.frame_count ?? 8;
    const columns = Math.min(8, frameCount);
    const rows = Math.ceil(frameCount / columns);

    PIXI.Assets.load(outputPngUrl).then((texture: PIXI.Texture) => {
      const app = appRef.current!;

      if (spriteRef.current) {
        app.stage.removeChild(spriteRef.current);
        spriteRef.current.destroy();
      }

      const frameW = texture.width / columns;
      const frameH = texture.height / rows;

      // Utwórz animowany sprite z klatek spritesheeta
      const frames: PIXI.Texture[] = [];
      for (let i = 0; i < frameCount; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const frameTexture = new PIXI.Texture({
          source: texture.source,
          frame: new PIXI.Rectangle(col * frameW, row * frameH, frameW, frameH),
        });
        frames.push(frameTexture);
      }

      const animSprite = new PIXI.AnimatedSprite(frames);
      animSprite.animationSpeed = fps / 60;
      // Dostosowanie skali do nowej siatki
      animSprite.scale.set(Math.min(width / frameW, height / frameH) * 0.8);
      animSprite.anchor.set(0.5);
      animSprite.position.set(width / 2, height / 2);

      // Pixel art rendering (Nearest Neighbor)
      animSprite.texture.source.scaleMode = "nearest";

      app.stage.addChild(animSprite);
      spriteRef.current = animSprite as unknown as PIXI.Sprite;

      if (isPlaying) {
        (animSprite as PIXI.AnimatedSprite).play();
      }
    });
  }, [outputPngUrl, taskStatus?.frame_count, fps, isPlaying]);

  const handlePlayPause = () => {
    const sprite = spriteRef.current as unknown as PIXI.AnimatedSprite | null;
    if (!sprite) return;

    if (isPlaying) {
      sprite.stop();
    } else {
      sprite.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFpsChange = (newFps: number) => {
    setFps(newFps);
    const sprite = spriteRef.current as unknown as PIXI.AnimatedSprite | null;
    if (sprite) {
      sprite.animationSpeed = newFps / 60;
    }
  };

  return (
    <div
      style={{
        background: "#050508",
        border: "1px solid #1e293b",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          background: "#0a0a14",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
          🎮 Preview
        </span>
        {outputPngUrl && (
          <span style={{ color: "#22c55e", fontSize: 11, marginLeft: "auto" }}>
            {taskStatus?.frame_count} klatek
          </span>
        )}
      </div>

      {/* Canvas */}
      <div ref={canvasRef} style={{ width, height, position: "relative" }} />

      {/* Kontrolki */}
      {outputPngUrl && (
        <div
          style={{
            padding: "8px 12px",
            background: "#0a0a14",
            borderTop: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={handlePlayPause}
            style={{
              padding: "4px 14px",
              background: isPlaying ? "#1e3a5f" : "#0f2d4a",
              border: "1px solid #3b82f6",
              borderRadius: 5,
              color: "#60a5fa",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <span style={{ color: "#475569", fontSize: 11 }}>FPS:</span>
            <input
              type="range"
              min={1}
              max={60}
              value={fps}
              onChange={(e) => handleFpsChange(Number(e.target.value))}
              style={{ flex: 1, accentColor: "#3b82f6" }}
            />
            <span style={{ color: "#3b82f6", fontSize: 11, fontWeight: 600, minWidth: 30 }}>
              {fps}
            </span>
          </div>
        </div>
      )}

      {/* Placeholder gdy brak outputu */}
      {!outputPngUrl && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#64748b",
            fontSize: 12,
            textAlign: "center",
            pointerEvents: "none",
            background: "rgba(10, 10, 20, 0.8)",
            padding: "16px 24px",
            borderRadius: 8,
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
          Wygeneruj animację aby zobaczyć podgląd
        </div>
      )}
    </div>
  );
}
