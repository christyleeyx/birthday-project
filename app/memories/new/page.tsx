// app/memories/new/page.tsx

"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import MemoryForm from "../components/MemoryForm";
import { getLocalDateKey, isDateKey } from "../utils/memoryDates";

export default function NewMemoryPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="max-w-3xl rounded-2xl border border-rose-100 bg-white p-8 shadow-sm">
            <p className="text-sm text-slate-600">Loading memory form...</p>
          </div>
        </AppShell>
      }
    >
      <NewMemoryPageContent />
    </Suspense>
  );
}

function NewMemoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get("date");
  const memoryDate = isDateKey(requestedDate)
    ? requestedDate
    : getLocalDateKey(new Date());

  const handleSuccess = () => {
    router.push("/memories");
  };

  return (
    <AppShell>
      <div className="max-w-3xl rounded-2xl border border-rose-100 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Add New Memory
            </h1>
            <p className="mt-2 text-slate-600">
              Share a favorite memory so you can revisit it later.
            </p>
          </div>

          <Link
            href="/memories"
            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-2"
          >
            Back to Memory List
          </Link>
        </div>

        <MemoryForm
          memoryDate={memoryDate}
          submitLabel="Create Memory"
          onSuccess={handleSuccess}
        />
      </div>
    </AppShell>
  );
}
