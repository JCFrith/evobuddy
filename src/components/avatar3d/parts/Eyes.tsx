"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CreaturePartProps } from "./types";
import { seededRng } from "@/lib/rng";

/**
 * Shared, parametric eye builder. Every species' `eyeVariants` strings map
 * onto this same renderer — the *shape* differs per variant, the *behavior*
 * (blinking, mood-driven openness/brightness) is identical across species.
 */
export function Eyes({ variant, accentColor, state, glow, scale = 1 }: CreaturePartProps) {
  const group = useRef<THREE.Group>(null);
  const blink = useRef(0);
  // Deterministic per-variant blink cadence instead of Math.random() in
  // the render body (blink *timing* jitter after this still uses
  // Math.random(), but only from inside the useFrame animation loop,
  // which runs outside React's render phase).
  const nextBlinkAt = useRef(2 + seededRng(`blink:${variant}:${accentColor}`)() * 3);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (!group.current) return;

    let openness = 1;
    if (state === "sleep") {
      openness = 0.06;
    } else if (state === "illness") {
      openness = 0.45;
    } else {
      if (t.current > nextBlinkAt.current) {
        blink.current = 0.12;
        nextBlinkAt.current = t.current + 2.5 + Math.random() * 3.5;
      }
      if (blink.current > 0) {
        blink.current -= delta;
        openness = 0.08;
      }
    }
    const pulse =
      state === "celebration"
        ? 1 + Math.sin(t.current * 10) * 0.12
        : state === "illness"
          ? 1 - Math.sin(t.current * 3) * 0.08
          : 1;

    group.current.scale.set(1, openness * pulse, 1);
  });

  const emissiveIntensity = useMemo(() => {
    const base = 0.6 + glow * 1.2;
    return state === "celebration" ? base * 1.6 : state === "illness" ? base * 0.4 : base;
  }, [glow, state]);

  const eyeColor = state === "illness" ? "#8fae7a" : accentColor;

  const renderPair = (geometry: React.ReactNode) => (
    <>
      <mesh position={[-0.16 * scale, 0, 0]}>{geometry}</mesh>
      <mesh position={[0.16 * scale, 0, 0]}>{geometry}</mesh>
    </>
  );

  const material = (
    <meshStandardMaterial
      color={eyeColor}
      emissive={eyeColor}
      emissiveIntensity={emissiveIntensity}
      roughness={0.15}
      metalness={0.1}
    />
  );

  let content: React.ReactNode;
  switch (variant) {
    case "huge-lens":
    case "wide-round":
    case "bright-round":
      content = renderPair(
        <>
          <sphereGeometry args={[0.11 * scale, 20, 20]} />
          {material}
        </>
      );
      break;
    case "sleepy-round":
    case "half-lid":
    case "half-closed":
      content = renderPair(
        <>
          <sphereGeometry args={[0.09 * scale, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          {material}
        </>
      );
      break;
    case "sparkle-round":
    case "starry":
    case "star-blink":
      content = renderPair(
        <>
          <octahedronGeometry args={[0.1 * scale, 0]} />
          {material}
        </>
      );
      break;
    case "focused-narrow":
    case "narrow-focus":
    case "almond-glow":
      content = renderPair(
        <>
          <capsuleGeometry args={[0.045 * scale, 0.1 * scale, 4, 8]} />
          {material}
        </>
      );
      break;
    case "dot-glow":
    case "twin-dot":
      content = renderPair(
        <>
          <sphereGeometry args={[0.055 * scale, 14, 14]} />
          {material}
        </>
      );
      break;
    case "half-moon":
    case "crescent-glow":
      content = renderPair(
        <>
          <torusGeometry args={[0.08 * scale, 0.03 * scale, 8, 16, Math.PI]} />
          {material}
        </>
      );
      break;
    case "spiral":
    case "wink":
      content = (
        <>
          <mesh position={[-0.16 * scale, 0, 0]}>
            <sphereGeometry args={[0.09 * scale, 16, 16]} />
            {material}
          </mesh>
          <mesh position={[0.16 * scale, 0, 0]} scale={[1, 0.08, 1]}>
            <sphereGeometry args={[0.09 * scale, 16, 16]} />
            {material}
          </mesh>
        </>
      );
      break;
    case "chevron-sharp":
      content = renderPair(
        <>
          <coneGeometry args={[0.08 * scale, 0.14 * scale, 3]} />
          {material}
        </>
      );
      break;
    case "gentle-arc":
    case "soft-blink":
    case "wide-scan":
    case "twin-ring":
      content = renderPair(
        <>
          <torusGeometry args={[0.09 * scale, 0.025 * scale, 10, 20]} />
          {material}
        </>
      );
      break;
    case "calm-oval":
    default:
      content = renderPair(
        <>
          <sphereGeometry args={[0.1 * scale, 16, 16]} />
          <meshStandardMaterial
            color={eyeColor}
            emissive={eyeColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.2}
          />
        </>
      );
      break;
  }

  return <group ref={group}>{content}</group>;
}
