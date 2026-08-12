"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CreaturePartProps } from "./types";

/** Shared, parametric mouth builder — same behavior contract as `Eyes`. */
export function Mouth({ variant, accentColor, state, glow, scale = 1 }: CreaturePartProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (!mesh.current) return;
    if (state === "eat") {
      const chomp = Math.abs(Math.sin(t.current * 8));
      mesh.current.scale.y = 0.5 + chomp * 0.9;
    } else if (state === "celebration") {
      mesh.current.scale.setScalar(1 + Math.sin(t.current * 6) * 0.15);
    } else if (state === "play") {
      mesh.current.scale.y = 0.8 + Math.abs(Math.sin(t.current * 4)) * 0.4;
    } else {
      mesh.current.scale.setScalar(1);
    }
  });

  if (variant === "none") return null;

  const material = (
    <meshStandardMaterial
      color={accentColor}
      emissive={accentColor}
      emissiveIntensity={0.3 + glow * 0.7}
      roughness={0.35}
    />
  );

  let geometry: React.ReactNode;
  switch (variant) {
    case "screen-smile":
    case "small-smile":
    case "soft-curve":
    case "stub-smile":
      geometry = <torusGeometry args={[0.09 * scale, 0.018 * scale, 8, 16, Math.PI]} />;
      break;
    case "screen-flat":
    case "flat-vent":
    case "thin-line":
    case "hairline":
    case "faint-glow-line":
    case "confident-line":
    case "seam-line":
      geometry = <boxGeometry args={[0.16 * scale, 0.02 * scale, 0.02]} />;
      break;
    case "screen-open":
    case "open-cheer":
    case "open-shout":
      geometry = <sphereGeometry args={[0.06 * scale, 12, 12]} />;
      break;
    case "screen-giggle":
    case "grin":
      geometry = <torusGeometry args={[0.1 * scale, 0.025 * scale, 8, 16, Math.PI * 1.2]} />;
      break;
    case "screen-surprised":
    case "small-o":
    case "small-dot":
      geometry = <torusGeometry args={[0.035 * scale, 0.02 * scale, 8, 16]} />;
      break;
    case "chevron":
    case "smirk":
      geometry = <boxGeometry args={[0.1 * scale, 0.02 * scale, 0.02]} />;
      break;
    default:
      geometry = <sphereGeometry args={[0.04 * scale, 10, 10]} />;
  }

  return (
    <mesh ref={mesh}>
      {geometry}
      {material}
    </mesh>
  );
}
