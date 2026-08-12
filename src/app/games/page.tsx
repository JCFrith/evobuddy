import Link from "next/link";

const GAMES = [
  { slug: "memory-match", title: "Memory Match", icon: "🧠", blurb: "Flip tiles and find every matching pair." },
  { slug: "reflex-tap", title: "Reflex Tap", icon: "⚡", blurb: "Tap the glowing target as fast as you can." },
];

export default function GamesHubPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Mini-games</h1>
        <Link href="/pet" className="text-sm font-semibold text-[var(--color-brand)]">
          ← Back to buddy
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((g) => (
          <Link
            key={g.slug}
            href={`/games/${g.slug}`}
            className="rounded-3xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-5 hover:border-[var(--color-brand)] transition"
          >
            <div className="text-3xl mb-2" aria-hidden>{g.icon}</div>
            <div className="font-display font-bold">{g.title}</div>
            <div className="text-sm opacity-70">{g.blurb}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
