import Link from "next/link";
import { ReflexTapGame } from "@/components/games/ReflexTapGame";

export default function ReflexTapPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Reflex Tap</h1>
        <Link href="/games" className="text-sm font-semibold text-[var(--color-brand)]">
          ← All games
        </Link>
      </div>
      <ReflexTapGame />
    </main>
  );
}
