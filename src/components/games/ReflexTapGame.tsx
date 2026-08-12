"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameResult } from "./GameResult";

const MAX_SCORE = 25;
const ROUND_MS = 15_000;
const GRID_SIZE = 9;

export function ReflexTapGame() {
  const [active, setActive] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_MS);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ score: number; xpAwarded: number | null; error: string | null } | null>(null);

  const scoreRef = useRef(0);
  const sessionTokenRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const activeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(async () => {
    const token = sessionTokenRef.current;
    const startTime = startedAtRef.current;
    if (!token || startTime === null) return;
    const finalScore = scoreRef.current;
    setResult({ score: finalScore, xpAwarded: null, error: null });
    const durationMs = Math.round(performance.now() - startTime);
    const res = await fetch("/api/games/reflex-tap/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: token, score: finalScore, durationMs }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult({ score: finalScore, xpAwarded: data.xpAwarded, error: null });
    } else {
      setResult({ score: finalScore, xpAwarded: null, error: data.error ?? "Could not submit score." });
    }
  }, []);

  const runRound = useCallback(
    (startTime: number) => {
      const spawn = () => {
        const elapsed = performance.now() - startTime;
        if (elapsed >= ROUND_MS) {
          setActive(null);
          return;
        }
        setActive(Math.floor(Math.random() * GRID_SIZE));
        activeTimeout.current = setTimeout(() => setActive(null), 850);
        spawnTimeout.current = setTimeout(spawn, 650 + Math.random() * 500);
      };
      spawn();

      tickInterval.current = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, ROUND_MS - elapsed);
        setTimeLeftMs(remaining);
        if (remaining <= 0) {
          if (tickInterval.current) clearInterval(tickInterval.current);
          if (activeTimeout.current) clearTimeout(activeTimeout.current);
          if (spawnTimeout.current) clearTimeout(spawnTimeout.current);
          setRunning(false);
          setActive(null);
          finish();
        }
      }, 100);
    },
    [finish]
  );

  const startSession = useCallback(async () => {
    setResult(null);
    setScore(0);
    scoreRef.current = 0;
    setActive(null);
    setTimeLeftMs(ROUND_MS);
    const res = await fetch("/api/games/reflex-tap/start", { method: "POST" });
    const data = await res.json();
    if (!res.ok) return;
    sessionTokenRef.current = data.sessionToken;
    const now = performance.now();
    startedAtRef.current = now;
    setRunning(true);
    runRound(now);
  }, [runRound]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startSession();
    return () => {
      if (activeTimeout.current) clearTimeout(activeTimeout.current);
      if (spawnTimeout.current) clearTimeout(spawnTimeout.current);
      if (tickInterval.current) clearInterval(tickInterval.current);
    };
  }, [startSession]);

  function tap(index: number) {
    if (!running || index !== active) return;
    setActive(null);
    if (activeTimeout.current) clearTimeout(activeTimeout.current);
    scoreRef.current = Math.min(MAX_SCORE, scoreRef.current + 1);
    setScore(scoreRef.current);
  }

  if (result) {
    return (
      <GameResult
        score={result.score}
        maxScore={MAX_SCORE}
        xpAwarded={result.xpAwarded}
        error={result.error}
        onPlayAgain={startSession}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between text-sm font-semibold mb-4">
        <span>Score: {score}</span>
        <span>{Math.ceil(timeLeftMs / 1000)}s</span>
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto" role="grid" aria-label="Reflex tap board">
        {Array.from({ length: GRID_SIZE }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(i)}
            aria-label={active === i ? "Target" : "Empty cell"}
            className={`aspect-square rounded-xl transition ${
              active === i ? "bg-[var(--color-brand-warm)] scale-95" : "bg-black/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
