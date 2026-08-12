"use client";

import { useEffect, useMemo, useState } from "react";
import { GameResult } from "./GameResult";

const SYMBOLS = ["🍎", "🧼", "🎾", "⭐", "🌙", "🔥", "💎", "🍀"];
const MAX_SCORE = SYMBOLS.length;

interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

function shuffledDeck(): Card[] {
  const deck = [...SYMBOLS, ...SYMBOLS]
    .map((symbol, i) => ({ id: i, symbol, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
  return deck;
}

export function MemoryMatchGame() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [cards, setCards] = useState<Card[]>(shuffledDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState<{ score: number; xpAwarded: number | null; error: string | null } | null>(null);

  useEffect(() => {
    startSession();
  }, []);

  async function startSession() {
    setResult(null);
    setCards(shuffledDeck());
    setOpen([]);
    const res = await fetch("/api/games/memory-match/start", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setSessionToken(data.sessionToken);
      setStartedAt(performance.now());
    }
  }

  const matchedCount = useMemo(() => cards.filter((c) => c.matched).length / 2, [cards]);

  async function flip(index: number) {
    if (locked || cards[index].flipped || cards[index].matched || open.length === 2) return;
    const nextCards = cards.map((c, i) => (i === index ? { ...c, flipped: true } : c));
    setCards(nextCards);
    const nextOpen = [...open, index];
    setOpen(nextOpen);

    if (nextOpen.length === 2) {
      setLocked(true);
      const [a, b] = nextOpen;
      const isMatch = nextCards[a].symbol === nextCards[b].symbol;
      setTimeout(async () => {
        setCards((prev) =>
          prev.map((c, i) =>
            i === a || i === b
              ? { ...c, matched: isMatch, flipped: isMatch }
              : c
          )
        );
        setOpen([]);
        setLocked(false);
        if (isMatch) {
          const newMatchedCount = matchedCount + 1;
          if (newMatchedCount >= MAX_SCORE) {
            await finish(newMatchedCount);
          }
        }
      }, 650);
    }
  }

  async function finish(score: number) {
    if (!sessionToken || startedAt === null) return;
    setResult({ score, xpAwarded: null, error: null });
    const durationMs = Math.round(performance.now() - startedAt);
    const res = await fetch("/api/games/memory-match/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken, score, durationMs }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult({ score, xpAwarded: data.xpAwarded, error: null });
    } else {
      setResult({ score, xpAwarded: null, error: data.error ?? "Could not submit score." });
    }
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
      <p className="text-center text-sm opacity-70 mb-4">
        Matched {matchedCount} / {MAX_SCORE} pairs
      </p>
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto" role="grid" aria-label="Memory match board">
        {cards.map((card, i) => (
          <button
            key={card.id}
            type="button"
            onClick={() => flip(i)}
            aria-label={card.flipped || card.matched ? card.symbol : "Hidden tile"}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition ${
              card.flipped || card.matched
                ? "bg-white border-2 border-[var(--color-brand)]"
                : "bg-[var(--color-brand)] text-transparent"
            }`}
          >
            {card.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
