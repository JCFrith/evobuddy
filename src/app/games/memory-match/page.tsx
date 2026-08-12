import Link from "next/link";
import { MemoryMatchGame } from "@/components/games/MemoryMatchGame";

export default function MemoryMatchPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Memory Match</h1>
        <Link href="/games" className="text-sm font-semibold text-[var(--color-brand)]">
          ← All games
        </Link>
      </div>
      <MemoryMatchGame />
    </main>
  );
}
