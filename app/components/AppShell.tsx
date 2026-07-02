"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { supabaseBrowserClient } from "@/app/supabase/client";

interface AppShellProps {
  children: ReactNode;
  variant?: "default" | "reader";
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "H" },
  { href: "/calendar", label: "Calendar", icon: "C" },
  { href: "/memories", label: "Memories", icon: "M" },
  { href: "/feedback", label: "Feedback", icon: "F" },
  { href: "/memories/new", label: "New memory", icon: "+" },
];

export default function AppShell({
  children,
  variant = "default",
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseBrowserClient.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }

      setUserEmail(data.session.user.email ?? null);
      setLoading(false);
    });
  }, [router]);

  const handleSignOut = async () => {
    await supabaseBrowserClient.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="sweet-patchwork flex min-h-screen items-center justify-center px-6">
        <p className="text-sm font-medium text-slate-600">
          Checking your session...
        </p>
      </main>
    );
  }

  if (variant === "reader") {
    return (
      <main className="min-h-screen bg-[#fbfaf8] text-slate-950">
        {children}
      </main>
    );
  }

  return (
    <main className="sweet-patchwork min-h-screen text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[96rem] flex-col lg:flex-row">
        <aside className="border-b border-amber-200/70 bg-[#fff4be]/88 px-4 py-4 shadow-sm backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link
              href="/dashboard"
              className="font-serif text-3xl italic tracking-wide text-slate-950"
            >
              Pookles
              <span className="ml-1 inline-block rotate-12 text-2xl text-orange-400">
                *
              </span>
            </Link>

            <Link
              href="/memories/new"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-xl font-semibold text-slate-700 shadow-sm transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200 lg:hidden"
              aria-label="Create memory"
            >
              +
            </Link>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-pink-200 ${
                    isActive
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-700 hover:bg-white/70"
                  }`}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-amber-200 bg-white text-sm">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-white/70 p-4 lg:mt-auto">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              My profile
            </p>
            <p className="mt-2 break-words text-sm font-medium text-slate-800">
              {userEmail}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 w-full rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              Sign out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </section>
      </div>
    </main>
  );
}
