"use client";

import type { CareAction } from "@/lib/care";

const ACTIONS: { action: CareAction; label: string; icon: string }[] = [
  { action: "feed", label: "Feed", icon: "🍎" },
  { action: "clean", label: "Clean", icon: "🧼" },
  { action: "play", label: "Play", icon: "🎾" },
  { action: "pet", label: "Pet", icon: "✋" },
  { action: "celebrate", label: "Celebrate", icon: "🎉" },
];

export function ActionBar({
  isAsleep,
  isSick,
  disabled,
  onAction,
}: {
  isAsleep: boolean;
  isSick: boolean;
  disabled?: boolean;
  onAction: (action: CareAction) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Care actions">
      {ACTIONS.map(({ action, label, icon }) => (
        <button
          key={action}
          type="button"
          disabled={disabled || isAsleep}
          onClick={() => onAction(action)}
          className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--color-card-border)] bg-white py-3 text-xs font-semibold disabled:opacity-40"
        >
          <span className="text-xl" aria-hidden>{icon}</span>
          {label}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction(isAsleep ? "sleep_end" : "sleep_start")}
        className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--color-card-border)] bg-white py-3 text-xs font-semibold disabled:opacity-40"
      >
        <span className="text-xl" aria-hidden>{isAsleep ? "☀️" : "😴"}</span>
        {isAsleep ? "Wake up" : "Sleep"}
      </button>
      {isSick && (
        <button
          type="button"
          disabled={disabled || isAsleep}
          onClick={() => onAction("heal")}
          className="flex flex-col items-center gap-1 rounded-2xl border border-red-300 bg-red-50 py-3 text-xs font-semibold text-red-700 disabled:opacity-40 col-span-3"
        >
          <span className="text-xl" aria-hidden>💊</span>
          Give medicine
        </button>
      )}
    </div>
  );
}
