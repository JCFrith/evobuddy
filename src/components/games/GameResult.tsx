"use client";

import Link from "next/link";

export function GameResult({
  score,
  maxScore,
  xpAwarded,
  error,
  onPlayAgain,
}: {
  score: number;
  maxScore: number;
  xpAwarded: number | null;
  error: string | null;
  onPlayAgain: () => void;
}) {
  return (
    <div className="text-center py-10">
      <p className="text-5xl mb-3" aria-hidden>{error ? "⚠️" : "🎉"}</p>
      {error ? (
        <p className="text-red-600 font-semibold mb-4">{error}</p>
      ) : (
        <>
          <p className="font-display text-2xl font-bold mb-1">
            {score} / {maxScore}
          </p>
          <p className="opacity-70 mb-4">
            {xpAwarded !== null ? `+${xpAwarded} XP earned` : "Submitting…"}
          </p>
        </>
      )}
      <div className="flex justify-center gap-3">
        <button
          onClick={onPlayAgain}
          className="rounded-xl bg-[var(--color-brand)] px-4 py-2 font-bold text-white"
        >
          Play again
        </button>
        <Link href="/pet" className="rounded-xl border-2 border-[var(--color-brand)] px-4 py-2 font-bold text-[var(--color-brand)]">
          Back to buddy
        </Link>
      </div>
    </div>
  );
}
