"use client";

import { ContactShadows, Environment } from "@react-three/drei";
import { useMemo } from "react";

export type TimeOfDay = "day" | "dusk" | "night";

/** Derive day/dusk/night purely from the real local clock — no config needed. */
export function timeOfDayNow(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 18) return "day";
  if ((hour >= 18 && hour < 20) || (hour >= 5 && hour < 7)) return "dusk";
  return "night";
}

const LIGHT_RIGS: Record<
  TimeOfDay,
  { sky: string; sun: string; sunIntensity: number; ambient: string; ambientIntensity: number; fog: string }
> = {
  day: { sky: "#bfe3f5", sun: "#fff6e0", sunIntensity: 2.6, ambient: "#dfeeff", ambientIntensity: 0.55, fog: "#bfe3f5" },
  dusk: { sky: "#f3b783", sun: "#ffb066", sunIntensity: 1.7, ambient: "#8f7aa8", ambientIntensity: 0.5, fog: "#e7a97e" },
  night: { sky: "#141c30", sun: "#8fa8ff", sunIntensity: 0.55, ambient: "#26305c", ambientIntensity: 0.5, fog: "#141c30" },
};

export function SceneEnvironment({
  timeOfDay = "day",
  indoor = true,
}: {
  timeOfDay?: TimeOfDay;
  indoor?: boolean;
}) {
  const rig = useMemo(() => LIGHT_RIGS[timeOfDay], [timeOfDay]);

  return (
    <>
      <color attach="background" args={[rig.sky]} />
      {!indoor && <fog attach="fog" args={[rig.fog, 8, 22]} />}
      <ambientLight color={rig.ambient} intensity={rig.ambientIntensity} />
      <directionalLight
        color={rig.sun}
        intensity={rig.sunIntensity}
        position={[3, 5, 4]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <hemisphereLight
        color={rig.sky}
        groundColor="#2a2a2a"
        intensity={timeOfDay === "night" ? 0.25 : 0.4}
      />
      <Environment preset={timeOfDay === "night" ? "night" : "city"} environmentIntensity={0.4} />
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.55}
        scale={6}
        blur={2.4}
        far={2}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.001, 0]}>
        <circleGeometry args={[6, 48]} />
        <meshStandardMaterial
          color={indoor ? "#e8e2d6" : "#7bab6e"}
          roughness={0.9}
        />
      </mesh>
    </>
  );
}
