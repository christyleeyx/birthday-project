// app/memories/page.tsx

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import AppShell from "@/app/components/AppShell";
import MemoryReader from "./components/MemoryReader";

export default function MemoriesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-4xl italic tracking-wide text-slate-950">
              Memories
            </p>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">
              Read through your shared timeline without leaving the dashboard.
            </p>
          </div>

          <Link
            href="/memories/new"
            className="inline-flex items-center justify-center rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
          >
            Add memory
          </Link>
        </header>

        <Suspense
          fallback={
            <MemoryReader
              showDateNavigation
              basePath="/memories"
              surface="embedded"
            />
          }
        >
          <MemoriesPageContent />
        </Suspense>
      </div>
    </AppShell>
  );
}

function MemoriesPageContent() {
  const searchParams = useSearchParams();
  const memoryId = searchParams.get("id") ?? undefined;

  return (
    <MemoryReader
      memoryId={memoryId}
      basePath="/memories"
      showDateNavigation
      surface="embedded"
    />
  );
}
