import * as THREE from "three";
import { seededRng } from "@/lib/rng";

/**
 * Procedurally paints a body-pattern texture on an offscreen canvas and
 * returns it as a Three.js texture. This is how "randomized pattern"
 * customization is implemented without any external texture files —
 * every pattern is generated at runtime from the avatar's seed.
 */
export function buildPatternTexture(
  variant: string,
  seed: string,
  bodyColor: string,
  secondaryColor: string,
  size = 512
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rng = seededRng(`pattern:${variant}:${seed}`);

  ctx.fillStyle = bodyColor;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = secondaryColor;

  switch (variant) {
    case "belt-stripe":
    case "racing-stripe":
    case "banded":
      ctx.fillRect(0, size * 0.42, size, size * 0.16);
      break;
    case "patch":
    case "patches": {
      const count = 4 + Math.floor(rng() * 3);
      for (let i = 0; i < count; i++) {
        const r = size * (0.06 + rng() * 0.08);
        const x = rng() * size;
        const y = rng() * size;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.8, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "chevrons":
    case "chevron-accent": {
      const step = size / 6;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * step);
        ctx.lineTo(step * 0.5, i * step + step * 0.5);
        ctx.lineTo(0, i * step + step);
        ctx.lineTo(step * 0.3, i * step + step);
        ctx.lineTo(step * 0.8, i * step + step * 0.5);
        ctx.lineTo(step * 0.3, i * step);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "speckle":
    case "speckle-fade":
    case "star-flecks": {
      const count = 60 + Math.floor(rng() * 60);
      for (let i = 0; i < count; i++) {
        const r = size * (0.004 + rng() * 0.01);
        ctx.globalAlpha = 0.4 + rng() * 0.6;
        ctx.beginPath();
        ctx.arc(rng() * size, rng() * size, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "screen-scanline": {
      for (let y = 0; y < size; y += 10) {
        ctx.globalAlpha = 0.18;
        ctx.fillRect(0, y, size, 3);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "two-tone-split":
    case "split-panel":
    case "dual-panel":
      ctx.fillRect(size * 0.5, 0, size * 0.5, size);
      break;
    case "dot-grid": {
      const step = size / 10;
      for (let y = step / 2; y < size; y += step) {
        for (let x = step / 2; x < size; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, step * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "gradient-fade":
    case "soft-gradient":
    case "misty-band": {
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, bodyColor);
      grad.addColorStop(1, secondaryColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      break;
    }
    case "etched-seam":
    case "filigree": {
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = size * 0.006;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const y = size * (0.15 + i * 0.17);
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(size * 0.3, y - 20, size * 0.7, y + 20, size, y);
        ctx.stroke();
      }
      break;
    }
    case "twin-tone":
      ctx.fillRect(0, size * 0.5, size, size * 0.5);
      break;
    case "solid":
    default:
      // Body color only — no secondary accent.
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
