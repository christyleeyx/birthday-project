"use client";

import { FormEvent, useEffect, useState } from "react";
import { MailOpen, Send, X } from "lucide-react";

import AppShell from "@/app/components/AppShell";
import { supabaseBrowserClient } from "@/app/supabase/client";

interface FeedbackNote {
  id: string;
  author: string;
  note: string;
  created_at: string;
}

function getDisplayName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata ?? {};
  const metadataName = metadata.full_name || metadata.name;

  return (
    (typeof metadataName === "string" && metadataName.trim()) ||
    user.email?.split("@")[0] ||
    "Someone"
  );
}

export default function FeedbackPage() {
  const [notes, setNotes] = useState<FeedbackNote[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isTossing, setIsTossing] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabaseBrowserClient
      .from("feedback_notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setNotes([]);
    } else {
      setNotes((data as FeedbackNote[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(loadNotes);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!note.trim()) {
      setError("Write a note before sending it.");
      return;
    }

    setSaving(true);

    const { data: sessionData, error: sessionError } =
      await supabaseBrowserClient.auth.getSession();

    if (sessionError || !sessionData.session) {
      setSaving(false);
      setError("Please sign in to leave feedback.");
      return;
    }

    const { error: insertError } = await supabaseBrowserClient
      .from("feedback_notes")
      .insert({
        user_id: sessionData.session.user.id,
        author: getDisplayName(sessionData.session.user),
        note: note.trim(),
      });

    if (insertError) {
      setSaving(false);
      setError(insertError.message);
      return;
    }

    setIsTossing(true);
    setNote("");
    await new Promise((resolve) => setTimeout(resolve, 780));
    setIsTossing(false);
    await loadNotes();
    setSaving(false);
  };

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 py-8">
        <header className="text-center">
          <p className="font-serif text-4xl italic tracking-wide text-slate-950">
            Feedback
          </p>
          <p className="mt-2 max-w-lg text-sm text-slate-700">
            Drop a tiny note into the box and keep the sweet bits together.
          </p>
        </header>

        <section className="relative w-full max-w-xl rounded-[1.75rem] border border-amber-200 bg-[#fff8d8]/90 p-6 shadow-xl shadow-amber-950/10">
          {isTossing ? (
            <div className="feedback-toss pointer-events-none absolute left-1/2 top-16 z-20 w-44 rounded-lg bg-pink-100 p-4 text-sm font-medium text-slate-800 shadow-xl">
              Sent with love
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="mx-auto mb-6 flex h-36 w-48 flex-col items-center justify-center rounded-b-[2rem] rounded-t-lg border-4 border-amber-300 bg-[#f6c45f] text-slate-900 shadow-inner shadow-amber-900/20 transition hover:-translate-y-1 hover:bg-[#ffd572] focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            <MailOpen className="h-9 w-9" />
            <span className="mt-3 text-sm font-bold">
              Open box ({notes.length})
            </span>
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={5}
              placeholder="Write a little feedback note..."
              className="w-full resize-none rounded-2xl border border-amber-200 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {saving ? "Sending..." : "Send to box"}
            </button>
          </form>
        </section>

        {isOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4"
            role="dialog"
            aria-modal="true"
          >
            <section className="max-h-[82vh] w-full max-w-4xl overflow-auto rounded-[1.75rem] bg-[#fff8d8] p-5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-serif text-3xl font-semibold text-slate-950">
                  Feedback box
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm transition hover:bg-rose-50"
                  aria-label="Close feedback box"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {loading ? (
                <p className="text-sm text-slate-600">Loading notes...</p>
              ) : notes.length === 0 ? (
                <p className="text-sm text-slate-600">No notes yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {notes.map((feedbackNote, index) => (
                    <article
                      key={feedbackNote.id}
                      className={`min-h-36 rounded-lg p-4 shadow-sm ${
                        index % 3 === 0
                          ? "bg-pink-100"
                          : index % 3 === 1
                            ? "bg-amber-100"
                            : "bg-lime-100"
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm leading-6 text-slate-900">
                        {feedbackNote.note}
                      </p>
                      <p className="mt-4 text-xs font-semibold text-slate-600">
                        {feedbackNote.author}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
