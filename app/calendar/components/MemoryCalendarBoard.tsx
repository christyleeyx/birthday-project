"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { supabaseBrowserClient } from "@/app/supabase/client";
import { Memory } from "@/app/supabase/utils/types";
import {
  getLocalDateKey,
  getMemoryDateKey,
} from "@/app/memories/utils/memoryDates";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function getMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getReadableDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getMonthCells(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstCalendarDate = new Date(firstDayOfMonth);

  firstCalendarDate.setDate(1 - firstDayOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCalendarDate);
    date.setDate(firstCalendarDate.getDate() + index);

    return {
      date,
      dateKey: getLocalDateKey(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

interface MemoryCalendarBoardProps {
  compact?: boolean;
}

export default function MemoryCalendarBoard({
  compact = false,
}: MemoryCalendarBoardProps) {
  const todayKey = getLocalDateKey(new Date());

  const [memories, setMemories] = useState<Memory[]>([]);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: sessionData, error: sessionError } =
      await supabaseBrowserClient.auth.getSession();

    if (sessionError || !sessionData.session) {
      setMemories([]);
      setError("Please sign in to view your memory calendar.");
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabaseBrowserClient
      .from("memories")
      .select("*")
      .order("memory_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

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
          setError("Please sign in to view your memory calendar.");
          setLoading(false);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchMemories]);

  const memoriesByDate = useMemo(() => {
    return memories.reduce<Record<string, Memory[]>>((grouped, memory) => {
      if (!memory.created_at) {
        return grouped;
      }

      const dateKey = getMemoryDateKey(memory.memory_date, memory.created_at);
      grouped[dateKey] = [...(grouped[dateKey] ?? []), memory];

      return grouped;
    }, {});
  }, [memories]);

  const monthCells = useMemo(() => getMonthCells(monthDate), [monthDate]);
  const selectedMemories = memoriesByDate[selectedDateKey] ?? [];

  const handlePreviousMonth = () => {
    setMonthDate((currentDate) => {
      const previousMonth = new Date(currentDate);
      previousMonth.setMonth(currentDate.getMonth() - 1);
      return previousMonth;
    });
  };

  const handleNextMonth = () => {
    setMonthDate((currentDate) => {
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(currentDate.getMonth() + 1);
      return nextMonth;
    });
  };

  return (
    <div className={compact ? "space-y-4" : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"}>
      <div className={compact ? "" : "rounded-[2rem] border border-amber-800/20 bg-[#b97938] p-4 shadow-2xl shadow-amber-950/20 sm:p-6"}>
        <div className="rounded-[1.5rem] bg-[#f8efe0] shadow-xl">
          <div className="flex items-center justify-between border-b border-amber-200 px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="rounded-full border border-amber-200 bg-white px-4 py-2 text-lg leading-none text-slate-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
              aria-label="Previous month"
            >
              &lt;
            </button>
            <h1 className="text-lg font-semibold text-slate-900">
              {getMonthLabel(monthDate)}
            </h1>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-full border border-amber-200 bg-white px-4 py-2 text-lg leading-none text-slate-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-sm text-slate-600">Loading calendar...</div>
          ) : error ? (
            <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <div className={compact ? "p-3" : "p-3 sm:p-5"}>
              <div className="grid grid-cols-7 border-b border-amber-200 pb-3 text-center text-xs font-semibold text-slate-500">
                {WEEKDAYS.map((weekday, index) => (
                  <span key={`${weekday}-${index}`}>{weekday}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-amber-200 bg-white/70">
                {monthCells.map(({ date, dateKey, isCurrentMonth }) => {
                  const dayMemories = memoriesByDate[dateKey] ?? [];
                  const hasMemories = dayMemories.length > 0;
                  const isSelected = dateKey === selectedDateKey;
                  const isToday = dateKey === todayKey;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => setSelectedDateKey(dateKey)}
                      className={`${compact ? "min-h-14 p-1.5" : "min-h-20 p-2 sm:min-h-24"} border-b border-r border-amber-100 text-left transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-300 ${
                        isSelected ? "bg-pink-100" : "bg-white/60 hover:bg-rose-50"
                      } ${isCurrentMonth ? "text-slate-900" : "text-slate-400"}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center rounded-full font-semibold ${
                          compact ? "h-6 w-6 text-xs" : "h-7 w-7 text-sm"
                        } ${
                          isToday
                            ? "bg-blue-100 text-blue-700"
                            : isSelected
                              ? "bg-pink-600 text-white"
                              : ""
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {hasMemories ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {dayMemories.slice(0, compact ? 2 : 3).map((memory) => (
                            <span
                              key={memory.id}
                              className="h-1.5 w-1.5 rounded-full bg-pink-500"
                            />
                          ))}
                          {dayMemories.length > (compact ? 2 : 3) ? (
                            <span className="text-[10px] font-semibold text-slate-500">
                              +{dayMemories.length - (compact ? 2 : 3)}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="rounded-[2rem] border border-amber-200 bg-white/80 p-5 shadow-xl shadow-amber-950/10 backdrop-blur">
        <div className="border-b border-amber-100 pb-4">
          <p className="text-sm font-semibold text-slate-500">Selected day</p>
          <h2 className={compact ? "mt-1 font-serif text-2xl text-slate-950" : "mt-1 font-serif text-3xl text-slate-950"}>
            {getReadableDate(selectedDateKey)}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {selectedMemories.length === 0
              ? "No memories pinned here yet."
              : selectedMemories.length === 1
                ? "1 memory from this day."
                : `${selectedMemories.length} memories from this day.`}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <Link
            href={`/memories/new?date=${selectedDateKey}`}
            className="block rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 p-5 text-sm font-semibold text-slate-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            Add a memory for this day
          </Link>

          {selectedMemories.length > 0 ? (
            selectedMemories.slice(0, compact ? 2 : selectedMemories.length).map((memory) => (
              <Link
                key={memory.id}
                href={`/memories?id=${memory.id}`}
                className="block rounded-2xl border border-rose-100 bg-rose-50 p-4 transition hover:border-rose-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <p className="font-semibold text-slate-900">{memory.title}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {memory.content ?? ""}
                </p>
              </Link>
            ))
          ) : null}

          {compact ? (
            <Link
              href="/calendar"
              className="block rounded-full border border-amber-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              Open full calendar
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
