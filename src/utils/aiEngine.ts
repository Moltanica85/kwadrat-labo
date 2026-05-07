import { v4 as uuidv4 } from 'uuid';
import type { Frame, Pixel, AnimationPreset } from '../types';
import { hexToColor } from './pixelEngine';

/**
 * AI Animation Engine - Proceduralna generacja animacji postaci pixel art.
 * Zamiast polegać na zewnętrznych API (jak PixelLab), używamy algorytmów
 * proceduralnych do generowania klatek animacji na podstawie bazowej klatki referencyjnej.
 */

// ===== PIXEL PALETTES =====
export const PIXEL_PALETTES = {
  'nes': ['#000000','#fcfcfc','#f8f8f8','#bcbcbc','#7c7c7c','#a4e4fc','#3cbcfc','#0078f8','#0000fc','#b8b8f8','#6888fc','#0058f8','#0000bc','#d8b8f8','#9878f8','#6844fc','#4428bc','#f8b8f8','#f878f8','#d800cc','#940084','#f8a4c0','#f85898','#e40058','#a80020','#f0d0b0','#f87858','#f83800','#a81000','#fce0a8','#fca044','#e45c10','#881400','#f8d878','#f8b800','#ac7c00','#503000','#d8f878','#b8f818','#00b800','#007800','#b8f8b8','#58d854','#00a800','#006800','#b8f8d8','#58f898','#00a844','#005800','#00fcfc','#00e8d8','#008888','#004058'],
  'gameboy': ['#0f380f','#306230','#8bac0f','#9bbc0f'],
  'pico8': ['#000000','#1D2B53','#7E2553','#008751','#AB5236','#5F574F','#C2C3C7','#FFF1E8','#FF004D','#FFA300','#FFEC27','#00E436','#29ADFF','#83769C','#FF77A8','#FFCCAA'],
  'sweetie16': ['#1a1c2c','#5d275d','#b13e53','#ef7d57','#ffcd75','#a7f070','#38b764','#257179','#29366f','#3b5dc9','#41a6f6','#73eff7','#f4f4f4','#94b0c2','#566c86','#333c57'],
  'endesga32': ['#be4a2f','#d77643','#ead4aa','#e4a672','#b86f50','#733e39','#3e2731','#a22633','#e43b44','#f77622','#feae34','#fee761','#63c74d','#3e8948','#265c42','#193c3e','#124e89','#0099db','#2ce8f5','#ffffff','#c0cbdc','#8b9bb4','#5a6988','#3a4466','#262b44','#181425','#ff0044','#68386c','#b55088','#f6757a','#e8b796','#c28569'],
};

// ===== HUMANOID BASE GENERATION =====
interface BodyPart {
  name: string;
  pixels: [number, number][];
  color: string;
  pivot: [number, number];
}

const generateHumanoidBase = (
  w: number,
  h: number,
  palette: string[]
): BodyPart[] => {
  const cx = Math.floor(w / 2);
  const scale = Math.max(1, Math.floor(Math.min(w, h) / 16));
  const s = scale;

  const skinColor = palette[Math.min(4, palette.length - 1)];
  const hairColor = palette[Math.min(2, palette.length - 1)];
  const shirtColor = palette[Math.min(6, palette.length - 1)];
  const pantsColor = palette[Math.min(7, palette.length - 1)];
  const shoeColor = palette[Math.min(1, palette.length - 1)];
  const eyeColor = palette[0];

  const headY = Math.floor(h * 0.15);
  const bodyY = headY + 3 * s;
  const legY = bodyY + 4 * s;

  const parts: BodyPart[] = [];

  // Head
  const headPixels: [number, number][] = [];
  for (let dx = -1 * s; dx <= 1 * s; dx++) {
    for (let dy = 0; dy < 3 * s; dy++) {
      headPixels.push([cx + dx, headY + dy]);
    }
  }
  parts.push({ name: 'head', pixels: headPixels, color: skinColor, pivot: [cx, headY + s] });

  // Hair
  const hairPixels: [number, number][] = [];
  for (let dx = -1 * s; dx <= 1 * s; dx++) {
    hairPixels.push([cx + dx, headY]);
    if (dx === -1 * s || dx === 1 * s) hairPixels.push([cx + dx, headY + s]);
  }
  parts.push({ name: 'hair', pixels: hairPixels, color: hairColor, pivot: [cx, headY] });

  // Eyes
  parts.push({
    name: 'eyes',
    pixels: [[cx - s, headY + s], [cx + s, headY + s]],
    color: eyeColor,
    pivot: [cx, headY + s],
  });

  // Body/torso
  const bodyPixels: [number, number][] = [];
  for (let dx = -1 * s; dx <= 1 * s; dx++) {
    for (let dy = 0; dy < 4 * s; dy++) {
      bodyPixels.push([cx + dx, bodyY + dy]);
    }
  }
  parts.push({ name: 'torso', pixels: bodyPixels, color: shirtColor, pivot: [cx, bodyY + 2 * s] });

  // Left arm
  const lArmPixels: [number, number][] = [];
  for (let dy = 0; dy < 3 * s; dy++) {
    lArmPixels.push([cx - 2 * s, bodyY + dy]);
  }
  parts.push({ name: 'leftArm', pixels: lArmPixels, color: skinColor, pivot: [cx - 2 * s, bodyY] });

  // Right arm
  const rArmPixels: [number, number][] = [];
  for (let dy = 0; dy < 3 * s; dy++) {
    rArmPixels.push([cx + 2 * s, bodyY + dy]);
  }
  parts.push({ name: 'rightArm', pixels: rArmPixels, color: skinColor, pivot: [cx + 2 * s, bodyY] });

  // Left leg
  const lLegPixels: [number, number][] = [];
  for (let dy = 0; dy < 3 * s; dy++) {
    lLegPixels.push([cx - s, legY + dy]);
  }
  parts.push({ name: 'leftLeg', pixels: lLegPixels, color: pantsColor, pivot: [cx - s, legY] });

  // Right leg
  const rLegPixels: [number, number][] = [];
  for (let dy = 0; dy < 3 * s; dy++) {
    rLegPixels.push([cx + s, legY + dy]);
  }
  parts.push({ name: 'rightLeg', pixels: rLegPixels, color: pantsColor, pivot: [cx + s, legY] });

  // Shoes
  parts.push({
    name: 'leftShoe',
    pixels: [[cx - s, legY + 3 * s]],
    color: shoeColor,
    pivot: [cx - s, legY + 3 * s],
  });
  parts.push({
    name: 'rightShoe',
    pixels: [[cx + s, legY + 3 * s]],
    color: shoeColor,
    pivot: [cx + s, legY + 3 * s],
  });

  return parts;
};

// ===== TRANSFORM UTILS =====
const rotatePixels = (
  pixels: [number, number][],
  pivot: [number, number],
  angle: number
): [number, number][] => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return pixels.map(([x, y]) => {
    const dx = x - pivot[0];
    const dy = y - pivot[1];
    return [
      Math.round(pivot[0] + dx * cos - dy * sin),
      Math.round(pivot[1] + dx * sin + dy * cos),
    ];
  });
};

const translatePixels = (
  pixels: [number, number][],
  dx: number,
  dy: number
): [number, number][] => {
  return pixels.map(([x, y]) => [x + dx, y + dy]);
};

// ===== ANIMATION GENERATORS =====
type AnimationGenerator = (
  width: number,
  height: number,
  frameCount: number,
  palette: string[],
  referencePixels?: Pixel[]
) => Frame[];

const generateWalkCycle: AnimationGenerator = (w, h, frameCount, palette, referencePixels) => {
  const frames: Frame[] = [];
  const parts = generateHumanoidBase(w, h, palette);
  const s = Math.max(1, Math.floor(Math.min(w, h) / 16));

  for (let i = 0; i < frameCount; i++) {
    const t = (i / frameCount) * Math.PI * 2;
    const allPixels: Pixel[] = [];

    for (const part of parts) {
      let px = part.pixels;
      let pivot = part.pivot;

      // Body bob
      const bobY = Math.round(Math.abs(Math.sin(t * 2)) * s * 0.5);

      if (part.name === 'leftLeg') {
        const legAngle = Math.sin(t) * 0.4;
        px = rotatePixels(px, pivot, legAngle);
      } else if (part.name === 'rightLeg') {
        const legAngle = Math.sin(t + Math.PI) * 0.4;
        px = rotatePixels(px, pivot, legAngle);
      } else if (part.name === 'leftArm') {
        const armAngle = Math.sin(t + Math.PI) * 0.3;
        px = rotatePixels(px, pivot, armAngle);
      } else if (part.name === 'rightArm') {
        const armAngle = Math.sin(t) * 0.3;
        px = rotatePixels(px, pivot, armAngle);
      } else if (part.name === 'leftShoe') {
        const offsetX = Math.round(Math.sin(t) * s);
        const offsetY = Math.round(-Math.abs(Math.sin(t)) * s * 0.5);
        px = translatePixels(px, offsetX, offsetY);
      } else if (part.name === 'rightShoe') {
        const offsetX = Math.round(Math.sin(t + Math.PI) * s);
        const offsetY = Math.round(-Math.abs(Math.sin(t + Math.PI)) * s * 0.5);
        px = translatePixels(px, offsetX, offsetY);
      }

      // Apply bob to non-leg/shoe parts
      if (!['leftLeg', 'rightLeg', 'leftShoe', 'rightShoe'].includes(part.name)) {
        px = translatePixels(px, 0, -bobY);
      }

      const color = hexToColor(part.color);
      for (const [x, y] of px) {
        if (x >= 0 && x < w && y >= 0 && y < h) {
          allPixels.push({ x, y, color });
        }
      }
    }

    if (referencePixels && referencePixels.length > 0) {
      // Merge with reference
      const refSet = new Set(allPixels.map(p => `${p.x},${p.y}`));
      for (const rp of referencePixels) {
        if (!refSet.has(`${rp.x},${rp.y}`)) {
          allPixels.push(rp);
        }
      }
    }

    frames.push({ id: uuidv4(), pixels: allPixels, duration: 100 });
  }

  return frames;
};

const generateRunCycle: AnimationGenerator = (w, h, frameCount, palette, _referencePixels) => {
  void _referencePixels;
  const frames: Frame[] = [];
  const parts = generateHumanoidBase(w, h, palette);
  const s = Math.max(1, Math.floor(Math.min(w, h) / 16));

  for (let i = 0; i < frameCount; i++) {
    const t = (i / frameCount) * Math.PI * 2;
    const allPixels: Pixel[] = [];

    for (const part of parts) {
      let px = part.pixels;
      const pivot = part.pivot;
      const bobY = Math.round(Math.abs(Math.sin(t * 2)) * s);

      if (part.name === 'leftLeg') {
        px = rotatePixels(px, pivot, Math.sin(t) * 0.7);
      } else if (part.name === 'rightLeg') {
        px = rotatePixels(px, pivot, Math.sin(t + Math.PI) * 0.7);
      } else if (part.name === 'leftArm') {
        px = rotatePixels(px, pivot, Math.sin(t + Math.PI) * 0.5);
      } else if (part.name === 'rightArm') {
        px = rotatePixels(px, pivot, Math.sin(t) * 0.5);
      }

      if (!['leftLeg', 'rightLeg', 'leftShoe', 'rightShoe'].includes(part.name)) {
        px = translatePixels(px, 0, -bobY);
      }

      const color = hexToColor(part.color);
      for (const [x, y] of px) {
        if (x >= 0 && x < w && y >= 0 && y < h) {
          allPixels.push({ x, y, color });
        }
      }
    }

    frames.push({ id: uuidv4(), pixels: allPixels, duration: 80 });
  }
  return frames;
};

const generateJump: AnimationGenerator = (w, h, frameCount, palette) => {
  const frames: Frame[] = [];
  const parts = generateHumanoidBase(w, h, palette);
  const s = Math.max(1, Math.floor(Math.min(w, h) / 16));

  const jumpCurve = [0, -1, -3, -4, -3, -1, 0]; // relative Y positions

  for (let i = 0; i < frameCount; i++) {
    const allPixels: Pixel[] = [];
    const jumpOffset = Math.round((jumpCurve[i] || 0) * s);

    for (const part of parts) {
      let px = part.pixels;
      const pivot = part.pivot;

      if (i < 2) {
        // Crouch phase
        if (part.name === 'leftLeg' || part.name === 'rightLeg') {
          px = rotatePixels(px, pivot, 0.2);
        }
        px = translatePixels(px, 0, s);
      } else if (i >= 2 && i <= 4) {
        // Air phase
        if (part.name === 'leftArm' || part.name === 'rightArm') {
          px = rotatePixels(px, pivot, -0.5);
        }
      } else {
        // Landing
        if (part.name === 'leftLeg' || part.name === 'rightLeg') {
          px = rotatePixels(px, pivot, 0.15);
        }
      }

      px = translatePixels(px, 0, jumpOffset);

      const color = hexToColor(part.color);
      for (const [x, y] of px) {
        if (x >= 0 && x < w && y >= 0 && y < h) {
          allPixels.push({ x, y, color });
        }
      }
    }

    frames.push({ id: uuidv4(), pixels: allPixels, duration: 120 });
  }
  return frames;
};

const generateIdleBreathe: AnimationGenerator = (w, h, frameCount, palette) => {
  const frames: Frame[] = [];
  const parts = generateHumanoidBase(w, h, palette);
  const s = Math.max(1, Math.floor(Math.min(w, h) / 16));

  for (let i = 0; i < frameCount; i++) {
    const t = (i / frameCount) * Math.PI * 2;
    const allPixels: Pixel[] = [];
    const breatheY = Math.round(Math.sin(t) * s * 0.3);

    for (const part of parts) {
      let px = part.pixels;

      if (['head', 'hair', 'eyes', 'torso', 'leftArm', 'rightArm'].includes(part.name)) {
        px = translatePixels(px, 0, breatheY);
      }

      const color = hexToColor(part.color);
      for (const [x, y] of px) {
        if (x >= 0 && x < w && y >= 0 && y < h) {
          allPixels.push({ x, y, color });
        }
      }
    }

    frames.push({ id: uuidv4(), pixels: allPixels, duration: 200 });
  }
  return frames;
};

const generateAttack: AnimationGenerator = (w, h, frameCount, palette) => {
  const frames: Frame[] = [];
  const parts = generateHumanoidBase(w, h, palette);
  const s = Math.max(1, Math.floor(Math.min(w, h) / 16));

  // attack phases: windup, swing, follow-through, recovery
  const armAngles = [-0.3, -0.8, 0.5, 1.2, 0.6, 0];

  for (let i = 0; i < frameCount; i++) {
    const allPixels: Pixel[] = [];
    const armAngle = armAngles[i] || 0;
    const lunge = i === 2 || i === 3 ? s : 0;

    for (const part of parts) {
      let px = part.pixels;
      const pivot = part.pivot;

      if (part.name === 'rightArm') {
        px = rotatePixels(px, pivot, armAngle);
      }
      if (part.name === 'torso' || part.name === 'head' || part.name === 'hair' || part.name === 'eyes') {
        px = translatePixels(px, lunge, 0);
      }

      const color = hexToColor(part.color);
      for (const [x, y] of px) {
        if (x >= 0 && x < w && y >= 0 && y < h) {
          allPixels.push({ x, y, color });
        }
      }
    }

    // Add sword/weapon effect on swing frames
    if (i >= 2 && i <= 3) {
      const swordColor = hexToColor(palette[Math.min(12, palette.length - 1)]);
      const sx = Math.floor(w / 2) + 3 * s;
      const sy = Math.floor(h * 0.2);
      for (let dy = 0; dy < 4 * s; dy++) {
        if (sx < w && sy + dy < h) {
          allPixels.push({ x: sx, y: sy + dy, color: swordColor });
        }
      }
    }

    frames.push({ id: uuidv4(), pixels: allPixels, duration: 80 });
  }
  return frames;
};

const generateGenericAnimation: AnimationGenerator = (w, h, frameCount, palette, _referencePixels) => {
  void _referencePixels;
  const frames: Frame[] = [];
  const parts = generateHumanoidBase(w, h, palette);

  for (let i = 0; i < frameCount; i++) {
    const t = (i / frameCount) * Math.PI * 2;
    const allPixels: Pixel[] = [];

    for (const part of parts) {
      let px = part.pixels;
      const bobY = Math.round(Math.sin(t) * 0.5);
      px = translatePixels(px, 0, bobY);

      const color = hexToColor(part.color);
      for (const [x, y] of px) {
        if (x >= 0 && x < w && y >= 0 && y < h) {
          allPixels.push({ x, y, color });
        }
      }
    }

    frames.push({ id: uuidv4(), pixels: allPixels, duration: 100 });
  }
  return frames;
};

// ===== MAIN AI GENERATION FUNCTION =====
const GENERATORS: Record<string, AnimationGenerator> = {
  'walk-cycle': generateWalkCycle,
  'run-cycle': generateRunCycle,
  'jump': generateJump,
  'idle-breathe': generateIdleBreathe,
  'idle-blink': generateIdleBreathe,
  'idle-combat': generateIdleBreathe,
  'attack-melee': generateAttack,
  'attack-ranged': generateAttack,
  'cast-spell': generateAttack,
  'take-damage': generateGenericAnimation,
  'death': generateGenericAnimation,
  'dash': generateRunCycle,
  'climb': generateGenericAnimation,
  'explosion': generateGenericAnimation,
  'dust-cloud': generateGenericAnimation,
  'sparkle': generateGenericAnimation,
};

export const generateAnimation = (
  preset: AnimationPreset,
  width: number,
  height: number,
  paletteName: keyof typeof PIXEL_PALETTES = 'sweetie16',
  referencePixels?: Pixel[]
): Frame[] => {
  const palette = PIXEL_PALETTES[paletteName] || PIXEL_PALETTES.sweetie16;
  const generator = GENERATORS[preset.id] || generateGenericAnimation;
  return generator(width, height, preset.frameCount, palette, referencePixels);
};

export const generateFromPrompt = (
  prompt: string,
  width: number,
  height: number,
  paletteName: keyof typeof PIXEL_PALETTES = 'sweetie16'
): Frame[] => {
  const lower = prompt.toLowerCase();
  let presetId = 'idle-breathe';

  if (lower.includes('walk') || lower.includes('chód') || lower.includes('chodzi')) presetId = 'walk-cycle';
  else if (lower.includes('run') || lower.includes('bieg') || lower.includes('biega')) presetId = 'run-cycle';
  else if (lower.includes('jump') || lower.includes('skok') || lower.includes('skacz')) presetId = 'jump';
  else if (lower.includes('attack') || lower.includes('atak')) presetId = 'attack-melee';
  else if (lower.includes('dash') || lower.includes('sprint')) presetId = 'dash';
  else if (lower.includes('idle') || lower.includes('stoi')) presetId = 'idle-breathe';
  else if (lower.includes('spell') || lower.includes('magic') || lower.includes('zaklęcie')) presetId = 'cast-spell';

  const palette = PIXEL_PALETTES[paletteName] || PIXEL_PALETTES.sweetie16;
  const generator = GENERATORS[presetId] || generateGenericAnimation;
  const frameCount = presetId === 'walk-cycle' ? 8 : presetId === 'run-cycle' ? 6 : 6;

  return generator(width, height, frameCount, palette);
};
