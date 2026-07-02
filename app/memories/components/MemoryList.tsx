"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Memory } from "../../supabase/utils/types";
import { supabaseBrowserClient } from "../../supabase/client";
import { getMemoryDisplayDate } from "../utils/memoryDates";
import { parseScrapbookEntries } from "../utils/scrapbook";

export default function MemoryList() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: sessionData, error: sessionError } =
      await supabaseBrowserClient.auth.getSession();

    if (sessionError || !sessionData.session) {
      setMemories([]);
      setError("Please sign in to view your memories.");
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabaseBrowserClient
      .from("memories")
      .select("*")
      .order("memory_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setMemories([]);
    } else {
      setMemories((data as Memory[]) ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchMemories);
  }, [fetchMemories]);

  useEffect(() => {
    const { data: authListener } = supabaseBrowserClient.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          void fetchMemories();
        } else {
          setMemories([]);
          setError("Please sign in to view your memories.");
          setLoading(false);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchMemories]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50 p-8 text-slate-500">
          Loading memories...
        </div>
      ) : error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error}
        </div>
      ) : memories.length === 0 ? (
        <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50 p-8 text-slate-600">
          No memories found. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-5">
          {memories.map((memory) => {
            const memoryDisplayDate = getMemoryDisplayDate(
              memory.memory_date,
              memory.created_at,
            );
            const entries = parseScrapbookEntries(
              memory.content,
              memory.created_at ?? memoryDisplayDate.toISOString(),
            );
            const previewText = entries.length > 0 ? entries[0].text : memory.content ?? "";

            return (
              <article
                key={memory.id}
                className="rounded-[1.75rem] border border-rose-100 bg-[linear-gradient(135deg,_#fffaf4_0%,_#fff7ed_100%)] p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {memory.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {memoryDisplayDate.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <Link
                    href={`/memories/${memory.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-2"
                  >
                    Open scrapbook
                  </Link>
                </div>

                <div className="mt-5 rounded-[1.25rem] border border-dashed border-rose-200 bg-white/70 p-4">
                  <div className="space-y-3">
                    {entries.length > 0 ? (
                      entries.slice(0, 3).map((entry, index) => (
                        <div
                          key={`${memory.id}-${index}`}
                          className={`rounded-2xl border p-4 ${entry.cardClassName}`}
                        >
                          <p className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${entry.badgeClassName}`}>
                            {entry.label}
                          </p>
                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                            {entry.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-slate-700">
                        {previewText}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
