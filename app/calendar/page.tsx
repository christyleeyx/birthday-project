import Link from "next/link";
import MemoryCalendarBoard from "./components/MemoryCalendarBoard";
import AppShell from "@/app/components/AppShell";

export default function CalendarPage() {
  return (
    <AppShell>
      <div className="max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-4xl italic tracking-wide text-slate-950">
              Calendar board
            </p>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">
              Pick a day to see the memories pinned to it.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/memories"
              className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-2"
            >
              Memory list
            </Link>
            <Link
              href="/memories/new"
              className="inline-flex items-center justify-center rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
            >
              Add memory
            </Link>
          </div>
        </header>

        <section className="mt-8">
          <MemoryCalendarBoard />
        </section>
      </div>
    </AppShell>
  );
}
