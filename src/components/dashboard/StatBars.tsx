"use client";

const STAT_META: { key: "hunger" | "clean" | "energy" | "happiness" | "health"; label: string; icon: string }[] = [
  { key: "hunger", label: "Hunger", icon: "🍎" },
  { key: "clean", label: "Cleanliness", icon: "🧼" },
  { key: "energy", label: "Energy", icon: "⚡" },
  { key: "happiness", label: "Happiness", icon: "💛" },
  { key: "health", label: "Health", icon: "❤️" },
];

export function StatBars({
  stats,
}: {
  stats: Record<"hunger" | "clean" | "energy" | "happiness" | "health", number>;
}) {
  return (
    <div className="space-y-2" role="group" aria-label="Pet stats">
      {STAT_META.map(({ key, label, icon }) => {
        const value = Math.round(stats[key]);
        const color = value < 25 ? "#d15b6e" : value < 55 ? "#e8944a" : "#7cc78f";
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs font-semibold mb-0.5">
              <span>
                <span aria-hidden>{icon}</span> {label}
              </span>
              <span>{value}</span>
            </div>
            <div
              className="h-2.5 w-full rounded-full bg-black/10 overflow-hidden"
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={label}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${value}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
