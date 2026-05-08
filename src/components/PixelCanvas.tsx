import React, { useRef, useEffect } from 'react';

interface PixelCanvasProps {
  width?: number;
  height?: number;
}

export default function PixelCanvas({ width = 512, height = 512 }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // W tym miejscu w przyszłości podepniemy Twój pixelEngine i aiEngine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Przykładowe wypełnienie przezroczystością na start
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-xl border border-slate-700 shadow-lg w-full max-w-2xl mx-auto">
      {/* Nagłówek */}
      <div className="flex justify-between w-full mb-3 px-2">
        <span className="text-slate-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
          <span>🎨</span> Obszar Roboczy (128x128)
        </span>
      </div>

      {/* Kontener obszaru roboczego */}
      <div
        className="relative overflow-hidden border border-slate-600 rounded shadow-inner"
        style={{
          width: width,
          height: height,
          // Szachownica przezroczystości w czystym CSS
          backgroundImage: `
            linear-gradient(45deg, #1e293b 25%, transparent 25%),
            linear-gradient(-45deg, #1e293b 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #1e293b 75%),
            linear-gradient(-45deg, transparent 75%, #1e293b 75%)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          backgroundColor: '#0f172a',
        }}
      >
        {/* Właściwy Canvas o rozdzielczości 128x128 pikseli */}
        <canvas
          ref={canvasRef}
          width={128} // Fizyczna liczba pikseli w poziomie
          height={128} // Fizyczna liczba pikseli w pionie
          style={{
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated', // Gwarantuje ostre krawędzie pikseli bez rozmycia
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 10,
          }}
        />
        
        {/* Nakładka CSS rysująca siatkę pomocniczą */}
        <div 
          style={{
            position: 'absolute',
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            // Skoro Canvas ma rozmiar 512px, a rozdzielczość to 128px, 
            // to 1 piksel obszaru roboczego zajmuje 4 piksele na ekranie (512 / 128 = 4).
            backgroundSize: '4px 4px', 
            pointerEvents: 'none', // Sprawia, że siatka "przepuszcza" kliknięcia myszką do Canvasu pod spodem
            zIndex: 20,
          }}
        />
      </div>
      
      {/* Informacja na dole */}
      <div className="mt-4 text-slate-500 text-xs text-center bg-slate-800 px-4 py-2 rounded-lg">
        Canvas został zresetowany. Gotowy do podłączenia z Twoimi plikami `aiEngine.ts` oraz `exportEngine.ts`.
      </div>
    </div>
  );
}
