// app/memories/[id]/page.tsx

"use client";

import { useParams } from "next/navigation";

import AppShell from "@/app/components/AppShell";
import MemoryReader from "../components/MemoryReader";

export default function MemoryDetailPage() {
  const params = useParams();
  const memoryId = params?.id as string | undefined;

  return (
    <AppShell variant="reader">
      <MemoryReader memoryId={memoryId} showDateNavigation />
    </AppShell>
  );
}
