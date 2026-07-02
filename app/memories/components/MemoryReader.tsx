"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  GripVertical,
  MapPin,
  MoreVertical,
  Pencil,
  PlusCircle,
  Share2,
  X,
} from "lucide-react";

import { supabaseBrowserClient } from "@/app/supabase/client";
import { Memory } from "@/app/supabase/utils/types";
import { getMemoryDateKey, getMemoryDisplayDate } from "../utils/memoryDates";
import { getMemoryImageStoragePath } from "../utils/storagePaths";
import {
  buildScrapbookParagraph,
  parseScrapbookEntries,
  replaceScrapbookParagraph,
  ScrapbookEntry,
} from "../utils/scrapbook";

interface MemoryReaderProps {
  memoryId?: string;
  basePath?: "/memories" | "/memories/detail";
  showDateNavigation?: boolean;
  surface?: "standalone" | "embedded";
}

interface TimelineImage {
  url: string;
  caption: string;
  timestamp: string;
}

interface TimelineItem {
  key: string;
  type: "entry" | "image";
  data: ScrapbookEntry | TimelineImage;
  timestamp: string;
  index: number;
}

function formatMemoryDate(date: Date, style: "masthead" | "short" = "short") {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: style === "masthead" ? "2-digit" : "numeric",
  });
}

function formatEntryTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(label: string) {
  const words = label.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "ME";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getEntryAccent(entry: ScrapbookEntry) {
  if (entry.badgeClassName.includes("sky")) {
    return {
      rail: "bg-sky-300",
      avatar: "bg-sky-100 text-sky-700",
    };
  }

  if (entry.badgeClassName.includes("amber")) {
    return {
      rail: "bg-amber-300",
      avatar: "bg-amber-100 text-amber-700",
    };
  }

  if (entry.badgeClassName.includes("violet")) {
    return {
      rail: "bg-violet-300",
      avatar: "bg-violet-100 text-violet-700",
    };
  }

  return {
    rail: "bg-emerald-300",
    avatar: "bg-emerald-100 text-emerald-700",
  };
}

function getReaderHref(memoryId: string, basePath: MemoryReaderProps["basePath"]) {
  return basePath === "/memories" ? `/memories?id=${memoryId}` : `/memories?id=${memoryId}`;
}

function sortMemoriesByDate(memories: Memory[]) {
  return [...memories].sort((a, b) => {
    const dateA = getMemoryDateKey(a.memory_date, a.created_at);
    const dateB = getMemoryDateKey(b.memory_date, b.created_at);
    const dateComparison = dateA.localeCompare(dateB);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
}

function getDisplayNameFromSessionUser(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata ?? {};
  const metadataName = metadata.full_name || metadata.name;

  return (
    (typeof metadataName === "string" && metadataName.trim()) ||
    user.email?.split("@")[0] ||
    "You"
  );
}

function normalizeAuthor(value: string) {
  return value.trim().toLowerCase();
}

export default function MemoryReader({
  memoryId,
  basePath = "/memories/detail",
  showDateNavigation = false,
  surface = "standalone",
}: MemoryReaderProps) {
  const router = useRouter();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingMemory, setIsEditingMemory] = useState(false);
  const [isAddingReflection, setIsAddingReflection] = useState(false);
  const [newParagraph, setNewParagraph] = useState("");
  const [addingParagraph, setAddingParagraph] = useState(false);
  const [addParagraphError, setAddParagraphError] = useState<string | null>(null);
  const [editingParagraphIndex, setEditingParagraphIndex] = useState<number | null>(null);
  const [editingParagraphText, setEditingParagraphText] = useState("");
  const [savingParagraph, setSavingParagraph] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [paragraphEditError, setParagraphEditError] = useState<string | null>(null);

  const sortedMemories = useMemo(() => sortMemoriesByDate(memories), [memories]);
  const activeMemory =
    sortedMemories.find((memory) => memory.id === memoryId) ??
    sortedMemories[sortedMemories.length - 1] ??
    null;
  const activeIndex = activeMemory
    ? sortedMemories.findIndex((memory) => memory.id === activeMemory.id)
    : -1;
  const activeDateKey = activeMemory
    ? getMemoryDateKey(activeMemory.memory_date, activeMemory.created_at)
    : null;
  const previousMemory =
    activeDateKey && activeIndex > 0
      ? sortedMemories
          .slice(0, activeIndex)
          .reverse()
          .find(
            (memory) =>
              getMemoryDateKey(memory.memory_date, memory.created_at) <
              activeDateKey,
          ) ?? null
      : null;
  const nextMemory =
    activeDateKey && activeIndex >= 0
      ? sortedMemories
          .slice(activeIndex + 1)
          .find(
            (memory) =>
              getMemoryDateKey(memory.memory_date, memory.created_at) >
              activeDateKey,
          ) ?? null
      : null;

  const imageUrls = Array.isArray(activeMemory?.image_urls)
    ? activeMemory.image_urls
    : [];
  const imageCaptions = Array.isArray(activeMemory?.image_captions)
    ? activeMemory.image_captions
    : [];
  const imageTimestamps = Array.isArray(activeMemory?.image_timestamps)
    ? activeMemory.image_timestamps
    : [];
  const displayDate = getMemoryDisplayDate(
    activeMemory?.memory_date,
    activeMemory?.created_at,
  );
  const scrapbookEntries = parseScrapbookEntries(
    activeMemory?.content ?? "",
    activeMemory?.created_at ?? displayDate.toISOString(),
  );
  const timeline: TimelineItem[] = [];

  scrapbookEntries.forEach((entry, index) => {
    timeline.push({
      key: `entry:${entry.paragraphIndex}`,
      type: "entry",
      data: entry,
      timestamp: entry.timestamp,
      index,
    });
  });

  imageUrls.forEach((url, index) => {
    const timestamp =
      imageTimestamps[index] ??
      activeMemory?.created_at ??
      displayDate.toISOString();

    timeline.push({
      key: `image:${index}`,
      type: "image",
      data: {
        url,
        caption: imageCaptions[index] ?? "",
        timestamp,
      },
      timestamp,
      index,
    });
  });

  timeline.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const storedTimelineOrder = Array.isArray(activeMemory?.timeline_order)
    ? activeMemory.timeline_order
    : [];
  const orderedTimeline =
    storedTimelineOrder.length > 0
      ? [...timeline].sort((a, b) => {
          const indexA = storedTimelineOrder.indexOf(a.key);
          const indexB = storedTimelineOrder.indexOf(b.key);

          if (indexA === -1 && indexB === -1) {
            return (
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          }

          if (indexA === -1) return 1;
          if (indexB === -1) return -1;

          return indexA - indexB;
        })
      : timeline;
  const canDeleteActiveMemory =
    Boolean(activeMemory && currentUserId && activeMemory.user_id === currentUserId);

  const isOwnEntry = (entry: ScrapbookEntry) => {
    if (!currentUserName) {
      return false;
    }

    const entryAuthor = entry.author || entry.label;

    return normalizeAuthor(entryAuthor) === normalizeAuthor(currentUserName);
  };

  const loadMemories = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: sessionData, error: sessionError } =
      await supabaseBrowserClient.auth.getSession();

    if (sessionError || !sessionData.session) {
      setError("Please sign in to view memories.");
      setCurrentUserId(null);
      setCurrentUserName(null);
      setMemories([]);
      setLoading(false);
      return;
    }

    setCurrentUserId(sessionData.session.user.id);
    setCurrentUserName(getDisplayNameFromSessionUser(sessionData.session.user));

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
    void Promise.resolve().then(loadMemories);
  }, [loadMemories]);

  const handleShare = async () => {
    if (typeof window === "undefined" || !activeMemory) {
      return;
    }

    const url = `${window.location.origin}/memories?id=${activeMemory.id}`;

    if (navigator.share) {
      await navigator.share({
        title: activeMemory.title,
        url,
      });
      return;
    }

    await navigator.clipboard?.writeText(url);
  };

  const handleDelete = async () => {
    if (!activeMemory) return;

    setIsDeleting(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } =
        await supabaseBrowserClient.auth.getSession();

      if (sessionError || !sessionData.session) {
        setError("Please sign in to delete this memory.");
        return;
      }

      if (activeMemory.user_id !== sessionData.session.user.id) {
        setError("Only the person who created this memory can delete it.");
        return;
      }

      const { data: deletedMemory, error: deleteError } = await supabaseBrowserClient
        .from("memories")
        .delete()
        .eq("id", activeMemory.id)
        .eq("user_id", sessionData.session.user.id)
        .select("id")
        .single();

      if (deleteError || !deletedMemory) {
        setError(deleteError?.message || "This memory could not be deleted.");
        return;
      }

      const storagePaths = imageUrls
        .map((imageUrl) => getMemoryImageStoragePath(imageUrl))
        .filter((storagePath): storagePath is string => Boolean(storagePath));

      if (storagePaths.length > 0) {
        await supabaseBrowserClient.storage.from("memories").remove(storagePaths);
      }

      router.push("/memories");
      await loadMemories();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddParagraph = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddParagraphError(null);

    if (!activeMemory) {
      setAddParagraphError("Choose a memory before adding a reflection.");
      return;
    }

    if (!newParagraph.trim()) {
      setAddParagraphError("Write a note before adding it to the scrapbook.");
      return;
    }

    setAddingParagraph(true);

    const { data: sessionData, error: sessionError } =
      await supabaseBrowserClient.auth.getSession();

    if (sessionError || !sessionData.session) {
      setAddingParagraph(false);
      setAddParagraphError("Please sign in to add to the scrapbook.");
      return;
    }

    const metadata = sessionData.session.user.user_metadata ?? {};
    const displayName =
      metadata.full_name ||
      metadata.name ||
      sessionData.session.user.email?.split("@")[0] ||
      "You";
    const nextContent = [
      activeMemory.content?.trim(),
      buildScrapbookParagraph(
        displayName,
        newParagraph.trim(),
        new Date().toISOString(),
      ),
    ]
      .filter(Boolean)
      .join("\n\n");

    const { data: updatedMemory, error: updateError } = await supabaseBrowserClient
      .from("memories")
      .update({ content: nextContent })
      .eq("id", activeMemory.id)
      .select("id")
      .single();

    if (updateError || !updatedMemory) {
      setAddParagraphError(
        updateError?.message ||
          "This memory could not be updated. Check that shared memory update policies have been applied.",
      );
      setAddingParagraph(false);
      return;
    }

    setNewParagraph("");
    setIsAddingReflection(false);
    await loadMemories();
    setAddingParagraph(false);
  };

  const startEditingEntry = (entry: ScrapbookEntry) => {
    setParagraphEditError(null);
    setEditingParagraphIndex(entry.paragraphIndex);
    setEditingParagraphText(entry.text);
  };

  const cancelEditingEntry = () => {
    setParagraphEditError(null);
    setEditingParagraphIndex(null);
    setEditingParagraphText("");
  };

  const toggleEditingMemory = () => {
    setIsEditingMemory((current) => {
      if (current) {
        cancelEditingEntry();
      }

      return !current;
    });
  };

  const moveTimelineItem = async (itemKey: string, direction: -1 | 1) => {
    if (!activeMemory) {
      return;
    }

    const currentOrder = orderedTimeline.map((item) => item.key);
    const currentIndex = currentOrder.indexOf(itemKey);
    const nextIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= currentOrder.length
    ) {
      return;
    }

    const nextOrder = [...currentOrder];
    const [movedItem] = nextOrder.splice(currentIndex, 1);
    nextOrder.splice(nextIndex, 0, movedItem);
    setSavingOrder(true);

    const { data: updatedMemory, error: updateError } = await supabaseBrowserClient
      .from("memories")
      .update({ timeline_order: nextOrder })
      .eq("id", activeMemory.id)
      .select("id")
      .single();

    if (updateError || !updatedMemory) {
      setError(updateError?.message || "Could not rearrange this memory.");
      setSavingOrder(false);
      return;
    }

    await loadMemories();
    setSavingOrder(false);
  };

  const saveEditedEntry = async (entry: ScrapbookEntry) => {
    if (!activeMemory) {
      return;
    }

    setParagraphEditError(null);

    if (!isOwnEntry(entry)) {
      setParagraphEditError("You can only edit reflections you wrote.");
      return;
    }

    if (!editingParagraphText.trim()) {
      setParagraphEditError("A reflection cannot be empty.");
      return;
    }

    setSavingParagraph(true);

    const nextContent = replaceScrapbookParagraph(
      activeMemory.content,
      entry.paragraphIndex,
      buildScrapbookParagraph(
        entry.author || entry.label,
        editingParagraphText.trim(),
        entry.timestamp,
      ),
    );

    const { data: updatedMemory, error: updateError } = await supabaseBrowserClient
      .from("memories")
      .update({ content: nextContent })
      .eq("id", activeMemory.id)
      .select("id")
      .single();

    if (updateError || !updatedMemory) {
      setParagraphEditError(updateError?.message || "Could not save reflection.");
      setSavingParagraph(false);
      return;
    }

    cancelEditingEntry();
    await loadMemories();
    setSavingParagraph(false);
  };

  return (
    <div
      className={
        surface === "embedded"
          ? "memory-paper rounded-[1.75rem] border border-amber-200/70 bg-[#fbfaf8] shadow-xl shadow-amber-950/10"
          : "memory-paper min-h-screen"
      }
    >
      {surface === "standalone" ? (
        <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[#fbfaf8]/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-950 transition hover:bg-stone-200/60 focus:outline-none focus:ring-2 focus:ring-stone-300"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="font-serif text-lg font-semibold leading-tight text-slate-950">
                Timeline
              </p>
              <p className="truncate text-xs text-stone-600">
                Chapter: New Beginnings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-950 transition hover:bg-stone-200/60 focus:outline-none focus:ring-2 focus:ring-stone-300"
              aria-label="Share memory"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <Link
              href="/memories/new"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-950 transition hover:bg-stone-200/60 focus:outline-none focus:ring-2 focus:ring-stone-300"
              aria-label="Add memory"
            >
              <MoreVertical className="h-5 w-5" />
            </Link>
          </div>
        </div>
        </header>
      ) : null}

      <main
        className={
          surface === "embedded"
            ? "mx-auto max-w-[760px] px-5 py-10 sm:px-8 lg:py-12"
            : "mx-auto max-w-[760px] px-5 pb-24 pt-12 sm:px-8"
        }
      >
        {loading ? (
          <div className="rounded-lg border border-stone-200 bg-white/75 p-8 text-center text-sm text-stone-600 shadow-sm">
            Loading memory...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50/85 p-6 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        ) : !activeMemory ? (
          <div className="rounded-lg border border-stone-200 bg-white/75 p-8 text-center text-sm text-stone-600 shadow-sm">
            No memories found.
          </div>
        ) : (
          <article>
            {showDateNavigation ? (
              <nav className="mb-10 grid grid-cols-2 gap-3">
                {previousMemory ? (
                  <Link
                    href={getReaderHref(previousMemory.id, basePath)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white/55 px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous date
                  </Link>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white/30 px-4 py-2.5 text-sm text-stone-400">
                    Previous date
                  </span>
                )}

                {nextMemory ? (
                  <Link
                    href={getReaderHref(nextMemory.id, basePath)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white/55 px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
                  >
                    Next date
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white/30 px-4 py-2.5 text-sm text-stone-400">
                    Next date
                  </span>
                )}
              </nav>
            ) : null}

            <section className="mb-16 text-center">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-[#8b4b46]">
                {formatMemoryDate(displayDate, "masthead").toUpperCase()}
              </p>
              <h1 className="mt-3 font-serif text-4xl font-black leading-none tracking-normal text-slate-950 sm:text-5xl">
                {activeMemory.title}
              </h1>
              <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-sm text-stone-700">
                <MapPin className="h-4 w-4" />
                {formatMemoryDate(displayDate)}
              </p>
              {basePath === "/memories" ? (
                <Link
                  href={`/memories?id=${activeMemory.id}`}
                  className="mt-4 inline-flex rounded-full border border-stone-300 bg-white/45 px-4 py-2 text-xs font-medium text-stone-700 transition hover:bg-white"
                >
                  Open share link
                </Link>
              ) : null}
            </section>

            <section className="space-y-11">
              {orderedTimeline.length > 0 ? (
                orderedTimeline.map((item, timelineIndex) => {
                  if (item.type === "entry") {
                    const entry = item.data as ScrapbookEntry;
                    const accent = getEntryAccent(entry);
                    const isEditingThisEntry =
                      editingParagraphIndex === entry.paragraphIndex;
                    const canEditThisEntry = isOwnEntry(entry);

                    return (
                      <section
                        key={`entry-${item.index}`}
                        className="relative overflow-hidden rounded-lg bg-white/58 py-6 pl-7 pr-6 shadow-[0_18px_45px_rgba(40,32,24,0.06)] ring-1 ring-black/[0.025] sm:px-9"
                      >
                        {isEditingMemory ? (
                          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 shadow-sm">
                            <GripVertical className="h-4 w-4 text-stone-400" />
                            <button
                              type="button"
                              onClick={() => moveTimelineItem(item.key, -1)}
                              disabled={timelineIndex === 0 || savingOrder}
                              className="rounded-full px-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTimelineItem(item.key, 1)}
                              disabled={
                                timelineIndex === orderedTimeline.length - 1 ||
                                savingOrder
                              }
                              className="rounded-full px-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              Down
                            </button>
                          </div>
                        ) : null}
                        <span
                          className={`absolute inset-y-0 left-0 w-1 ${accent.rail}`}
                          aria-hidden="true"
                        />
                        <div className="flex items-start gap-4">
                          <span
                            className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-medium ${accent.avatar}`}
                          >
                            {getInitials(entry.label)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-4 text-sm leading-snug text-slate-900">
                              <p>{entry.label}</p>
                              <p>{formatEntryTime(entry.timestamp)}</p>
                            </div>
                            {isEditingThisEntry ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editingParagraphText}
                                  onChange={(event) =>
                                    setEditingParagraphText(event.target.value)
                                  }
                                  rows={5}
                                  className="w-full resize-none rounded-lg border border-stone-200 bg-white/90 px-3 py-3 text-[0.96rem] leading-7 text-slate-950 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                                  aria-label="Edit reflection"
                                />
                                {paragraphEditError ? (
                                  <p className="text-sm text-rose-600">
                                    {paragraphEditError}
                                  </p>
                                ) : null}
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => saveEditedEntry(entry)}
                                    disabled={savingParagraph}
                                    className="inline-flex items-center gap-2 rounded-full bg-stone-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <Check className="h-4 w-4" />
                                    {savingParagraph ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditingEntry}
                                    className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-white"
                                  >
                                    <X className="h-4 w-4" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="whitespace-pre-line text-[0.96rem] leading-7 text-slate-950">
                                  {entry.text}
                                </p>
                                {isEditingMemory && canEditThisEntry ? (
                                  <button
                                    type="button"
                                    onClick={() => startEditingEntry(entry)}
                                    className="mt-4 rounded-full border border-stone-300 bg-white/45 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-white"
                                  >
                                    Edit this reflection
                                  </button>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      </section>
                    );
                  }

                  const imageItem = item.data as TimelineImage;

                  return (
                    <figure key={`image-${item.index}`} className="relative">
                      {isEditingMemory ? (
                        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 shadow-sm">
                          <GripVertical className="h-4 w-4 text-stone-400" />
                          <button
                            type="button"
                            onClick={() => moveTimelineItem(item.key, -1)}
                            disabled={timelineIndex === 0 || savingOrder}
                            className="rounded-full px-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTimelineItem(item.key, 1)}
                            disabled={
                              timelineIndex === orderedTimeline.length - 1 ||
                              savingOrder
                            }
                            className="rounded-full px-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            Down
                          </button>
                        </div>
                      ) : null}
                      <div className="overflow-hidden rounded-lg bg-stone-900 shadow-[0_18px_45px_rgba(32,24,16,0.14)] ring-1 ring-black/10">
                        {/* Public Supabase image URLs are not configured for next/image yet. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageItem.url}
                          alt={imageItem.caption || activeMemory.title}
                          className="aspect-[2.9/1] w-full object-cover"
                        />
                      </div>
                      {imageItem.caption ? (
                        <figcaption className="mx-auto mt-3 max-w-xl text-center text-sm italic text-stone-600">
                          {imageItem.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  );
                })
              ) : (
                <p className="rounded-lg bg-white/58 p-6 text-center text-sm text-stone-600 shadow-sm">
                  No entries yet. Start the story below.
                </p>
              )}
            </section>

            <section className="mt-16 flex flex-col items-center gap-5">
              {isAddingReflection ? (
                <form
                  onSubmit={handleAddParagraph}
                  className="w-full rounded-lg bg-white/68 p-5 shadow-[0_18px_45px_rgba(40,32,24,0.06)] ring-1 ring-black/[0.03]"
                >
                  <label className="block">
                    <span className="text-sm font-medium text-stone-700">
                      Add your reflection
                    </span>
                    <textarea
                      value={newParagraph}
                      onChange={(event) => setNewParagraph(event.target.value)}
                      rows={4}
                      placeholder="Write your thoughts or feelings about this memory..."
                      className="mt-2 w-full resize-none rounded-lg border border-stone-200 bg-white/90 px-3 py-3 text-sm text-slate-950 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                    />
                  </label>
                  {addParagraphError ? (
                    <p className="mt-3 text-sm text-rose-600">
                      {addParagraphError}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingReflection(false)}
                      className="rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingParagraph}
                      className="rounded-full bg-stone-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingParagraph ? "Adding..." : "Add Reflection"}
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingReflection((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/50 px-5 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Reflection
                </button>
                <button
                  type="button"
                  onClick={toggleEditingMemory}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-stone-300 ${
                    isEditingMemory
                      ? "bg-stone-700 text-white hover:bg-stone-800"
                      : "border border-stone-300 bg-white/50 text-stone-800 hover:bg-white"
                  }`}
                >
                  <Pencil className="h-4 w-4" />
                  {isEditingMemory ? "Done Editing" : "Edit Memory"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || !canDeleteActiveMemory}
                  className="inline-flex items-center rounded-full border border-rose-200 bg-white/45 px-5 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting
                    ? "Deleting..."
                    : canDeleteActiveMemory
                      ? "Delete"
                      : "Only creator can delete"}
                </button>
              </div>

              <p className="text-center text-sm italic text-stone-600">
                Last updated by{" "}
                {scrapbookEntries.length > 0
                  ? scrapbookEntries[scrapbookEntries.length - 1].label
                  : "you"}{" "}
                on{" "}
                {activeMemory.updated_at || activeMemory.created_at
                  ? formatMemoryDate(
                      new Date(
                        activeMemory.updated_at || activeMemory.created_at || "",
                      ),
                    )
                  : formatMemoryDate(displayDate)}
              </p>
            </section>

          </article>
        )}
      </main>
    </div>
  );
}
