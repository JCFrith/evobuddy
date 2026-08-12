"use client";

import type { CreaturePartProps } from "./types";

/** Shared, parametric ear builder — mounted by each species head component. */
export function Ears({ variant, accentColor, faceColor, glow, scale = 1 }: CreaturePartProps) {
  if (variant === "none") return null;

  const bodyMat = (
    <meshStandardMaterial color={accentColor} roughness={0.5} metalness={0.15} />
  );
  const glowMat = (
    <meshStandardMaterial
      color={faceColor}
      emissive={accentColor}
      emissiveIntensity={0.4 + glow * 0.6}
      roughness={0.3}
    />
  );

  const side = (mirror: 1 | -1, geometry: React.ReactNode) => (
    <mesh position={[0.42 * scale * mirror, 0, 0]} rotation={[0, 0, mirror * -0.15]}>
      {geometry}
    </mesh>
  );

  let piece: React.ReactNode;
  switch (variant) {
    case "round-pod":
    case "side-disc":
      piece = (
        <>
          <cylinderGeometry args={[0.09 * scale, 0.09 * scale, 0.05 * scale, 20]} />
          {bodyMat}
        </>
      );
      break;
    case "flat-plate":
    case "flat-fin":
    case "small-fin":
      piece = (
        <>
          <boxGeometry args={[0.03 * scale, 0.18 * scale, 0.14 * scale]} />
          {bodyMat}
        </>
      );
      break;
    case "twin-antenna":
    case "wire-antenna":
    case "twin-wire":
    case "antenna-bud":
      piece = (
        <>
          <cylinderGeometry args={[0.012 * scale, 0.012 * scale, 0.28 * scale, 8]} />
          {bodyMat}
        </>
      );
      break;
    case "finned":
    case "fin-swept":
    case "crest-fin":
    case "twin-blade":
      piece = (
        <>
          <coneGeometry args={[0.06 * scale, 0.22 * scale, 4]} />
          {bodyMat}
        </>
      );
      break;
    case "side-ring":
    case "ring-halo":
      piece = (
        <>
          <torusGeometry args={[0.09 * scale, 0.02 * scale, 8, 16]} />
          {glowMat}
        </>
      );
      break;
    case "feather-tuft":
    case "twin-tuft":
    case "trailing-wisp":
      piece = (
        <>
          <coneGeometry args={[0.03 * scale, 0.16 * scale, 6]} />
          {bodyMat}
        </>
      );
      break;
    case "clipped-bud":
    default:
      piece = (
        <>
          <sphereGeometry args={[0.05 * scale, 12, 12]} />
          {bodyMat}
        </>
      );
      break;
  }

  return (
    <>
      {side(1, piece)}
      {side(-1, piece)}
    </>
  );
}
