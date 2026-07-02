import Link from "next/link";

import MemoryCalendarBoard from "@/app/calendar/components/MemoryCalendarBoard";
import AppShell from "@/app/components/AppShell";
import InteractiveNoticeBoard from "./components/InteractiveNoticeBoard";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-4xl italic tracking-wide text-slate-950">
              Dashboard
            </p>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">
              Your notice board, calendar, and memories in one place.
            </p>
          </div>

          <Link
            href="/memories/new"
            className="inline-flex items-center justify-center rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
          >
            Add memory
          </Link>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <InteractiveNoticeBoard />

          <div className="xl:sticky xl:top-8 xl:self-start">
            <MemoryCalendarBoard compact />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
