"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabaseBrowserClient } from "@/app/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabaseBrowserClient.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabaseBrowserClient.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.22),_transparent_35%),linear-gradient(135deg,_#fff7ed_0%,_#fdf2f8_48%,_#ede9fe_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center rounded-[2rem] border border-white/70 bg-white/70 px-6 py-10 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:px-8 lg:px-12">
        <div className="max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-sm font-medium text-pink-700">
            <Sparkles className="h-4 w-4" />
            Welcome to your cozy corner
          </div>
          <h1 className="text-6xl font-black tracking-tight text-slate-900 sm:text-7xl lg:text-8xl">
            Pookles
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
            A dreamy place to save little memories, notes, and sweet moments
            before they slip away.
          </p>
        </div>

        <div className="mt-10 w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-lg sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-pink-500">
            Sign in
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">
            Step inside
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use your Supabase account to continue to your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
