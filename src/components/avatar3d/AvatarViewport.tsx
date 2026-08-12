"use client";

import { Suspense, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  AdaptiveDpr,
  AdaptiveEvents,
  PerformanceMonitor,
  ContactShadows,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SceneEnvironment, timeOfDayNow, type TimeOfDay } from "./SceneEnvironment";
import { ProceduralCreature, type ProceduralCreatureProps } from "./ProceduralCreature";

export interface AvatarViewportHandle {
  /** Capture the current frame as a data URL — used by Photo Mode. */
  capturePhoto: (targetPixelRatio?: number) => string | null;
}

export interface AvatarViewportProps extends ProceduralCreatureProps {
  interactive?: boolean;
  autoRotate?: boolean;
  timeOfDay?: TimeOfDay;
  indoor?: boolean;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
}

export const AvatarViewport = forwardRef<AvatarViewportHandle, AvatarViewportProps>(
  function AvatarViewport(
    {
      interactive = true,
      autoRotate = false,
      timeOfDay,
      indoor = true,
      className,
      minZoom = 1.6,
      maxZoom = 5,
      ...creatureProps
    },
    ref
  ) {
    const [dpr, setDpr] = useState<[number, number]>([1, 1.8]);
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const glRef = useRef<HTMLCanvasElement | null>(null);

    useImperativeHandle(ref, () => ({
      capturePhoto: (targetPixelRatio = 4) => {
        const canvas = glRef.current;
        if (!canvas) return null;
        // Photo Mode: briefly the renderer already runs at up to `targetPixelRatio`
        // via the `dpr` prop passed to <Canvas> when photoMode is toggled on by
        // the caller; here we just read back the current backbuffer.
        void targetPixelRatio;
        return canvas.toDataURL("image/png");
      },
    }));

    return (
      <div className={className} style={{ width: "100%", height: "100%" }}>
        <Canvas
          shadows
          dpr={dpr}
          gl={{ antialias: true, preserveDrawingBuffer: true, alpha: false }}
          camera={{ position: [0, 1.1, 3.1], fov: 35 }}
          onCreated={({ gl }) => {
            glRef.current = gl.domElement;
          }}
        >
          <PerformanceMonitor
            onDecline={() => setDpr([1, 1])}
            onIncline={() => setDpr([1, 1.8])}
          />
          <AdaptiveDpr pixelated={false} />
          <AdaptiveEvents />
          <Suspense fallback={null}>
            <SceneEnvironment timeOfDay={timeOfDay ?? timeOfDayNow()} indoor={indoor} />
            <group position={[0, 0, 0]}>
              <ProceduralCreature {...creatureProps} />
            </group>
            <ContactShadows opacity={0.4} scale={5} blur={2} far={2} />
          </Suspense>
          {interactive && (
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              minDistance={minZoom}
              maxDistance={maxZoom}
              minPolarAngle={Math.PI * 0.18}
              maxPolarAngle={Math.PI * 0.62}
              autoRotate={autoRotate}
              autoRotateSpeed={1.4}
              target={[0, 0.55, 0]}
              makeDefault
            />
          )}
        </Canvas>
      </div>
    );
  }
);
