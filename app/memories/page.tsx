// app/memories/page.tsx

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import AppShell from "@/app/components/AppShell";
import MemoryReader from "./components/MemoryReader";

export default function MemoriesPage() {
  return (
    <AppShell variant="reader">
      <Suspense fallback={<MemoryReader showDateNavigation basePath="/memories" />}>
        <MemoriesPageContent />
      </Suspense>
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
    />
  );
}
