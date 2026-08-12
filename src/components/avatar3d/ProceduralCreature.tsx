"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AvatarSpecies, ResolvedTraits } from "@/types/species";
import type { AnimationState } from "./parts/types";
import { Eyes } from "./parts/Eyes";
import { Mouth } from "./parts/Mouth";
import { Ears } from "./parts/Ears";
import { buildPatternTexture } from "./parts/patternTexture";
import { getVisualDetailForLevel } from "@/lib/evolution";
import { seededRng } from "@/lib/rng";

export interface ProceduralCreatureProps {
  species: AvatarSpecies;
  traits: ResolvedTraits;
  seed: string;
  bodyColor: string;
  secondaryColor: string;
  faceColor: string;
  level: number;
  state?: AnimationState;
  /** Overall uniform scale multiplier applied on top of evolution scale. */
  scaleMultiplier?: number;
}

/**
 * The single procedural rig every species is built from. Silhouette,
 * proportion, and material differences all come from `species.proportions`
 * / `species.materialSlots` data — not from separate per-species mesh
 * components — so a 6th species is "write a manifest entry," not "write a
 * new renderer."
 */
export function ProceduralCreature({
  species,
  traits,
  seed,
  bodyColor,
  secondaryColor,
  faceColor,
  level,
  state = "idle",
  scaleMultiplier = 1,
}: ProceduralCreatureProps) {
  const root = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  // Deterministic per-avatar time offset (derived from the seed, not
  // Math.random) so idle animations desync slightly between avatars
  // without the render function performing an impure call.
  const t = useRef(seededRng(`${seed}:anim-offset`)() * 10);

  const detail = useMemo(
    () => getVisualDetailForLevel(species, level),
    [species, level]
  );
  const { proportions } = species;
  const isEgg = detail.stageId === "egg";

  const patternTex = useMemo(() => {
    if (typeof document === "undefined") return null;
    return buildPatternTexture(traits.patternVariant, seed, bodyColor, secondaryColor);
  }, [traits.patternVariant, seed, bodyColor, secondaryColor]);

  const bodyMat = species.materialSlots.body;
  const secondaryMat = species.materialSlots.secondary;
  const roughnessJitter = 1 - detail.materialSophistication * 0.35;

  useFrame((_, delta) => {
    t.current += delta;
    const time = t.current;
    const speedByPersonality: Record<string, number> = {
      energetic: 1.6, restless: 1.7, playful: 1.5, competitive: 1.4,
      curious: 1.2, brave: 1.1, chatty: 1.3, cheerful: 1.3,
      dreamy: 0.6, quiet: 0.7, gentle: 0.8, shy: 0.75, reserved: 0.75,
      wise: 0.8, dignified: 0.8, protective: 1.0, thoughtful: 0.85,
      loyal: 1.0, stubborn: 0.9, watchful: 0.9, generous: 0.9, confident: 1.1,
      friendly: 1.15,
    };
    const speed = speedByPersonality[traits.personality] ?? 1;

    if (!root.current) return;

    // Base bob/breathing.
    let bobAmp = 0.035;
    let bobSpeed = 1.6 * speed;
    let tilt = 0;

    switch (state) {
      case "sleep":
        bobAmp = 0.015;
        bobSpeed = 0.5;
        break;
      case "eat":
        bobAmp = 0.05;
        bobSpeed = 3.2;
        break;
      case "clean":
        tilt = Math.sin(time * 6) * 0.15;
        bobAmp = 0.02;
        break;
      case "play":
        bobAmp = 0.12;
        bobSpeed = 4;
        break;
      case "illness":
        bobAmp = 0.02;
        bobSpeed = 0.9;
        tilt = 0.12;
        break;
      case "recovery":
        bobAmp = 0.06;
        bobSpeed = 2.2;
        break;
      case "celebration":
        bobAmp = 0.18;
        bobSpeed = 5;
        break;
      case "comfort":
        bobAmp = 0.03;
        bobSpeed = 1.1;
        tilt = 0.08;
        break;
      case "walk":
        bobAmp = 0.05;
        bobSpeed = 4;
        break;
    }

    if (!isEgg) {
      root.current.position.y = Math.sin(time * bobSpeed) * bobAmp;
      root.current.rotation.z = THREE.MathUtils.lerp(
        root.current.rotation.z,
        tilt,
        0.08
      );
      root.current.rotation.y =
        state === "celebration"
          ? Math.sin(time * 2) * 0.35
          : THREE.MathUtils.lerp(root.current.rotation.y, 0, 0.05);
    } else {
      root.current.position.y = Math.sin(time * 0.8) * 0.01;
    }

    if (headRef.current) {
      headRef.current.rotation.y =
        traits.personality === "curious" || traits.personality === "watchful"
          ? Math.sin(time * 0.7) * 0.25
          : Math.sin(time * 0.4) * 0.08;
      headRef.current.rotation.x = state === "eat" ? Math.sin(time * 8) * 0.1 : 0;
    }

    const limbSwing = state === "walk" || state === "play" ? 0.9 : state === "celebration" ? 1.2 : 0.15;
    const limbSpeed = state === "walk" ? 5 : state === "celebration" ? 6 : 1.4 * speed;
    if (leftArm.current && rightArm.current && !isEgg) {
      leftArm.current.rotation.x = Math.sin(time * limbSpeed) * limbSwing;
      rightArm.current.rotation.x = -Math.sin(time * limbSpeed) * limbSwing;
    }
    if (leftLeg.current && rightLeg.current && !isEgg) {
      const legSwing = state === "walk" ? 0.5 : 0.05;
      leftLeg.current.rotation.x = -Math.sin(time * limbSpeed) * legSwing;
      rightLeg.current.rotation.x = Math.sin(time * limbSpeed) * legSwing;
    }
  });

  const headRadius = 0.42 * proportions.headToBodyRatio + 0.28;
  const torsoHeight = 0.5 + proportions.legLength * 0.15;
  const torsoRadius = 0.26 * proportions.torsoWidth + 0.18;
  const limbRadius = 0.06 * proportions.limbThickness + 0.03;
  const legLen = 0.28 * proportions.legLength + 0.14;
  const armLen = 0.32;
  const neckLen = 0.06 + proportions.neckLength * 0.32;

  const scale = detail.scale * scaleMultiplier;

  if (isEgg) {
    return (
      <group ref={root} scale={scale}>
        <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshPhysicalMaterial
            color={bodyColor}
            roughness={0.25}
            metalness={0.1}
            clearcoat={0.6}
          />
        </mesh>
        <mesh position={[0, 0.42, 0.36]}>
          <circleGeometry args={[0.1, 16]} />
          <meshStandardMaterial
            color={faceColor}
            emissive={secondaryColor}
            emissiveIntensity={0.4 + detail.glow}
          />
        </mesh>
      </group>
    );
  }

  const feetShape =
    proportions.build === "athletic" ? (
      <coneGeometry args={[limbRadius * 1.3, 0.14, 8]} />
    ) : proportions.build === "elegant" || proportions.build === "slender" ? (
      <capsuleGeometry args={[limbRadius * 0.9, 0.08, 4, 8]} />
    ) : (
      <boxGeometry args={[limbRadius * 2.4, 0.12, limbRadius * 3]} />
    );

  const torsoGeometry =
    proportions.build === "stocky" || proportions.build === "compact" ? (
      <capsuleGeometry args={[torsoRadius, torsoHeight * 0.6, 6, 16]} />
    ) : (
      <capsuleGeometry args={[torsoRadius * 0.85, torsoHeight, 6, 16]} />
    );

  const accessory = detail.accessoryProminence > 0.35 && (
    <AccessoryBit
      build={proportions.build}
      prominence={detail.accessoryProminence}
      color={secondaryColor}
      glow={detail.glow}
      faceColor={faceColor}
      headRadius={headRadius}
    />
  );

  return (
    <group ref={root} scale={scale}>
      {/* Legs */}
      <group ref={leftLeg} position={[-torsoRadius * 0.55, legLen, 0]}>
        <mesh castShadow position={[0, -legLen / 2, 0]}>
          <capsuleGeometry args={[limbRadius, legLen * 0.7, 4, 8]} />
          <meshStandardMaterial color={secondaryColor} roughness={secondaryMat.roughness * roughnessJitter} metalness={secondaryMat.metalness} />
        </mesh>
        <mesh castShadow position={[0, -legLen - 0.03, limbRadius * 0.4]}>
          {feetShape}
          <meshStandardMaterial color={secondaryColor} roughness={0.4} metalness={secondaryMat.metalness} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[torsoRadius * 0.55, legLen, 0]}>
        <mesh castShadow position={[0, -legLen / 2, 0]}>
          <capsuleGeometry args={[limbRadius, legLen * 0.7, 4, 8]} />
          <meshStandardMaterial color={secondaryColor} roughness={secondaryMat.roughness * roughnessJitter} metalness={secondaryMat.metalness} />
        </mesh>
        <mesh castShadow position={[0, -legLen - 0.03, limbRadius * 0.4]}>
          {feetShape}
          <meshStandardMaterial color={secondaryColor} roughness={0.4} metalness={secondaryMat.metalness} />
        </mesh>
      </group>

      {/* Torso */}
      <mesh castShadow receiveShadow position={[0, legLen * 2 + torsoHeight * 0.4, 0]}>
        {torsoGeometry}
        <meshStandardMaterial
          map={patternTex ?? undefined}
          color={patternTex ? "#ffffff" : bodyColor}
          roughness={bodyMat.roughness * roughnessJitter}
          metalness={bodyMat.metalness}
        />
      </mesh>

      {/* Arms */}
      <group
        ref={leftArm}
        position={[-torsoRadius - limbRadius * 0.4, legLen * 2 + torsoHeight * 0.75, 0]}
      >
        <mesh castShadow position={[0, -armLen / 2, 0]}>
          <capsuleGeometry args={[limbRadius * 0.85, armLen * 0.7, 4, 8]} />
          <meshStandardMaterial color={secondaryColor} roughness={secondaryMat.roughness} metalness={secondaryMat.metalness} />
        </mesh>
      </group>
      <group
        ref={rightArm}
        position={[torsoRadius + limbRadius * 0.4, legLen * 2 + torsoHeight * 0.75, 0]}
      >
        <mesh castShadow position={[0, -armLen / 2, 0]}>
          <capsuleGeometry args={[limbRadius * 0.85, armLen * 0.7, 4, 8]} />
          <meshStandardMaterial color={secondaryColor} roughness={secondaryMat.roughness} metalness={secondaryMat.metalness} />
        </mesh>
      </group>

      {/* Neck + Head */}
      <group position={[0, legLen * 2 + torsoHeight * 1.05, 0]}>
        {neckLen > 0.1 && (
          <mesh castShadow position={[0, neckLen / 2, 0]}>
            <cylinderGeometry args={[headRadius * 0.35, headRadius * 0.4, neckLen, 12]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.4} metalness={secondaryMat.metalness} />
          </mesh>
        )}
        <group ref={headRef} position={[0, neckLen + headRadius * 0.85, 0]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[headRadius, 32, 32]} />
            <meshStandardMaterial
              color={bodyColor}
              roughness={bodyMat.roughness * roughnessJitter}
              metalness={bodyMat.metalness}
            />
          </mesh>
          {/* Face plate */}
          <mesh position={[0, headRadius * 0.05, headRadius * 0.86]}>
            <circleGeometry args={[headRadius * 0.62, 24]} />
            <meshStandardMaterial
              color={faceColor}
              roughness={species.materialSlots.face.roughness}
              metalness={species.materialSlots.face.metalness}
            />
          </mesh>
          <group position={[0, headRadius * 0.1, headRadius * 0.95]}>
            <Eyes
              variant={traits.eyeVariant}
              accentColor={secondaryColor}
              faceColor={faceColor}
              state={state}
              glow={detail.glow}
              scale={headRadius * 1.5}
            />
          </group>
          <group position={[0, -headRadius * 0.28, headRadius * 0.95]}>
            <Mouth
              variant={traits.mouthVariant}
              accentColor={secondaryColor}
              faceColor={faceColor}
              state={state}
              glow={detail.glow}
              scale={headRadius * 1.3}
            />
          </group>
          <Ears
            variant={traits.earVariant}
            accentColor={secondaryColor}
            faceColor={faceColor}
            state={state}
            glow={detail.glow}
            scale={headRadius * 1.1}
          />
          {accessory}
        </group>
      </group>
    </group>
  );
}

function AccessoryBit({
  build,
  prominence,
  color,
  glow,
  faceColor,
  headRadius,
}: {
  build: AvatarSpecies["proportions"]["build"];
  prominence: number;
  color: string;
  glow: number;
  faceColor: string;
  headRadius: number;
}) {
  const scale = 0.4 + prominence * 0.8;
  const material = (
    <meshStandardMaterial
      color={color}
      emissive={faceColor}
      emissiveIntensity={glow * 0.5}
      roughness={0.3}
      metalness={0.4}
    />
  );
  if (build === "elegant") {
    return (
      <mesh position={[0, headRadius * 0.95, -headRadius * 0.2]} scale={scale}>
        <coneGeometry args={[0.05, 0.22, 4]} />
        {material}
      </mesh>
    );
  }
  if (build === "slender") {
    return (
      <group scale={scale}>
        <mesh position={[-0.1, headRadius * 0.95, -headRadius * 0.1]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.025, 0.16, 6]} />
          {material}
        </mesh>
        <mesh position={[0.1, headRadius * 0.95, -headRadius * 0.1]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.025, 0.16, 6]} />
          {material}
        </mesh>
      </group>
    );
  }
  if (build === "athletic") {
    return (
      <mesh position={[0, headRadius * 0.9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={scale}>
        <torusGeometry args={[0.1, 0.015, 6, 16, Math.PI]} />
        {material}
      </mesh>
    );
  }
  // stocky / compact — small crest bump.
  return (
    <mesh position={[0, headRadius * 0.98, -headRadius * 0.1]} scale={scale}>
      <sphereGeometry args={[0.06, 12, 12]} />
      {material}
    </mesh>
  );
}
